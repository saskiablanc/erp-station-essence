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
      html: `Total a regler : <strong>${total.toFixed(2)} EUR</strong>`,
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

  async function process(lignes, total) {
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
      const response = await Requetes.creerTransaction({
        mode_paiement: method,
        lignes,
      });
      await Swal.fire({
        ...swalBase,
        icon: 'success',
        title: 'Paiement accepte',
        html: 'Transaction enregistree avec succes.',
        confirmButtonText: 'Fermer',
        allowOutsideClick: false,
      });
      return { status: 'success', response };
    } catch (err) {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Paiement refuse',
        html: err.message || 'Impossible d enregistrer la transaction.',
        confirmButtonText: 'Fermer',
      });
      return { status: 'error', error: err };
    }
  }

  return { process };
})();
