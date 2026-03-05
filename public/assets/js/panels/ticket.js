/* panels/ticket.js - orchestration panel achats */
const AchatsBridge = (() => {
  const queue = [];
  let consumer = null;

  function push(article) {
    if (typeof consumer === 'function') {
      try {
        const consumed = consumer(article);
        if (consumed !== false) {
          return;
        }
      } catch (_) {
        // fallback queue
      }
    }
    queue.push(article);
  }

  function consumeWith(fn) {
    consumer = fn;
    while (queue.length > 0) {
      const next = queue.shift();
      const consumed = fn(next);
      if (consumed === false) {
        queue.unshift(next);
        break;
      }
    }
  }

  return { push, consumeWith };
})();

window.Achats = window.Achats || {};
window.Achats.ajouterArticle = (article) => {
  AchatsBridge.push(article);
  WM.open('ticket');
};

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
    const addToCart = async (article, successMessage = null) => {
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
        return false;
      }
      render();
      if (successMessage) {
        await Swal.fire({
          icon: 'success',
          title: 'Article ajouté',
          text: successMessage,
          timer: 1200,
          showConfirmButton: false,
          customClass: {
            popup: 'ticket-swal-popup',
            title: 'ticket-swal-title',
            htmlContainer: 'ticket-swal-text',
          },
        });
      }
      return true;
    };

    AchatsBridge.consumeWith((article) => {
      if (!document.body.contains(panel)) {
        return false;
      }
      const result = cart.addArticle(article);
      if (!result.ok) {
        Toast.err(result.error);
        return true;
      }
      render();
      return true;
    });

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
        await addToCart(article, `${article.libelle ?? article.libelle_produit ?? 'Produit'} ajouté au panier.`);
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
        const ok = await addToCart(article, 'Le produit a été ajouté au panier.');
        if (!ok) return;
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
      const paymentResult = await TicketPayment.process(cart.getItems(), cart.getTotal());
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
