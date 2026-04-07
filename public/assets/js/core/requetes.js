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
  const BDD_PROFILE_STORAGE_KEY = "bdd_profile_v1";
  const BDD_DEFAULT_PROFILE = "courante";
  const BDD_YEAR_STORAGE_KEY = "bdd_archive_year_v1";
  const BDD_DEFAULT_YEAR = "2026";
  let bddProfile = BDD_DEFAULT_PROFILE;
  let bddYear = BDD_DEFAULT_YEAR;

  function withBase(route) {
    if (!BASE) return route;
    if (route.startsWith("/")) return `${BASE}${route}`;
    return `${BASE}/${route}`;
  }

  function normalizeBddProfile(profile) {
    const value = String(profile || "").trim();
    return value || BDD_DEFAULT_PROFILE;
  }

  function readBddProfile() {
    try {
      if (typeof localStorage === "undefined") return BDD_DEFAULT_PROFILE;
      return normalizeBddProfile(
        localStorage.getItem(BDD_PROFILE_STORAGE_KEY) || BDD_DEFAULT_PROFILE,
      );
    } catch (_) {
      return BDD_DEFAULT_PROFILE;
    }
  }

  function writeBddProfile(profile) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(BDD_PROFILE_STORAGE_KEY, normalizeBddProfile(profile));
    } catch (_) {}
  }

  function withBddProfile(route) {
    const profile = encodeURIComponent(normalizeBddProfile(bddProfile));
    const sep = route.includes("?") ? "&" : "?";
    return `${route}${sep}profile=${profile}`;
  }

  function normalizeBddYear(year) {
    const value = String(year || "").trim();
    if (/^\d{4}$/.test(value)) return value;
    return BDD_DEFAULT_YEAR;
  }

  function readBddYear() {
    try {
      if (typeof localStorage === "undefined") return BDD_DEFAULT_YEAR;
      return normalizeBddYear(
        localStorage.getItem(BDD_YEAR_STORAGE_KEY) || BDD_DEFAULT_YEAR,
      );
    } catch (_) {
      return BDD_DEFAULT_YEAR;
    }
  }

  function writeBddYear(year) {
    try {
      if (typeof localStorage === "undefined") return;
      localStorage.setItem(BDD_YEAR_STORAGE_KEY, normalizeBddYear(year));
    } catch (_) {}
  }

  function withBddQuery(route) {
    const profile = normalizeBddProfile(bddProfile);
    let next = withBddProfile(route);
    if (profile === "archive") {
      const year = encodeURIComponent(normalizeBddYear(bddYear));
      next += `&year=${year}`;
    }
    return next;
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

  bddProfile = readBddProfile();
  bddYear = readBddYear();

  return {
    // ── Auth ──────────────────────────────────────────────
    session: () => appel("GET", "/json/auth/session"),
    logout: () => appel("POST", "/json/auth/logout"),
    ssePompesUrl: () => withBase("/events/pompes"),

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
    togglePompe: (id) => appel("POST", `/json/pompes/${id}/toggle`),
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
    creerReapproAuto: () => appel("POST", "/json/reappros/auto"),
    annulerReappro: (id) => appel("POST", `/json/reappros/${id}/annuler`),
    updateReapproLigne: (id, idArticle, quantite) =>
      appel("POST", `/json/reappros/${id}/lignes/${idArticle}`, { quantite }),
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
    validerJournee: (date, type) =>
      appel("POST", "/json/validation/journee", {
        date_jour: date,
        type: type,
      }),
    getJourneesValidees: () =>
      appel("GET", "/json/validation/journees-validees"),
    getTransactionsJour: (date) =>
      appel(
        "GET",
        `/json/validation/transactions?date=${encodeURIComponent(date)}`,
      ),
    getIncidentsJour: (date) =>
      appel(
        "GET",
        `/json/validation/incidents?date=${encodeURIComponent(date)}`,
      ),

    // ── Base de données — profil (courante / archive) ─────
    bddGetProfile: () => normalizeBddProfile(bddProfile),
    bddSetProfile: (profile) => {
      bddProfile = normalizeBddProfile(profile);
      writeBddProfile(bddProfile);
      return bddProfile;
    },
    bddGetYear: () => normalizeBddYear(bddYear),
    bddSetYear: (year) => {
      bddYear = normalizeBddYear(year);
      writeBddYear(bddYear);
      return bddYear;
    },
    bddProfiles: () => appel("GET", "/json/bdd/profiles"),
    bddTables: () => appel("GET", withBddProfile("/json/bdd/tables")),

    // ── Sprint 6 — Base de données (US19) ─────────────────
    // 4 méthodes génériques — la table est passée en paramètre
    bddGet: (table) => appel("GET", withBddQuery(`/json/bdd/${table}`)),
    bddPost: (table, d) => appel("POST", withBddProfile(`/json/bdd/${table}`), d),
    bddPut: (table, id, d) =>
      appel("POST", withBddProfile(`/json/bdd/${table}/${id}`), d),
    bddDel: (table, id) =>
      appel("POST", withBddProfile(`/json/bdd/${table}/${id}/suppr`)),
    bddGetRecuDetail: (id) =>
      appel("GET", withBddQuery(`/json/bdd/recu/${id}/detail`)),
  };
})();
