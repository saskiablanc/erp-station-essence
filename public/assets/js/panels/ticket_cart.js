/* panels/ticket_cart.js - metier panier */
window.TicketCart = (() => {
  function normalizeArticle(article) {
    return {
      code: String(article.code_barres ?? article.code ?? ''),
      libelle: article.libelle ?? article.nom ?? article.libelle_produit ?? 'Produit',
      prix: Number(article.prix ?? 0),
    };
  }

  function create() {
    const items = [];

    function addArticle(article) {
      const item = normalizeArticle(article);
      if (!item.code || Number.isNaN(item.prix)) {
        return { ok: false, error: 'Produit invalide' };
      }

      const existing = items.find((current) => current.code === item.code);
      if (existing) {
        existing.qty += 1;
      } else {
        items.push({ ...item, qty: 1 });
      }

      return { ok: true };
    }

    function removeAt(index) {
      if (!Number.isInteger(index) || index < 0 || index >= items.length) {
        return;
      }
      items.splice(index, 1);
    }

    function clear() {
      items.splice(0, items.length);
    }

    function getItems() {
      return items;
    }

    function getTotal() {
      return items.reduce((sum, item) => sum + item.prix * item.qty, 0);
    }

    function getLignes() {
      return items.map((item) => ({
        code_barres: item.code,
        quantite: item.qty,
      }));
    }

    return {
      addArticle,
      removeAt,
      clear,
      getItems,
      getTotal,
      getLignes,
    };
  }

  return { create };
})();
