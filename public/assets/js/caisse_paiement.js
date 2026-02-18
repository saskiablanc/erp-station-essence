let tentatives = 3;
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

let paymentTimer = null;
let removeTimer = null;
let paymentActive = false;
let cardInserted = false;
let modePaiement = null;
let receiptPrompt = false;
let paymentOk = false;
let transactionSaved = false;

const messageElem = document.getElementById("message");
const codeInput = document.getElementById("code");
const statusElem = document.getElementById("caisse-status");
const montantLabel = document.getElementById("caisse-montant-label");
const montantDisplay = document.getElementById("caisse-montant");
const actionsWrap = document.getElementById("caisse-actions");
const defaultActionsHtml = actionsWrap ? actionsWrap.innerHTML : "";

function setMessage(message) {
  if (!messageElem) return;
  const next = String(message ?? "").trim();
  messageElem.innerText = next === "" ? "Bonjour" : message;
}

function updateCardIndicator() {
  const indicator = document.getElementById("card-indicator");
  const statusText = document.getElementById("card-status-text");
  if (!indicator || !statusText) return;

  indicator.classList.toggle("is-on", cardInserted);
  statusText.textContent = cardInserted ? "Carte insérée" : "Carte retirée";
}

function updateRightScreen() {
  if (!statusElem || !actionsWrap) {
    return;
  }

  const showMontant = !!modePaiement || paymentOk || receiptPrompt;
  if (montantLabel) {
    montantLabel.style.display = showMontant ? "block" : "none";
  }
  if (montantDisplay) {
    montantDisplay.style.display = showMontant ? "block" : "none";
  }

  if (receiptPrompt) {
    statusElem.textContent = "Souhaitez-vous un reçu ?";
    return;
  }

  if (!modePaiement) {
    statusElem.textContent = "Veuillez choisir votre mode de paiement";
    actionsWrap.style.display = "grid";
    return;
  }

  if (!paymentOk) {
    statusElem.textContent = "Suivez les instructions sur le TPE";
    actionsWrap.style.display = "none";
    return;
  }

  statusElem.textContent = "Paiement accepté";
  actionsWrap.style.display = "none";
}

function insererCarte() {
  if (!modePaiement) {
    setMessage("Choisissez le mode de paiement");
    return;
  }
  cardInserted = true;
  updateCardIndicator();
  paymentActive = true;
  if (codeInput) {
    codeInput.disabled = false;
  }
  setMessage("Veuillez saisir votre code secret");
}

function retirerCarte() {
  clearTimers();
  cardInserted = false;
  updateCardIndicator();
  if (codeInput) {
    codeInput.value = "";
    codeInput.disabled = true;
  }
  paymentActive = false;
  tentatives = 3;
  if (paymentOk && !receiptPrompt) {
    afficherPropositionRecu();
  } else {
    setMessage("");
  }
}

function ajouterChiffre(chiffre) {
  if (!paymentActive || !cardInserted || !codeInput) return;
  if (codeInput.disabled) return;
  if (codeInput.value.length < 4) {
    codeInput.value += chiffre;
  }
}

function retour() {
  if (!paymentActive || !cardInserted || !codeInput) return;
  if (codeInput.disabled) return;
  codeInput.value = codeInput.value.slice(0, -1);
}

function annuler() {
  if (!paymentActive) return;
  if (cardInserted) {
    clearTimers();
    if (codeInput) {
      codeInput.value = "";
      codeInput.disabled = true;
    }
    setMessage("Paiement annulé. Retirez la carte");
    paymentActive = false;
    tentatives = 3;
    return;
  }
  cancelPayment();
}

