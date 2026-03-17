/* panels/ticket_payment.js - simulation paiement avec SweetAlert2 */
window.TicketPayment = (() => {
  const swalBase = {
    customClass: {
      popup: 'ticket-swal-popup',
      title: 'ticket-swal-title',
      htmlContainer: 'ticket-swal-text',
      confirmButton: 'ticket-swal-btn',
      denyButton: 'ticket-swal-btn',
      cancelButton: 'ticket-swal-btn ticket-swal-btn-secondary',
    },
    buttonsStyling: false,
    reverseButtons: true,
  };

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getSelectedCceId() {
    return Number(window.CCESelection?.id_carte_CE ?? 0);
  }

  function formatMoney(value) {
    return `${Number(value || 0).toFixed(2)} EUR`;
  }

  async function chooseMethod(total) {
    let method = null;

    const result = await Swal.fire({
      ...swalBase,
      title: 'Choix du paiement',
      html: `
        <div class="ticket-pay-choice-total">Total à régler : <strong>${formatMoney(total)}</strong></div>
        <div class="ticket-pay-choice-grid">
          <button type="button" class="ticket-pay-choice-btn" data-payment-method="cb">Carte bleue</button>
          <button type="button" class="ticket-pay-choice-btn" data-payment-method="cce">CCE</button>
          <button type="button" class="ticket-pay-choice-btn" data-payment-method="espece">Espèce</button>
        </div>
        <button type="button" class="ticket-pay-choice-btn ticket-pay-choice-btn-cancel" data-payment-cancel>
          Annuler
        </button>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      backdrop: 'rgba(26, 26, 46, 0.45)',
      didOpen: (popup) => {
        popup.querySelectorAll('[data-payment-method]').forEach((button) => {
          button.addEventListener('click', () => {
            method = String(button.dataset.paymentMethod || '').toLowerCase();
            Swal.close();
          });
        });

        popup.querySelector('[data-payment-cancel]')?.addEventListener('click', () => {
          method = null;
          Swal.close();
        });
      },
    });

    if (result.isDismissed && !method) return null;
    return method;
  }

  function formatCents(valueCents) {
    return `${(Math.max(0, valueCents) / 100).toFixed(2)} EUR`;
  }

  async function promptCashAmount(total) {
    const totalCents = Math.round(Number(total || 0) * 100);
    const maxDigits = 7;
    let digits = '';
    let confirmed = false;

    await Swal.fire({
      html: `
        <div class="ticket-cash-modal">
          <button type="button" class="ticket-cash-close" data-cash-close aria-label="Fermer">X</button>
          <div class="ticket-cash-total">Total à régler : <strong>${formatMoney(total)}</strong></div>
          <div class="ticket-cash-display-wrap">
            <div class="ticket-cash-display" data-cash-display>0.00 EUR</div>
          </div>
          <div class="ticket-cash-error" data-cash-error></div>
          <div class="ticket-cash-keypad">
            <button type="button" data-cash-key="1">1</button>
            <button type="button" data-cash-key="2">2</button>
            <button type="button" data-cash-key="3">3</button>
            <button type="button" data-cash-key="4">4</button>
            <button type="button" data-cash-key="5">5</button>
            <button type="button" data-cash-key="6">6</button>
            <button type="button" data-cash-key="7">7</button>
            <button type="button" data-cash-key="8">8</button>
            <button type="button" data-cash-key="9">9</button>
            <button type="button" data-cash-action="back">\u2039</button>
            <button type="button" data-cash-key="0">0</button>
            <button type="button" data-cash-action="validate">\u2713</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: 'ticket-swal-popup ticket-swal-popup-cash',
        htmlContainer: 'ticket-swal-cash-html',
      },
      didOpen: (popup) => {
        const display = popup.querySelector('[data-cash-display]');
        const error = popup.querySelector('[data-cash-error]');

        const refresh = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          display.textContent = formatCents(valueCents);
        };

        const close = () => Swal.close();

        const validate = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          if (valueCents < totalCents) {
            error.textContent = 'Montant insuffisant';
            return;
          }
          confirmed = true;
          close();
        };

        popup.querySelector('[data-cash-close]')?.addEventListener('click', close);
        popup.querySelectorAll('[data-cash-key]').forEach((button) => {
          button.addEventListener('click', () => {
            if (digits.length >= maxDigits) {
              error.textContent = 'Montant trop élevé';
              return;
            }
            digits += String(button.dataset.cashKey || '');
            error.textContent = '';
            refresh();
          });
        });
        popup.querySelector('[data-cash-action="back"]')?.addEventListener('click', () => {
          digits = digits.slice(0, -1);
          error.textContent = '';
          refresh();
        });
        popup.querySelector('[data-cash-action="validate"]')?.addEventListener('click', validate);

        const onKeyDown = (event) => {
          if (event.key >= '0' && event.key <= '9') {
            event.preventDefault();
            if (digits.length >= maxDigits) {
              error.textContent = 'Montant trop élevé';
              return;
            }
            digits += event.key;
            error.textContent = '';
            refresh();
            return;
          }
          if (event.key === 'Backspace') {
            event.preventDefault();
            digits = digits.slice(0, -1);
            error.textContent = '';
            refresh();
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            validate();
          }
        };

        popup.addEventListener('keydown', onKeyDown);
        popup._cashKeyDownHandler = onKeyDown;
      },
      willClose: (popup) => {
        if (popup?._cashKeyDownHandler) {
          popup.removeEventListener('keydown', popup._cashKeyDownHandler);
          delete popup._cashKeyDownHandler;
        }
      },
    });

    if (!confirmed) return null;

    const givenCents = digits ? Number.parseInt(digits, 10) : 0;
    return {
      given: givenCents / 100,
      change: Math.max(0, givenCents - totalCents) / 100,
    };
  }

  async function chooseReceipt() {
    const result = await Swal.fire({
      ...swalBase,
      reverseButtons: false,
      title: 'Souhaitez-vous un reçu ?',
      html: 'Voulez-vous imprimer un reçu de paiement ?',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'Oui',
      denyButtonText: 'Non',
      allowOutsideClick: false,
      backdrop: 'rgba(26, 26, 46, 0.45)',
    });

    if (result.isConfirmed) return true;
    if (result.isDenied) return false;
    return false;
  }

  function collectTransactionIds(responses) {
    const ids = [];
    for (const response of responses) {
      const id = Number(response?.id_transaction ?? 0);
      if (id > 0) {
        ids.push(id);
      }
    }
    return [...new Set(ids)];
  }

  async function ensureCcePaymentReady(total) {
    const idCarte = getSelectedCceId();
    if (idCarte <= 0) {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Carte CCE non scannée',
        html: 'Scannez une carte CCE dans le panneau CCE avant de payer avec ce mode.',
        confirmButtonText: 'Fermer',
      });
      return null;
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
      return null;
    }

    const solde = Number(cce?.solde_client ?? 0);
    if (!Number.isFinite(solde) || solde < Number(total || 0)) {
      await Swal.fire({
        ...swalBase,
        icon: 'warning',
        title: 'Solde CCE insuffisant',
        html: `Solde courant : <strong>${formatMoney(solde)}</strong><br>Total à régler : <strong>${formatMoney(total)}</strong>`,
        confirmButtonText: 'Fermer',
      });
      return null;
    }

    return { idCarte };
  }

  async function process(items, total) {
    const method = await chooseMethod(total);
    if (!method) {
      return { status: 'cancel' };
    }

    let cceContext = null;
    if (method === 'cce') {
      cceContext = await ensureCcePaymentReady(total);
      if (!cceContext) {
        return { status: 'cancel' };
      }
    }

    let cashDetails = null;
    let wantsReceipt = null;
    if (method === 'espece') {
      cashDetails = await promptCashAmount(total);
      if (!cashDetails) {
        return { status: 'cancel' };
      }
      wantsReceipt = await chooseReceipt();
    }

    if (method !== 'espece') {
      Swal.fire({
        ...swalBase,
        title: 'Paiement en cours',
        html: 'Connexion au terminal de paiement...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const delay = 1000 + Math.floor(Math.random() * 1000);
      await wait(delay);
    }

    try {
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
      if (lignesProduits.length > 0) {
        responses.push(await Requetes.creerTransaction({
          mode_paiement: method,
          lignes: lignesProduits,
        }));
      }

      for (const ligne of lignesEnergie) {
        if (!ligne.id_pompe || !ligne.id_transaction_energie) {
          throw new Error('Ligne énergie invalide');
        }
        responses.push(await Requetes.encaisserPompe(ligne.id_pompe, {
          id_transaction_energie: ligne.id_transaction_energie,
          mode_paiement: method,
        }));
      }

      if (lignesEnergie.length > 0 && typeof window.PompesPanelRefresh === 'function') {
        window.PompesPanelRefresh();
      }

      const transactionIds = collectTransactionIds(responses);
      if (method === 'cce' && cceContext?.idCarte > 0) {
        await Requetes.debiterCCE(cceContext.idCarte, total, transactionIds);
        window.dispatchEvent(new CustomEvent('cce:updated', { detail: { id_carte_CE: cceContext.idCarte } }));
      }

      if (wantsReceipt === null) {
        wantsReceipt = await chooseReceipt();
      }
      let receiptState = 'none';
      if (wantsReceipt) {
        if (transactionIds.length === 0) {
          receiptState = 'missing';
        } else {
          try {
            await Requetes.creerRecus({
              id_transactions: transactionIds,
              mode_paiement: method,
            });
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

      await Swal.fire({
        ...swalBase,
        icon: 'success',
        title: 'Paiement accepté',
        html: `
          ${method === 'espece' && cashDetails
            ? `<div>Montant reçu : <strong>${formatMoney(cashDetails.given)}</strong></div>
               ${cashDetails.change > 0 ? `<div>Trop-perçu : <strong>${formatMoney(cashDetails.change)}</strong></div>` : ''}`
            : ''}
          <div style="margin-top:${method === 'espece' ? '8px' : '0'};">
            ${receiptMessage}
          </div>
        `,
        confirmButtonText: method === 'espece' ? 'Valider' : 'Fermer',
        allowOutsideClick: false,
      });

      window.dispatchEvent(new CustomEvent('stock:changed'));
      window.dispatchEvent(new CustomEvent('caisse:payment:success'));
      return { status: 'success', responses };
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

  return { process };
})();
