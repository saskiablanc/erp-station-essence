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

  async function chooseMethod(total) {
    const result = await Swal.fire({
      ...swalBase,
      title: 'Choix du paiement',
      html: `Total à régler : <strong>${total.toFixed(2)} EUR</strong>`,
      customClass: {
        ...swalBase.customClass,
        actions: 'ticket-swal-actions-payment',
      },
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Carte bleue',
      denyButtonText: 'CCE',
      cancelButtonText: 'Annuler',
      allowOutsideClick: false,
      backdrop: 'rgba(26, 26, 46, 0.45)',
    });

    if (result.isDismissed) return null;
    return result.isDenied ? 'cce' : 'cb';
  }

  async function chooseReceipt() {
    const result = await Swal.fire({
      ...swalBase,
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

  async function process(items, total) {
    const method = await chooseMethod(total);
    if (!method) {
      return { status: 'cancel' };
    }

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

      const wantsReceipt = await chooseReceipt();
      let receiptState = 'none';
      if (wantsReceipt) {
        const transactionIds = collectTransactionIds(responses);
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

      await Swal.fire({
        ...swalBase,
        icon: 'success',
        title: 'Paiement accepté',
        html:
          receiptState === 'printing'
            ? 'Impression en cours...'
            : receiptState === 'error' || receiptState === 'missing'
              ? 'Transaction enregistrée. Reçu indisponible pour le moment.'
              : 'Transaction enregistrée avec succès.',
        confirmButtonText: 'Fermer',
        allowOutsideClick: false,
      });
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
