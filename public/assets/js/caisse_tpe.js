(function (state, dom, utils) {
  if (!state || !dom || !utils) {
    return;
  }

  function insererCarte() {
    if (!state.modePaiement) {
      utils.setMessage("Choisissez le mode de paiement");
      return;
    }
    state.cardInserted = true;
    utils.updateCardIndicator();
    state.paymentActive = true;
    if (dom.codeInput) {
      dom.codeInput.disabled = false;
    }
    utils.setMessage("Veuillez saisir votre code secret");
  }

  function retirerCarte() {
    utils.clearTimers();
    state.cardInserted = false;
    utils.updateCardIndicator();
    if (dom.codeInput) {
      dom.codeInput.value = "";
      dom.codeInput.disabled = true;
    }
    state.paymentActive = false;
    state.tentatives = 3;
    if (state.paymentOk && !state.receiptPrompt && window.CaisseScreen) {
      window.CaisseScreen.showReceiptPrompt();
    } else {
      utils.setMessage("");
    }
  }

  function ajouterChiffre(chiffre) {
    if (!state.paymentActive || !state.cardInserted || !dom.codeInput) return;
    if (dom.codeInput.disabled) return;
    if (dom.codeInput.value.length < 4) {
      dom.codeInput.value += chiffre;
    }
  }

  function retour() {
    if (!state.paymentActive || !state.cardInserted || !dom.codeInput) return;
    if (dom.codeInput.disabled) return;
    dom.codeInput.value = dom.codeInput.value.slice(0, -1);
  }

  function annuler() {
    if (!state.paymentActive) return;
    if (state.cardInserted) {
      utils.clearTimers();
      if (dom.codeInput) {
        dom.codeInput.value = "";
        dom.codeInput.disabled = true;
      }
      utils.setMessage("Paiement annulé. Retirez la carte");
      state.paymentActive = false;
      state.tentatives = 3;
      return;
    }
    cancelPayment();
  }

  function valider() {
    if (!state.paymentActive) return;
    if (!state.cardInserted) {
      utils.setMessage("Insérez votre carte pour continuer");
      return;
    }
    if (!state.modePaiement) {
      utils.setMessage("Choisissez le mode de paiement");
      return;
    }

    const code = dom.codeInput ? dom.codeInput.value : "";
    const endpoint = utils.getPaiementEndpoint();

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:
        "code=" +
        encodeURIComponent(code) +
        "&montant=" +
        encodeURIComponent(state.montant),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "erreur_code") {
          state.tentatives--;
          if (state.tentatives > 0) {
            utils.setMessage(
              "Erreur : Code Secret. Il vous reste " +
                state.tentatives +
                " tentatives",
            );
          } else {
            utils.setMessage("Carte bloquée");
            if (dom.codeInput) {
              dom.codeInput.disabled = true;
            }
          }
        }

        if (data.status === "solde_insuffisant") {
          utils.setMessage(data.message);
        }

        if (data.status === "ok") {
          utils.setMessage("Code bon");
          utils.clearTimers();
          state.paymentTimer = setTimeout(() => {
            utils.setMessage("Paiement accepté");
            state.paymentOk = true;
            if (window.CaisseScreen) {
              window.CaisseScreen.update();
            }
            finaliserTransaction();
            state.removeTimer = setTimeout(() => {
              utils.setMessage("Retirez la carte");
            }, 900);
          }, 800);
          if (dom.codeInput) {
            dom.codeInput.disabled = true;
          }
        }

        if (dom.codeInput) {
          dom.codeInput.value = "";
        }
      });
  }

  function cancelPayment() {
    if (!state.paymentActive) return;
    utils.clearTimers();
    utils.setMessage("");
    if (dom.codeInput) {
      dom.codeInput.value = "";
      dom.codeInput.disabled = true;
    }
    state.paymentActive = false;
    state.tentatives = 3;
  }

  async function finaliserTransaction() {
    if (state.transactionSaved) return;
    try {
      const response = await fetch(utils.getEndpoint("transaction/finaliser"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.status === "ok") {
        state.transactionSaved = true;
      } else {
        console.warn("Enregistrement transaction impossible", data.message);
      }
    } catch (error) {
      console.warn("Enregistrement transaction impossible", error);
    }
  }

  function handleKeypad(event) {
    const keyButton = event.target.closest("[data-key]");
    if (keyButton) {
      ajouterChiffre(keyButton.dataset.key);
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    handleAction(actionButton.dataset.action);
  }

  function handleActionsPanel(event) {
    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    handleAction(actionButton.dataset.action);
  }

  function handleAction(action) {
    if (action === "annuler") {
      annuler();
      return;
    }
    if (action === "valider") {
      valider();
      return;
    }
    if (action === "retour") {
      retour();
      return;
    }
    if (action === "inserer-carte") {
      insererCarte();
      return;
    }
    if (action === "retirer-carte") {
      retirerCarte();
    }
  }

  function init() {
    utils.updateCardIndicator();
    if (dom.keypad) {
      dom.keypad.addEventListener("click", handleKeypad);
    }
    if (dom.tpeActions) {
      dom.tpeActions.addEventListener("click", handleActionsPanel);
    }
    if (dom.actionsContent) {
      dom.actionsContent.addEventListener("click", handleActionsPanel);
    }
    if (dom.actionsToggle && dom.actionsContent) {
      dom.actionsToggle.addEventListener("click", () => {
        const collapsed = dom.actionsContent.style.display === "none";
        dom.actionsContent.style.display = collapsed ? "block" : "none";
        dom.actionsToggle.setAttribute(
          "aria-expanded",
          collapsed ? "true" : "false",
        );
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})(window.CaisseState, window.CaisseDom, window.CaisseUtils);
