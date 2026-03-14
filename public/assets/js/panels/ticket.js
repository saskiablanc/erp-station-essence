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

    const escapeHtml = (value) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

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
      try {
        const article = await Requetes.randomArticle();
        await addToCart(article);
      } catch (err) {
        const message = err.message || 'Impossible de charger un produit';
        const stockWarning = /stock/i.test(message);
        await Swal.fire({
          icon: stockWarning ? 'warning' : 'error',
          title: stockWarning ? 'Stock insuffisant' : 'Erreur produit',
          text: message,
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
      const code = window.TicketBarcode && typeof window.TicketBarcode.prompt === 'function'
        ? await window.TicketBarcode.prompt()
        : null;
      if (!code) return;

      try {
        const article = await Requetes.getArticle(code);
        const ok = await addToCart(article);
        if (!ok) return;
      } catch (err) {
        const message = err.message || 'Produit introuvable';
        const stockWarning = /stock insuffisant/i.test(message);
        await Swal.fire({
          icon: stockWarning ? 'warning' : 'error',
          title: stockWarning ? 'Stock insuffisant' : 'Code-barres invalide',
          text: stockWarning
            ? 'Cet article n’est plus en stock.'
            : message,
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

    panel.querySelector('[data-action="list"]').addEventListener('click', async () => {
      try {
        const articles = await Requetes.getArticles();
        const rows = (articles || [])
          .map(
            (article) => `
              <tr>
                <td>${escapeHtml(article.code_barres)}</td>
                <td>${escapeHtml(article.libelle)}</td>
              </tr>
            `,
          )
          .join('');

        await Swal.fire({
          title: 'Liste articles',
          html: rows
            ? `
              <div class="ticket-list-wrap">
                <table class="ticket-list-table">
                  <thead>
                    <tr><th>Code-barres</th><th>Article</th></tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>
              </div>
            `
            : '<div class="ticket-list-empty">Aucun article trouvé.</div>',
          customClass: {
            popup: 'ticket-swal-popup ticket-swal-popup-list',
            title: 'ticket-swal-title',
            htmlContainer: 'ticket-swal-text',
            confirmButton: 'ticket-swal-btn',
          },
          buttonsStyling: false,
          confirmButtonText: 'Fermer',
        });
      } catch (err) {
        await Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.message || 'Impossible de charger la liste des articles',
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

    if (typeof ResizeObserver !== 'undefined') {
      const ticketBody = panel.querySelector('.ticket-body');
      const observer = new ResizeObserver(() => render());
      if (ticketBody) {
        observer.observe(ticketBody);
      }
    }

    render();
  },
});
