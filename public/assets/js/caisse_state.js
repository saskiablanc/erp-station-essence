(() => {
  const montantElement = document.getElementById("montant");
  let montant = 0;
  if (montantElement) {
    const rawMontant =
      montantElement.dataset.montant || montantElement.textContent || "0";
    const cleaned = String(rawMontant).replace(/\s/g, "").replace(",", ".");
    montant = Number.parseFloat(cleaned);
    if (Number.isNaN(montant)) {
      montant = 0;
    }
  }

  const basePath = document.body?.dataset?.basePath || "";

  const state = {
    montant,
    basePath,
    tentatives: 3,
    paymentTimer: null,
    removeTimer: null,
    paymentActive: false,
    cardInserted: false,
    modePaiement: null,
    receiptPrompt: false,
    paymentOk: false,
    transactionSaved: false,
  };

  const dom = {
    message: document.getElementById("message"),
    codeInput: document.getElementById("code"),
    status: document.getElementById("caisse-status"),
    montantLabel: document.getElementById("caisse-montant-label"),
    montantDisplay: document.getElementById("caisse-montant"),
    actionsWrap: document.getElementById("caisse-actions"),
    keypad: document.querySelector(".clavier"),
    tpeActions: document.querySelector(".tpe-actions"),
    actionsToggle: document.getElementById("actions-toggle"),
    actionsContent: document.getElementById("actions-content"),
  };

  const utils = {
    setMessage(message) {
      if (!dom.message) return;
      const next = String(message ?? "").trim();
      dom.message.innerText = next === "" ? "Bonjour" : message;
    },
    updateCardIndicator() {
      const indicator = document.getElementById("card-indicator");
      const statusText = document.getElementById("card-status-text");
      if (!indicator || !statusText) return;

      indicator.classList.toggle("is-on", state.cardInserted);
      statusText.textContent = state.cardInserted
        ? "Carte insérée"
        : "Carte retirée";
    },
    clearTimers() {
      if (state.paymentTimer) clearTimeout(state.paymentTimer);
      if (state.removeTimer) clearTimeout(state.removeTimer);
      state.paymentTimer = null;
      state.removeTimer = null;
    },
    getEndpoint(path) {
      const current = window.location.pathname || "";
      const cleaned = path.replace(/^\/+/, "");
      if (current.includes("index.php")) {
        return (state.basePath ? state.basePath + "/" : "") +
          "index.php?page=" +
          cleaned;
      }
      const prefix = state.basePath ? state.basePath + "/" : "/";
      return prefix + cleaned;
    },
    getPaiementEndpoint() {
      return utils.getEndpoint("paiement/traiter");
    },
    formatMontant(value) {
      const numeric = Number(value) || 0;
      return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric);
    },
  };

  window.CaisseState = state;
  window.CaisseDom = dom;
  window.CaisseUtils = utils;
})();
