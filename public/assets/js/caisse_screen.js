(function (state, dom, utils) {
  if (!state || !dom || !utils) {
    return;
  }

  let defaultActionsHtml = "";

  function toggleHidden(element, hidden) {
    if (!element) return;
    element.classList.toggle("is-hidden", hidden);
  }

  function updateScreen() {
    if (!dom.status || !dom.actionsWrap) {
      return;
    }

    const showMontant =
      Boolean(state.modePaiement) || state.paymentOk || state.receiptPrompt;
    toggleHidden(dom.montantLabel, !showMontant);
    toggleHidden(dom.montantDisplay, !showMontant);

    if (state.receiptPrompt) {
      dom.status.textContent = "Souhaitez-vous un reçu ?";
      dom.actionsWrap.classList.remove("is-hidden");
      return;
    }

    if (!state.modePaiement) {
      dom.status.textContent = "Veuillez choisir votre mode de paiement";
      dom.actionsWrap.classList.remove("is-hidden");
      return;
    }

    if (!state.paymentOk) {
      dom.status.textContent = "Suivez les instructions sur le TPE";
      dom.actionsWrap.classList.add("is-hidden");
      return;
    }

    dom.status.textContent = "Paiement accepté";
    dom.actionsWrap.classList.add("is-hidden");
  }

  function setModePaiement(mode) {
    state.modePaiement = mode;
    state.paymentActive = true;
    updateScreen();
    utils.setMessage(
      "Montant à payer : " + utils.formatMontant(state.montant) + " €",
    );
  }

  function showReceiptPrompt() {
    if (!dom.actionsWrap) return;

    state.receiptPrompt = true;
    dom.actionsWrap.innerHTML = `
      <button type="button" class="borne-btn bancaire" data-recu="oui">
        <span class="btn-label">Oui, imprimer</span>
      </button>
      <button type="button" class="borne-btn muted" data-recu="non">
        <span class="btn-label">Non, merci</span>
      </button>
    `;
    updateScreen();
  }

  function demanderImpression(accepte) {
    if (accepte) {
      fetch(utils.getEndpoint("recu/imprimer"), { method: "POST" })
        .then((response) => response.json())
        .then((data) => {
          if (data.status !== "ok") {
            console.warn("Impression reçu impossible", data.message);
          }
        })
        .catch((error) => {
          console.warn("Impression reçu impossible", error);
        });
    }

    state.receiptPrompt = false;
    state.paymentOk = false;
    state.paymentActive = false;
    state.modePaiement = null;
    if (dom.actionsWrap) {
      dom.actionsWrap.innerHTML = defaultActionsHtml;
    }
    updateScreen();
    utils.setMessage("");
  }

  function handleActionsClick(event) {
    const paymentButton = event.target.closest("[data-paiement]");
    if (paymentButton) {
      setModePaiement(paymentButton.dataset.paiement || "bancaire");
      return;
    }

    const receiptButton = event.target.closest("[data-recu]");
    if (receiptButton) {
      demanderImpression(receiptButton.dataset.recu === "oui");
    }
  }

  function init() {
    if (dom.actionsWrap) {
      defaultActionsHtml = dom.actionsWrap.innerHTML;
      dom.actionsWrap.addEventListener("click", handleActionsClick);
    }
    updateScreen();
  }

  window.CaisseScreen = {
    init,
    update: updateScreen,
    showReceiptPrompt,
  };

  document.addEventListener("DOMContentLoaded", init);
})(window.CaisseState, window.CaisseDom, window.CaisseUtils);
