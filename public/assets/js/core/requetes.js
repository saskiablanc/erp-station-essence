/**
 * core/requetes.js
 * Toutes les requêtes fetch() vers le PHP sont ici.
 * Les panels n'appellent jamais fetch() directement.
 * Le préfixe /json/ correspond aux routes définies dans index.php
 */
const Requetes = (() => {
  const BASE =
    typeof window !== "undefined" && window.APP_BASE_URL
      ? window.APP_BASE_URL
      : "";

  function withBase(route) {
    if (!BASE) return route;
    if (route.startsWith("/")) return `${BASE}${route}`;
    return `${BASE}/${route}`;
  }

  async function appel(methode, route, corps = null) {
    const options = {
      method: methode,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    if (corps) options.body = JSON.stringify(corps);

    const reponse = await fetch(withBase(route), options);
    const data = await reponse.json();

    if (!reponse.ok) {
      const error = new Error(data.message || `Erreur ${reponse.status}`);
      error.status = reponse.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  return {
    // ── Auth ──────────────────────────────────────────────
    session: () => appel("GET", "/json/auth/session"),
    logout: () => appel("POST", "/json/auth/logout"),

    // ── Articles ──────────────────────────────────────────
    getArticles: () => appel("GET", "/json/articles"),
    getArticle: (code) => appel("GET", `/json/articles/${code}`),
    randomArticle: () => appel("GET", "/json/articles/random"),

    // ── Transactions ──────────────────────────────────────
    creerTransaction: (data) => appel("POST", "/json/transactions", data),
    getTransactions: () => appel("GET", "/json/transactions"),
    getTransaction: (id) => appel("GET", `/json/transactions/${id}`),
    annulerTransaction: (id) =>
      appel("POST", `/json/transactions/${id}/annuler`),
    creerRecus: (data) => appel("POST", "/json/recus", data),

    // ── Sprint 3 ──────────────────────────────────────────
    getPompes: () => appel("GET", "/json/pompes"),
    activerPompe: (id) => appel("POST", `/json/pompes/${id}/activer`),
    demarrerPompe: (id, data) =>
      appel("POST", `/json/pompes/${id}/demarrer`, data),
    terminerPompe: (id) => appel("POST", `/json/pompes/${id}/terminer`),
    encaisserPompe: (id, data) =>
      appel("POST", `/json/pompes/${id}/encaisser`, data),
    getStock: (type = "articles") =>
      appel("GET", `/json/stock?type=${encodeURIComponent(type)}`),

    // ── Sprint 5 ──────────────────────────────────────────
    getCCEs: () => appel("GET", "/json/cce"),
    getCCELatest: () => appel("GET", "/json/cce/latest"),
    getCCETransactions: (id) => appel("GET", `/json/cce/${id}/transactions`),
    getCCE: (id) => appel("GET", `/json/cce/${id}`),
    checkCCEDuplicate: (data) =>
      appel("POST", "/json/cce/check-duplicate", data),
    creerCCE: (data) => appel("POST", "/json/cce", data),
    rechargerCCE: (id, mont) =>
      appel("POST", `/json/cce/${id}/recharger`, { montant: mont }),
    debiterCCE: (id, mont, idTransactions = []) =>
      appel("POST", `/json/cce/${id}/debiter`, {
        montant: mont,
        id_transactions: idTransactions,
      }),

    // ── Sprint 4 — Réapprovisionnement (US20/21/22/23) ────
    getReappros: (statut) =>
      appel(
        "GET",
        "/json/reappros" +
          (statut ? `?statut=${encodeURIComponent(statut)}` : ""),
      ),
    getReappro: (id) => appel("GET", `/json/reappros/${id}`),
    creerReappro: (d) => appel("POST", "/json/reappros", d),
    annulerReappro: (id) => appel("POST", `/json/reappros/${id}/annuler`),
    updateStatutReappro: (id, s) =>
      appel("POST", `/json/reappros/${id}/statut`, { statut: s }),
    getArticlesReappro: () => appel("GET", "/json/reappros/articles"),
    getValeursDefaut: () => appel("GET", "/json/reappros/valeurs-defaut"),
    updateValeurDefaut: (idArt, d) =>
      appel("POST", `/json/reappros/valeurs-defaut/${idArt}`, d),
    updateValeursDefautType: (d) =>
      appel("POST", "/json/reappros/valeurs-defaut-type", d),

    // ── Sprint 6 — Gérant ────────────────────────────────
    getPrix: () => appel("GET", "/json/carburants/prix"),
    modifierPrix: (d) => appel("POST", "/json/carburants/prix", d),
    getIncidents: () => appel("GET", "/json/incidents"),
    creerIncident: (d) => appel("POST", "/json/incidents", d),

    // ── Sprint 6 — Paramètres CCE (US14) ─────────────────
    getCceParams: () => appel("GET", "/json/cce/params"),
    updateMontantMin: (montant) =>
      appel("POST", "/json/cce/params", { montant_min: montant }),
    addBonus: (t, b) =>
      appel("POST", "/json/cce/bonus", { tranche: t, montant_bonus: b }),
    updateBonus: (id, t, b) =>
      appel("POST", `/json/cce/bonus/${id}`, { tranche: t, montant_bonus: b }),
    deleteBonus: (id) => appel("POST", `/json/cce/bonus/${id}/suppr`),

    // ── Sprint 6 — Jours de fermetures (US15) ─────────────
    getFermetures: () => appel("GET", "/json/fermetures"),
    createFermeture: (data) => appel("POST", "/json/fermetures", data),
    deleteFermeture: (id) => appel("POST", `/json/fermetures/${id}/suppr`),

    // ── Sprint 6 — Horaires boutique (US15) ───────────────
    getHorairesBoutique: () => appel("GET", "/json/horaires/boutique"),
    updateHorairesBoutique: (horaires) =>
      appel("POST", "/json/horaires/boutique", { horaires }),

    // ── Sprint 6 — Validation journalière (US16) ──────────
    getValidationJournee: (date = "") =>
      appel(
        "GET",
        "/json/validation/journee" +
          (date ? `?date=${encodeURIComponent(date)}` : ""),
      ),
    // ── Sprint 6 — Base de données (US19) ─────────────────
    // 4 méthodes génériques — la table est passée en paramètre
    bddGet: (table) => appel("GET", `/json/bdd/${table}`),
    bddPost: (table, d) => appel("POST", `/json/bdd/${table}`, d),
    bddPut: (table, id, d) => appel("POST", `/json/bdd/${table}/${id}`, d),
    bddDel: (table, id) => appel("POST", `/json/bdd/${table}/${id}/suppr`),
  };
})();
