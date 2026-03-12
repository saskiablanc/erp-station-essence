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
      throw new Error(data.message || `Erreur ${reponse.status}`);
    }
    return data;
  }

  return {
    // ── Auth ──────────────────────────────────────────────
    session: () => appel("GET", "/json/auth/session"),
    logout: () => appel("POST", "/json/auth/logout"),

    // ── Articles ──────────────────────────────────────────
    getArticle: (code) => appel("GET", `/json/articles/${code}`),
    randomArticle: () => appel("GET", "/json/articles/random"),

    // ── Transactions ──────────────────────────────────────
    creerTransaction: (data) => appel("POST", "/json/transactions", data),
    getTransactions: () => appel("GET", "/json/transactions"),
    getTransaction: (id) => appel("GET", `/json/transactions/${id}`),
    annulerTransaction: (id) =>
      appel("POST", `/json/transactions/${id}/annuler`),

    // ── Sprint 3 ──────────────────────────────────────────
    getPompes: () => appel("GET", "/json/pompes"),
    activerPompe: (id) => appel("POST", `/json/pompes/${id}/activer`),
    demarrerPompe: (id, data) =>
      appel("POST", `/json/pompes/${id}/demarrer`, data),
    terminerPompe: (id) => appel("POST", `/json/pompes/${id}/terminer`),
    encaisserPompe: (id, data) =>
      appel("POST", `/json/pompes/${id}/encaisser`, data),
    getStock: () => appel("GET", "/json/stock"),

    // ── Sprint 5 ──────────────────────────────────────────
    getCCE: (id) => appel("GET", `/json/cce/${id}`),
    creerCCE: (data) => appel("POST", "/json/cce", data),
    rechargerCCE: (id, mont) =>
      appel("POST", `/json/cce/${id}/recharger`, { montant: mont }),

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

    // ── Sprint 6 — Gérant ───────────────────────────────
    getPrix: () => appel("GET", "/json/carburants/prix"),
    modifierPrix: (d) => appel("POST", "/json/carburants/prix", d),
    getIncidents: () => appel("GET", "/json/incidents"),
    creerIncident: (d) => appel("POST", "/json/incidents", d),
  };
})();
