/* panels/ticket_cart.js - metier panier */
window.TicketCart = (() => {
  function normalizeArticle(article) {
    const qty = Number(article.qty ?? article.quantite ?? 1);
    return {
      code: String(article.code_barres ?? article.code ?? ''),
      codeAffiche: String(article.code_affiche ?? article.codeAffiche ?? article.code_barres ?? article.code ?? ''),
      libelle: article.libelle ?? article.nom ?? article.libelle_produit ?? 'Produit',
      prix: Number(article.prix ?? article.prix_unitaire ?? 0),
      qty: Number.isFinite(qty) && qty > 0 ? Math.trunc(qty) : 1,
      source: article.source ?? 'produit',
      idPompe: article.id_pompe ?? null,
      idTransactionEnergie: article.id_transaction_energie ?? null,
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
        existing.qty += item.qty;
      } else {
        items.push(item);
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

    function setQtyAt(index, qty) {
      if (!Number.isInteger(index) || index < 0 || index >= items.length) {
        return { ok: false, error: 'Ligne introuvable' };
      }

      const nextQty = Number.parseInt(String(qty), 10);
      if (!Number.isInteger(nextQty) || nextQty < 1) {
        return { ok: false, error: 'Quantité invalide' };
      }

      items[index].qty = nextQty;
      return { ok: true };
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

    function getLignesProduits() {
      return items
        .filter((item) => item.source === 'produit')
        .map((item) => ({
          code_barres: item.code,
          quantite: item.qty,
        }));
    }

    function getLignesEnergie() {
      return items
        .filter((item) => item.source === 'energie')
        .map((item) => ({
          id_pompe: item.idPompe,
          id_transaction_energie: item.idTransactionEnergie,
          quantite: item.qty,
        }));
    }

    return {
      addArticle,
      removeAt,
      setQtyAt,
      clear,
      getItems,
      getTotal,
      getLignes,
      getLignesProduits,
      getLignesEnergie,
    };
  }

  return { create };
})();
