/**
 * core/state.js — État global de la caisse
 * Pas de modules ES6 → fonctionne en file:// et sur linserv
 */
const State = (() => {
  const s = {
    employe:       null,   // { id, nom, prenom, role }
    hand:          localStorage.getItem('caisse_hand') || 'right',
    numBuffer:     '',
    panier:        [],     // [{ id_article, code_barres, libelle, quantite, prix_unitaire }]
    panierActif:   false,  // une transaction est-elle en cours ?
    zTop:          10,
    windows:       {},     // id → { minimized, visible }
  };

  return {
    get:    (k)    => s[k],
    set:    (k, v) => { s[k] = v; },
    all:    ()     => s,

    // Panier
    getPanier:   ()    => s.panier,
    clearPanier: ()    => { s.panier = []; s.panierActif = false; },
    addLigne:    (art) => {
      const existing = s.panier.find(l => l.code_barres === art.code_barres);
      if (existing) {
        existing.quantite++;
      } else {
        s.panier.push({ ...art, quantite: 1 });
      }
      s.panierActif = true;
    },
    removeLigne: (idx) => {
      s.panier.splice(idx, 1);
      if (s.panier.length === 0) s.panierActif = false;
    },
    getTotal: () => s.panier.reduce((t, l) => t + l.quantite * l.prix_unitaire, 0),
  };
})();