function valider() {
  if (!paymentActive) return;
  if (!cardInserted) {
    setMessage("Insérez votre carte pour continuer");
    return;
  }
  if (!modePaiement) {
    setMessage("Choisissez le mode de paiement");
    return;
  }

  const code = codeInput ? codeInput.value : "";
  const endpoint = getPaiementEndpoint();

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:
      "code=" +
      encodeURIComponent(code) +
      "&montant=" +
      encodeURIComponent(montant),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "erreur_code") {
        tentatives--;
        if (tentatives > 0) {
          setMessage(
            "Erreur : Code Secret. Il vous reste " + tentatives + " tentatives",
          );
        } else {
          setMessage("Carte bloquée");
          if (codeInput) {
            codeInput.disabled = true;
          }
        }
      }

      if (data.status === "solde_insuffisant") {
        setMessage(data.message);
      }

      if (data.status === "ok") {
        setMessage("Code bon");
        clearTimers();
        paymentTimer = setTimeout(() => {
          setMessage("Paiement accepté");
          paymentOk = true;
          updateRightScreen();
          finaliserTransaction();
          removeTimer = setTimeout(() => {
            setMessage("Retirez la carte");
          }, 900);
        }, 800);
        if (codeInput) {
          codeInput.disabled = true;
        }
      }

      if (codeInput) {
        codeInput.value = "";
      }
    });
}

function clearTimers() {
  if (paymentTimer) clearTimeout(paymentTimer);
  if (removeTimer) clearTimeout(removeTimer);
}

function cancelPayment() {
  if (!paymentActive) return;
  clearTimers();
  setMessage("");
  if (codeInput) {
    codeInput.value = "";
    codeInput.disabled = true;
  }
  paymentActive = false;
  tentatives = 3;
}

function getEndpoint(path) {
  const current = window.location.pathname || "";
  const base = window.basePath || "";
  const cleaned = path.replace(/^\/+/, "");
  if (current.includes("index.php")) {
    return (base ? base + "/" : "") + "index.php?page=" + cleaned;
  }
  const prefix = base ? base + "/" : "/";
  return prefix + cleaned;
}

function getPaiementEndpoint() {
  return getEndpoint("paiement/traiter");
}

async function finaliserTransaction() {
  if (transactionSaved) return;
  try {
    const response = await fetch(getEndpoint("transaction/finaliser"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data.status === "ok") {
      transactionSaved = true;
    } else {
      console.warn("Enregistrement transaction impossible", data.message);
    }
  } catch (error) {
    console.warn("Enregistrement transaction impossible", error);
  }
}

function afficherPropositionRecu() {
  if (!statusElem || !actionsWrap) return;

  receiptPrompt = true;
  statusElem.textContent = "Souhaitez-vous un reçu ?";
  actionsWrap.innerHTML = `
    <button type="button" class="borne-btn bancaire" id="btn-recu-oui">
      <span class="btn-label">Oui, imprimer</span>
    </button>
    <button type="button" class="borne-btn" id="btn-recu-non"
            style="background:#f3f4f6; color:#111827;">
      <span class="btn-label">Non, merci</span>
    </button>
  `;
  actionsWrap.style.display = "grid";

  const btnOui = document.getElementById("btn-recu-oui");
  const btnNon = document.getElementById("btn-recu-non");
  if (btnOui) {
    btnOui.addEventListener("click", () => demanderImpression(true));
  }
  if (btnNon) {
    btnNon.addEventListener("click", () => demanderImpression(false));
  }
}

function demanderImpression(accepte) {
  if (accepte) {
    fetch(getEndpoint("recu/imprimer"), { method: "POST" })
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

  receiptPrompt = false;
  paymentOk = false;
  paymentActive = false;
  modePaiement = null;
  if (actionsWrap) {
    actionsWrap.innerHTML = defaultActionsHtml;
  }
  updateRightScreen();
  setMessage("");
}

function formatMontant(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCardIndicator();
  updateRightScreen();

  if (actionsWrap) {
    actionsWrap.addEventListener("click", (event) => {
      const button = event.target.closest("[data-paiement]");
      if (!button) return;
      modePaiement = button.dataset.paiement || "bancaire";
      paymentActive = true;
      updateRightScreen();
      setMessage("Montant à payer : " + formatMontant(montant) + " €");
    });
  }

  const toggle = document.getElementById("actions-toggle");
  const content = document.getElementById("actions-content");
  if (toggle && content) {
    toggle.addEventListener("click", () => {
      const collapsed = content.style.display === "none";
      content.style.display = collapsed ? "block" : "none";
      toggle.setAttribute("aria-expanded", collapsed ? "true" : "false");
    });
  }
});
