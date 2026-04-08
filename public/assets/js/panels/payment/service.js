/* panels/payment/service.js - orchestration métier du paiement */
window.TicketPaymentService = (() => {
  const shared = window.TicketPaymentShared;
  const dialogs = window.TicketPaymentDialogs;
  if (!shared || !dialogs) {
    throw new Error('TicketPaymentShared et TicketPaymentDialogs sont requis avant TicketPaymentService.');
  }

  const {
    swalBase,
    wait,
    getSelectedCceId,
    setSelectedCce,
    requestCceScanFromSimulator,
    requestCcePinFromSimulator,
    formatMoney,
    toCents,
    fromCents,
    notifySimulator,
    getScannedCceInfo,
    getItemsTotal,
    getItemsEnergyTotal,
    normalizePaymentPlan,
    collectTransactionIds,
    buildBreakdownHtml,
    resolvePrimaryMethodFromTotals,
  } = shared;

  const {
    chooseEncaissementMode,
    chooseItemsToPay,
    choosePaymentPlan,
    promptCashAmount,
    chooseReceipt,
  } = dialogs;

  async function ensureCcePaymentReady(amountToDebit, cceOverride = null) {
    const overrideId = Number(cceOverride?.idCarte || 0);
    const overrideSolde = Number(cceOverride?.solde ?? NaN);

    let authContext = null;

    if (overrideId > 0 && Number.isFinite(overrideSolde)) {
      if (overrideSolde < Number(amountToDebit || 0)) {
        await Swal.fire({
          ...swalBase,
          icon: 'warning',
          title: 'Solde CCE insuffisant',
          html: `Solde courant : <strong>${formatMoney(overrideSolde)}</strong><br>Montant CCE : <strong>${formatMoney(amountToDebit)}</strong>`,
          confirmButtonText: 'Fermer',
        });
        return { retry: true };
      }
      authContext = {
        idCarte: overrideId,
        nom: String(window.CCESelection?.nom || ''),
        prenom: String(window.CCESelection?.prenom || ''),
      };
      const auth = await requestCcePinFromSimulator(authContext);
      if (!auth?.ok) {
        if (String(auth?.status || '') === 'cancel') {
          return { cancelled: true };
        }
        if (String(auth?.status || '') === 'failed') {
          await Swal.fire({
            ...swalBase,
            icon: 'error',
            title: 'Paiement CCE annulé',
            html: auth?.message || 'Code CCE incorrect après 3 tentatives.',
            confirmButtonText: 'Fermer',
          });
        }
        return { retry: true };
      }
      return { idCarte: overrideId };
    }

    let idCarte = getSelectedCceId();
    if (idCarte <= 0) {
      const scanned = await requestCceScanFromSimulator();
      if (!scanned) {
        return { cancelled: true };
      }
      setSelectedCce(scanned);
      idCarte = getSelectedCceId();
      if (idCarte <= 0) {
        await Swal.fire({
          ...swalBase,
          icon: 'error',
          title: 'Carte CCE invalide',
          html: 'Aucune carte CCE valide n’a été scannée.',
          confirmButtonText: 'Fermer',
        });
        return { retry: true };
      }
    }

    let cce = null;
    try {
      cce = await Requetes.getCCE(idCarte);
    } catch (error) {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Carte CCE indisponible',
        html: error.message || 'Impossible de charger la carte CCE scannée.',
        confirmButtonText: 'Fermer',
      });
      return { retry: true };
    }

    authContext = {
      idCarte,
      nom: String(cce?.nom || ''),
      prenom: String(cce?.prenom || ''),
    };

    const solde = Number(cce?.solde_client ?? 0);
    if (!Number.isFinite(solde) || solde < Number(amountToDebit || 0)) {
      await Swal.fire({
        ...swalBase,
        icon: 'warning',
        title: 'Solde CCE insuffisant',
        html: `Solde courant : <strong>${formatMoney(solde)}</strong><br>Montant CCE : <strong>${formatMoney(amountToDebit)}</strong>`,
        confirmButtonText: 'Fermer',
      });
      return { retry: true };
    }

    const auth = await requestCcePinFromSimulator(authContext);
    if (!auth?.ok) {
      if (String(auth?.status || '') === 'cancel') {
        return { cancelled: true };
      }
      if (String(auth?.status || '') === 'failed') {
        await Swal.fire({
          ...swalBase,
          icon: 'error',
          title: 'Paiement CCE annulé',
          html: auth?.message || 'Code CCE incorrect après 3 tentatives.',
          confirmButtonText: 'Fermer',
        });
      }
      return { retry: true };
    }

    return { idCarte };
  }

  async function runPaymentStep(stepItems, cceInfoOverride = null) {
    const stepTotal = getItemsTotal(stepItems);
    const energieTotal = getItemsEnergyTotal(stepItems);

    const payment = await choosePaymentPlan(stepTotal, {
      cceMax: energieTotal,
      cceInfo: cceInfoOverride,
    });
    if (!payment) {
      return { status: 'cancel' };
    }

    const normalized = normalizePaymentPlan(payment.plan, payment.primaryMethod || 'cb');
    const plan = normalized.plan;
    const primaryMethod = normalized.primaryMethod;

    const amountByMethod = plan.reduce((acc, entry) => {
      const method = String(entry?.method || '').toLowerCase();
      const amount = Number(entry?.amount || 0);
      if (!method || amount <= 0) return acc;
      acc[method] = (acc[method] || 0) + amount;
      return acc;
    }, {});

    let cceCardId = Number(cceInfoOverride?.idCarte || 0);
    const cceAmount = Number(amountByMethod.cce || 0);
    if (cceAmount > 0) {
      const cceContext = await ensureCcePaymentReady(cceAmount, cceInfoOverride);
      if (cceContext?.cancelled) {
        return { status: 'cancel' };
      }
      if (cceContext?.retry) {
        return { status: 'retry' };
      }
      if (!cceContext) {
        return { status: 'cancel' };
      }
      cceCardId = Number(cceContext.idCarte || cceCardId || 0);

      Swal.fire({
        ...swalBase,
        title: 'Paiement CCE en cours',
        html: 'Validation du paiement CCE...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });
      await wait(900 + Math.floor(Math.random() * 500));
    }

    let cashDetails = null;
    const cashAmount = Number(amountByMethod.especes || 0);
    if (cashAmount > 0) {
      cashDetails = await promptCashAmount(cashAmount);
      if (!cashDetails) {
        return { status: 'cancel' };
      }
    }

    const cbAmount = Number(amountByMethod.cb || 0);
    if (cbAmount > 0) {
      Swal.fire({
        ...swalBase,
        title: 'Paiement carte bleue en cours',
        html: 'Connexion au terminal CB...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const delay = 1000 + Math.floor(Math.random() * 1000);
      await wait(delay);
    }

    return {
      status: 'success',
      plan,
      primaryMethod,
      amountByMethod,
      cceAmount,
      cceCardId,
      cashAmount,
      cashDetails,
      cbAmount,
    };
  }

  async function commitTransactions(items, primaryMethod, cceAmount, cceCardId) {
    // Une seule transaction finale pour tout le panier (produits + énergie).
    const lignesProduits = items
      .filter((item) => item.source === 'produit')
      .map((item) => ({
        code_barres: item.code,
        quantite: item.qty,
      }));

    const lignesEnergie = items
      .filter((item) => item.source === 'energie')
      .map((item) => ({
        id_pompe: item.idPompe,
        id_transaction_energie: item.idTransactionEnergie,
        quantite: item.qty,
      }));

    const responses = [];
    const energieResponses = [];
    let sharedTransactionId = 0;

    if (lignesProduits.length > 0) {
      const produitResponse = await Requetes.creerTransaction({
        mode_paiement: primaryMethod,
        lignes: lignesProduits,
      });
      responses.push(produitResponse);
      sharedTransactionId = Number(produitResponse?.id_transaction || 0);
      if (sharedTransactionId <= 0) {
        throw new Error('Transaction produit invalide.');
      }
    }

    for (const ligne of lignesEnergie) {
      if (!ligne.id_pompe || !ligne.id_transaction_energie) {
        throw new Error('Ligne énergie invalide');
      }

      const payload = {
        id_transaction_energie: ligne.id_transaction_energie,
        mode_paiement: primaryMethod,
      };
      if (sharedTransactionId > 0) {
        payload.id_transaction = sharedTransactionId;
      }

      const response = await Requetes.encaisserPompe(ligne.id_pompe, payload);
      responses.push(response);
      energieResponses.push(response);

      const currentId = Number(response?.id_transaction || 0);
      if (currentId > 0) {
        if (sharedTransactionId > 0 && sharedTransactionId !== currentId) {
          throw new Error('Incohérence: plusieurs transactions générées pour le même panier.');
        }
        sharedTransactionId = currentId;
      }
    }

    if ((lignesProduits.length > 0 || lignesEnergie.length > 0) && sharedTransactionId <= 0) {
      throw new Error('Impossible de déterminer la transaction finale.');
    }

    if (lignesEnergie.length > 0 && typeof window.PompesPanelRefresh === 'function') {
      window.PompesPanelRefresh();
    }

    if (cceAmount > 0) {
      if (!cceCardId || cceCardId <= 0) {
        throw new Error('Carte CCE introuvable pour finaliser le paiement.');
      }
      const transactionIdsEnergie =
        sharedTransactionId > 0
          ? [sharedTransactionId]
          : collectTransactionIds(energieResponses);
      await Requetes.debiterCCE(cceCardId, cceAmount, transactionIdsEnergie);
      window.dispatchEvent(new CustomEvent('cce:updated', { detail: { id_carte_CE: cceCardId } }));
    }

    const transactionIds =
      sharedTransactionId > 0
        ? [sharedTransactionId]
        : collectTransactionIds(responses);

    return {
      responses,
      transactionIds,
    };
  }
  async function process(items, total) {
    const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (safeItems.length === 0) {
      return { status: 'cancel' };
    }

    const totalPanier = Number(total);
    const computedTotal = Number.isFinite(totalPanier) && totalPanier > 0
      ? totalPanier
      : getItemsTotal(safeItems);
    if (computedTotal <= 0) {
      return { status: 'cancel' };
    }

    const encaissementMode = await chooseEncaissementMode(computedTotal);
    if (!encaissementMode) {
      return { status: 'cancel' };
    }

    const methodTotalsCents = { cb: 0, cce: 0, especes: 0 };
    const cashTotals = { given: 0, change: 0 };
    const scannedCce = await getScannedCceInfo();
    let cceCardId = Number(scannedCce?.idCarte || 0);
    let cceRemainingCents = scannedCce ? toCents(scannedCce.solde) : null;
    const runStep = async (stepItems) => {
      const cceInfoForStep =
        cceCardId > 0 && cceRemainingCents !== null
          ? { idCarte: cceCardId, solde: fromCents(cceRemainingCents) }
          : null;

      let step = null;
      do {
        step = await runPaymentStep(stepItems, cceInfoForStep);
      } while (step?.status === 'retry');

      if (step.status !== 'success') {
        return step;
      }

      for (const entry of step.plan) {
        const method = String(entry?.method || '').toLowerCase();
        const amountCents = toCents(entry?.amount || 0);
        if (amountCents <= 0) continue;
        methodTotalsCents[method] = (methodTotalsCents[method] || 0) + amountCents;
      }

      if (step.cashDetails) {
        cashTotals.given += Number(step.cashDetails.given || 0);
        cashTotals.change += Number(step.cashDetails.change || 0);
      }

      const cceStepAmountCents = toCents(step.cceAmount || 0);
      if (cceStepAmountCents > 0) {
        cceCardId = Number(step.cceCardId || cceCardId || 0);
        if (cceRemainingCents !== null) {
          cceRemainingCents = Math.max(0, cceRemainingCents - cceStepAmountCents);
        }
      }

      return step;
    };

    if (encaissementMode === 'all') {
      const singleStep = await runStep(safeItems);
      if (singleStep.status !== 'success') {
        return { status: 'cancel' };
      }
    } else {
      // Encaissement par sous-ensemble d'articles jusqu'à panier vide.
      let remainingEntries = safeItems.map((item, index) => ({
        key: index + 1,
        item,
        remainingQty: Math.max(1, Math.trunc(Number(item?.qty || 1))),
      }));

      while (remainingEntries.length > 0) {
        const selectedItems = await chooseItemsToPay(remainingEntries);
        if (!selectedItems) {
          return { status: 'cancel' };
        }

        const selectedByKey = new Map();
        selectedItems.forEach((entry) => {
          const key = Number(entry?.key || 0);
          const qty = Math.max(1, Math.trunc(Number(entry?.qty || 1)));
          if (key > 0) {
            selectedByKey.set(key, qty);
          }
        });

        const selectedEntries = remainingEntries.filter((entry) => selectedByKey.has(entry.key));
        if (selectedEntries.length === 0) {
          continue;
        }

        const stepItems = selectedEntries.map((entry) => {
          const selectedQty = selectedByKey.get(entry.key) ?? entry.remainingQty;
          const qty = Math.min(entry.remainingQty, selectedQty);
          return { ...entry.item, qty };
        });
        const step = await runStep(stepItems);
        if (step.status !== 'success') {
          return { status: 'cancel' };
        }

        remainingEntries = remainingEntries.flatMap((entry) => {
          const selectedQty = selectedByKey.get(entry.key);
          if (!selectedQty) return [entry];

          const qtyLeft = entry.remainingQty - selectedQty;
          if (qtyLeft > 0) {
            return [{ ...entry, remainingQty: qtyLeft }];
          }
          return [];
        });
      }
    }

    const cceAmountTotal = fromCents(methodTotalsCents.cce || 0);
    const primaryMethod = resolvePrimaryMethodFromTotals(methodTotalsCents);

    try {
      const commitResult = await commitTransactions(
        safeItems,
        primaryMethod,
        cceAmountTotal,
        cceCardId,
      );
      const transactionIds = commitResult.transactionIds;

      const wantsReceipt = await chooseReceipt();
      let receiptState = 'none';
      if (wantsReceipt) {
        if (transactionIds.length === 0) {
          receiptState = 'missing';
        } else {
          try {
            const receiptResponse = await Requetes.creerRecus({
              id_transactions: transactionIds,
              mode_paiement: primaryMethod,
            });
            const createdRecus = Array.isArray(receiptResponse?.recus) ? receiptResponse.recus : [];
            const createdReceiptIds = createdRecus
              .map((r) => Number(r?.id_recu || 0))
              .filter((id) => id > 0);
            if (createdReceiptIds.length > 0) {
              notifySimulator({
                type: 'sim-recu-created',
                recu_ids: createdReceiptIds,
              });
            }
            await wait(800);
            receiptState = 'printing';
          } catch (_) {
            receiptState = 'error';
          }
        }
      }

      const receiptMessage =
        receiptState === 'printing'
          ? 'Impression en cours...'
          : receiptState === 'error' || receiptState === 'missing'
            ? 'Transaction enregistrée. Reçu indisponible pour le moment.'
            : 'Transaction enregistrée avec succès.';

      const breakdownHtml = buildBreakdownHtml(methodTotalsCents);
      const totalCashAmount = fromCents(methodTotalsCents.especes || 0);

      await Swal.fire({
        ...swalBase,
        icon: 'success',
        title: 'Paiement accepté',
        html: `
          <div>${breakdownHtml}</div>
          ${totalCashAmount > 0
            ? `<div>Montant reçu : <strong>${formatMoney(cashTotals.given)}</strong></div>
               ${cashTotals.change > 0 ? `<div>Trop-perçu : <strong>${formatMoney(cashTotals.change)}</strong></div>` : ''}`
            : ''}
          <div style="margin-top:${totalCashAmount > 0 ? '8px' : '0'};">
            ${receiptMessage}
          </div>
        `,
        confirmButtonText: totalCashAmount > 0 ? 'Valider' : 'Fermer',
        allowOutsideClick: false,
      });

      window.dispatchEvent(new CustomEvent('stock:changed'));
      window.dispatchEvent(
        new CustomEvent('caisse:payment:success', {
          detail: { usedCce: cceAmountTotal > 0 },
        }),
      );
      if (cceAmountTotal > 0 && cceCardId > 0) {
        notifySimulator({
          type: 'cce-balance-updated',
          id_carte_CE: cceCardId,
        });
      }
      return { status: 'success', responses: commitResult.responses };
    } catch (err) {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Paiement refusé',
        html: err.message || 'Impossible d’enregistrer la transaction.',
        confirmButtonText: 'Fermer',
      });
      return { status: 'error', error: err };
    }
  }

  async function processCceRecharge(total) {
    const safeTotal = Number(total || 0);
    if (!Number.isFinite(safeTotal) || safeTotal <= 0) {
      return { status: 'cancel' };
    }

    const payment = await choosePaymentPlan(safeTotal, {
      allowedMethods: ['cb', 'especes'],
    });
    if (!payment) {
      return { status: 'cancel' };
    }

    const normalized = normalizePaymentPlan(payment.plan, payment.primaryMethod || 'cb');
    const plan = normalized.plan;
    const amountByMethod = plan.reduce((acc, entry) => {
      const method = String(entry?.method || '').toLowerCase();
      const amount = Number(entry?.amount || 0);
      if (!method || amount <= 0) return acc;
      acc[method] = (acc[method] || 0) + amount;
      return acc;
    }, {});

    let cashDetails = null;
    const cashAmount = Number(amountByMethod.especes || 0);
    if (cashAmount > 0) {
      cashDetails = await promptCashAmount(cashAmount);
      if (!cashDetails) {
        return { status: 'cancel' };
      }
    }

    const cbAmount = Number(amountByMethod.cb || 0);
    if (cbAmount > 0) {
      Swal.fire({
        ...swalBase,
        title: 'Paiement carte bleue en cours',
        html: 'Connexion au terminal CB...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const delay = 1000 + Math.floor(Math.random() * 1000);
      await wait(delay);
    }

    return {
      status: 'success',
      plan,
      amountByMethod,
      cashDetails,
      cashAmount,
      cbAmount,
    };
  }

  return { process, processCceRecharge };
})();
