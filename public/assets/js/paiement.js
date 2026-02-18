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
let paymentActive = true;
let cardInserted = false;

function setMessage(message) {
  const el = document.getElementById("message");
  if (!el) return;
  const next = String(message ?? "").trim();
  el.innerText = next === "" ? "Bonjour" : message;
}

// ============================================================
// Indicateur carte — aligné sur transaction.js
// ============================================================
function updateCardIndicator() {
  const indicator = document.getElementById("card-indicator");
  const statusText = document.getElementById("card-status-text");
  if (!indicator || !statusText) return;

  indicator.classList.toggle("is-on", cardInserted);
  statusText.textContent = cardInserted ? "Carte insérée" : "Carte retirée";
}

// ============================================================
// Actions physiques
// ============================================================
function insererCarte() {
  cardInserted = true;
  updateCardIndicator();
  if (!paymentActive) return;
  document.getElementById("code").disabled = false;
  setMessage("Veuillez saisir votre code secret");
}

function retirerCarte() {
  clearTimers();
  cardInserted = false;
  updateCardIndicator();
  setMessage("");
  document.getElementById("code").value = "";
  document.getElementById("code").disabled = true;
  paymentActive = false;
  tentatives = 3;
}

// ============================================================
// Saisie du code
// ============================================================
function ajouterChiffre(chiffre) {
  if (!paymentActive || !cardInserted) return;
  const champ = document.getElementById("code");
  if (champ.disabled) return;
  if (champ.value.length < 4) {
    champ.value += chiffre;
  }
}

function retour() {
  if (!paymentActive || !cardInserted) return;
  const champ = document.getElementById("code");
  if (champ.disabled) return;
  champ.value = champ.value.slice(0, -1);
}

function annuler() {
  if (!paymentActive) return;
  if (cardInserted) {
    clearTimers();
    document.getElementById("code").value = "";
    document.getElementById("code").disabled = true;
    setMessage("Paiement annulé. Retirez la carte");
    paymentActive = false;
    tentatives = 3;
    return;
  }
  cancelPayment();
}

// ============================================================
// Validation du paiement
// ============================================================
function valider() {
  if (!paymentActive) return;
  const code = document.getElementById("code").value;
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
          document.getElementById("code").disabled = true;
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
          removeTimer = setTimeout(() => {
            setMessage("Retirez la carte");
          }, 900);
        }, 800);
        document.getElementById("code").disabled = true;
      }

      document.getElementById("code").value = "";
    });
}

// ============================================================
// Utilitaires
// ============================================================
function getPaiementEndpoint() {
  const path = window.location.pathname || "";
  if (path.includes("index.php")) {
    return "index.php?page=paiement/traiter";
  }
  return "paiement/traiter";
}

function cancelPayment() {
  if (!paymentActive) return;
  clearTimers();
  setMessage("");
  document.getElementById("code").value = "";
  document.getElementById("code").disabled = true;
  paymentActive = false;
  tentatives = 3;
}

function clearTimers() {
  if (paymentTimer) clearTimeout(paymentTimer);
  if (removeTimer) clearTimeout(removeTimer);
}

// ============================================================
// Init
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  updateCardIndicator();

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
