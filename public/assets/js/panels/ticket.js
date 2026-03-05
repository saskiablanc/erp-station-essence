/* panels/ticket.js - orchestration panel achats */
WM.register('ticket', {
  label: 'Achats',
  icon: 'ACH',
  sprint: 2,
  buildHTML() {
    return TicketView.buildHTML();
  },
  onMount(id) {
    const root = document.getElementById('win-' + id);
    if (!root) return;

    const panel = root.querySelector('.ticket-panel');
    const cart = TicketCart.create();

    const render = () => TicketView.renderRows(panel, cart);

    panel.querySelector('[data-action="random"]').addEventListener('click', async () => {
      const confirm = await Swal.fire({
        title: 'Ajouter un produit',
        text: 'Ajouter un produit aléatoire du stock ?',
        showCancelButton: true,
        confirmButtonText: 'Ajouter',
        cancelButtonText: 'Annuler',
        customClass: {
          popup: 'ticket-swal-popup',
          title: 'ticket-swal-title',
          htmlContainer: 'ticket-swal-text',
          confirmButton: 'ticket-swal-btn',
          cancelButton: 'ticket-swal-btn ticket-swal-btn-secondary',
        },
        buttonsStyling: false,
      });
      if (!confirm.isConfirmed) return;

      try {
        const article = await Requetes.randomArticle();
        const result = cart.addArticle(article);
        if (!result.ok) {
          await Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: result.error,
            customClass: {
              popup: 'ticket-swal-popup',
              title: 'ticket-swal-title',
              htmlContainer: 'ticket-swal-text',
              confirmButton: 'ticket-swal-btn',
            },
            buttonsStyling: false,
          });
          return;
        }
        render();
        await Swal.fire({
          icon: 'success',
          title: 'Produit ajouté',
          text: `${article.libelle ?? article.libelle_produit ?? 'Produit'} ajouté au panier.`,
          timer: 1200,
          showConfirmButton: false,
          customClass: {
            popup: 'ticket-swal-popup',
            title: 'ticket-swal-title',
            htmlContainer: 'ticket-swal-text',
          },
        });
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Erreur produit',
          text: err.message || 'Impossible de charger un produit',
          customClass: {
            popup: 'ticket-swal-popup',
            title: 'ticket-swal-title',
            htmlContainer: 'ticket-swal-text',
            confirmButton: 'ticket-swal-btn',
          },
          buttonsStyling: false,
        });
      }
    });

    panel.querySelector('[data-action="barcode"]').addEventListener('click', async () => {
      const inputPopup = await Swal.fire({
        title: 'Insérer un code-barres',
        input: 'text',
        inputPlaceholder: 'Ex: 1234567890123',
        showCancelButton: true,
        confirmButtonText: 'Ajouter',
        cancelButtonText: 'Annuler',
        customClass: {
          popup: 'ticket-swal-popup',
          title: 'ticket-swal-title',
          htmlContainer: 'ticket-swal-text',
          confirmButton: 'ticket-swal-btn',
          cancelButton: 'ticket-swal-btn ticket-swal-btn-secondary',
          input: 'ticket-swal-input',
        },
        buttonsStyling: false,
        preConfirm: (value) => {
          const code = String(value ?? '').trim();
          if (!code) {
            Swal.showValidationMessage('Code-barres requis');
            return null;
          }
          return code;
        },
      });

      if (!inputPopup.isConfirmed) return;

      try {
        const article = await Requetes.getArticle(inputPopup.value);
        const result = cart.addArticle(article);
        if (!result.ok) {
          throw new Error(result.error);
        }
        render();
        await Swal.fire({
          icon: 'success',
          title: 'Article ajouté',
          text: 'Le produit a été ajouté au panier.',
          timer: 1000,
          showConfirmButton: false,
          customClass: {
            popup: 'ticket-swal-popup',
            title: 'ticket-swal-title',
            htmlContainer: 'ticket-swal-text',
          },
        });
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Code-barres invalide',
          text: err.message || 'Produit introuvable',
          customClass: {
            popup: 'ticket-swal-popup',
            title: 'ticket-swal-title',
            htmlContainer: 'ticket-swal-text',
            confirmButton: 'ticket-swal-btn',
          },
          buttonsStyling: false,
        });
      }
    });

    panel.querySelector('.ticket-encaisser').addEventListener('click', async () => {
      if (cart.getItems().length === 0) {
        await Swal.fire({
          icon: 'warning',
          title: 'Panier vide',
          text: 'Ajoute au moins un produit avant encaissement.',
          customClass: {
            popup: 'ticket-swal-popup',
            title: 'ticket-swal-title',
            htmlContainer: 'ticket-swal-text',
            confirmButton: 'ticket-swal-btn',
          },
          buttonsStyling: false,
        });
        return;
      }
      const paymentResult = await TicketPayment.process(cart.getLignes(), cart.getTotal());
      if (paymentResult.status === 'success') {
        cart.clear();
        render();
      }
    });

    panel.querySelector('.ticket-rows').addEventListener('click', async (event) => {
      const btn = event.target.closest('.ticket-del');
      if (!btn) return;

      const confirmDelete = await Swal.fire({
        title: 'Retirer ce produit ?',
        text: 'La ligne sera supprimée du panier.',
        showCancelButton: true,
        confirmButtonText: 'Supprimer',
        cancelButtonText: 'Annuler',
        customClass: {
          popup: 'ticket-swal-popup',
          title: 'ticket-swal-title',
          htmlContainer: 'ticket-swal-text',
          confirmButton: 'ticket-swal-btn',
          cancelButton: 'ticket-swal-btn ticket-swal-btn-secondary',
        },
        buttonsStyling: false,
      });
      if (!confirmDelete.isConfirmed) return;

      const row = btn.closest('.ticket-row');
      if (!row) return;
      const index = Number(row.dataset.index);
      cart.removeAt(index);
      render();
    });

    render();
  },
});
