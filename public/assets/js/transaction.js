/**
 * transaction.js - US28 : Consultation des informations de transaction
 * Gère la simulation de délivrance en temps réel et l'affichage dynamique
 */

// ============================================================
// Variables globales
// ============================================================
let delivranceEnCours = false;
let demarrageEnCours = false;
let arretDemande = false;
let intervalDelivrance = null;
let quantiteActuelle = 0.0;
let debitLitresParSeconde = 0.5; // 30L/min = 0.5L/s
let prixLitre = Number(window.carburantData?.prixLitre) || 0;
const energieType = window.energieType === "electricite" ? "electricite" : "carburant";
let tempsChargeSecondes = 0;
let pistoletDecroche = false;
const LAST_TOTAL_KEY = "transaction_last_total";
const LAST_QUANTITE_KEY = "transaction_last_quantite";
let transactionTerminee = false;
let transactionFinale = null;
let modePaiement = null;
let tentatives = 3;
let paymentTimer = null;
let removeTimer = null;
let paymentActive = false;
let cardInserted = false;

// ============================================================
// Éléments DOM
// ============================================================
const btnPaiement = document.getElementById("btn-paiement");
const btnDelivrance = document.getElementById("btn-delivrance");
const btnDecrocher = document.getElementById("btn-decrocher");
const modeToggle = document.getElementById("mode-toggle");
const statusText = document.getElementById("status-text");
const quantiteValue = document.getElementById("quantite-value");
const totalValue = document.getElementById("total-value");
const infoTransaction = document.getElementById("info-transaction");
const stockRestant = document.getElementById("stock-restant");
const pistoletDot = document.getElementById("pistolet-dot");
const pistoletText = document.getElementById("pistolet-text");
const carburantSelect = document.getElementById("carburant-select");
const chargeSelect = document.getElementById("charge-select");
const formSelection = document.getElementById("form-selection");
const formSelectionCharge = document.getElementById("form-selection-charge");
const tpeEmbed = document.getElementById("tpe-automate");
let montantElem = document.getElementById("montant");
const messageElem = document.getElementById("message");
const codeInput = document.getElementById("code");
const choixPaiement = document.getElementById("choix-paiement");
const choixMontant = document.getElementById("choix-montant");
const choixStatus = document.getElementById("choix-status");
const choixActions = document.getElementById("choix-actions");
const choixButtons = document.querySelectorAll("[data-paiement]");
const cardIndicator = document.getElementById("card-indicator");
const cardStatusText = document.getElementById("card-status-text");
const actionsEssence = document.getElementById("actions-essence");
const actionsCarte = document.getElementById("actions-carte");
const btnInsererCarte = document.getElementById("btn-inserer-carte");
const btnRetirerCarte = document.getElementById("btn-retirer-carte");
const energieToggle = document.getElementById("energie-toggle");

// ============================================================
// US28 - Critère 2 : Initialisation
// ============================================================
document.addEventListener("DOMContentLoaded", function () {
  console.log("Transaction JS chargé");
  console.log("Carburant:", window.carburantData);

  // Vérifier si les données sont disponibles
  if (
    !window.carburantData.prixDisponible ||
    !window.carburantData.stockDisponible
  ) {
    console.warn("Données indisponibles - paiement désactivé");
  }

  // Event listeners
  if (btnPaiement) {
    btnPaiement.addEventListener("click", procederPaiement);
  }

  if (modeToggle) {
    modeToggle.addEventListener("change", () => {
      const mode = modeToggle.checked ? "24" : "caisse";
      const baseUrl = getTransactionEndpoint("transaction", true);
      const separator = baseUrl.includes("?") ? "&" : "?";
      window.location.href = baseUrl + separator + "mode=" + mode;
    });
  }

  if (energieToggle) {
    energieToggle.addEventListener("change", () => {
      const energie = energieToggle.checked ? "electricite" : "carburant";
      const baseUrl = getTransactionEndpoint("transaction", true);
      const separator = baseUrl.includes("?") ? "&" : "?";
      window.location.href = baseUrl + separator + "energie=" + energie;
    });
  }

  if (btnDelivrance) {
    btnDelivrance.addEventListener("pointerdown", (event) => {
      if (event.button && event.button !== 0) {
        return;
      }
      event.preventDefault();
      btnDelivrance.setPointerCapture(event.pointerId);
      demarrerDelivrance();
    });

    const stopHandler = (event) => {
      event.preventDefault();
      demanderArret();
    };

    btnDelivrance.addEventListener("pointerup", stopHandler);
    btnDelivrance.addEventListener("pointercancel", stopHandler);
  }

  if (btnDecrocher) {
    btnDecrocher.addEventListener("click", () => {
      const selectionOk = isElectric()
        ? chargeSelect && chargeSelect.value
        : carburantSelect && carburantSelect.value;
      if (!selectionOk) {
        alert(
          isElectric()
            ? "Choisissez un type de charge avant de décrocher le pistolet."
            : "Choisissez un carburant avant de décrocher le pistolet."
        );
        return;
      }
      if (isElectric() && formSelectionCharge) {
        formSelectionCharge.submit();
        return;
      }
      if (!isElectric() && formSelection) {
        formSelection.submit();
        return;
      }
    });
  }

  updatePistoletIndicator();
  updateDelivranceAvailability();
  restoreLastTransactionDisplay();
  updateFinTransactionDisplay();
  if (window.pistoletDecroche) {
    pistoletDecroche = true;
    modePaiement = null;
    resetTransactionDisplay();
    resetPaymentState();
    updatePistoletIndicator();
    updateDelivranceAvailability();
    updateFinTransactionDisplay();
  }

  if (choixButtons.length) {
    choixButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modePaiement = btn.dataset.paiement || "bancaire";
        paymentActive = true;
        if (transactionFinale) {
          renderMontantMessage();
        }
        updateChoixScreen();
        updateFinTransactionDisplay();
      });
    });
  }

  if (btnInsererCarte) {
    btnInsererCarte.addEventListener("click", insererCarte);
  }

  if (btnRetirerCarte) {
    btnRetirerCarte.addEventListener("click", retirerCarte);
  }

  updateCardIndicator();

  // Actions physiques
  setupActionsPhysiques();
});

function resetTransactionDisplay() {
  transactionTerminee = false;
  transactionFinale = null;
  quantiteActuelle = 0.0;
  tempsChargeSecondes = 0;
  if (quantiteValue) {
    quantiteValue.textContent = isElectric() ? "00:00" : "0.000";
  }
  if (totalValue) {
    totalValue.textContent = "0.00";
  }
  if (infoTransaction) {
    infoTransaction.style.display = "none";
  }
  if (statusText) {
    statusText.textContent = "En attente";
    statusText.classList.remove("active");
  }
}

// ============================================================
// US28 - Critères 2, 3 : Démarrer la délivrance
// ============================================================
async function demarrerDelivrance() {
  console.log("Démarrage de la délivrance...");
  if (demarrageEnCours || delivranceEnCours) {
    return;
  }
  if (!pistoletDecroche) {
    alert("Décrochez le pistolet avant de délivrer.");
    return;
  }
  if (btnDelivrance && btnDelivrance.disabled) {
    return;
  }

  demarrageEnCours = true;
  arretDemande = false;
  tempsChargeSecondes = 0;

  // Appel API pour créer la transaction
  try {
    const response = await fetch(getTransactionEndpoint("transaction/demarrer"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status !== "ok") {
      alert("Erreur : " + data.message);
      return;
    }

    console.log("Transaction créée:", data.id_transaction);

    // Démarrer la simulation
    delivranceEnCours = true;
    quantiteActuelle = 0.0;
    updateAffichage(quantiteActuelle, 0, 0);

    // Mettre à jour l'UI
    statusText.textContent = isElectric() ? "Charge en cours" : "Délivrance en cours";
    statusText.classList.add("active");
    updateFinTransactionDisplay();

    // Démarrer l'intervalle de mise à jour (US28 - critère 2)
    intervalDelivrance = setInterval(updateDelivrance, 100); // Mise à jour toutes les 100ms

    if (arretDemande) {
      arretDemande = false;
      arreterDelivrance();
    }
  } catch (error) {
    console.error("Erreur démarrage:", error);
    alert("Erreur lors du démarrage de la délivrance");
  } finally {
    demarrageEnCours = false;
  }
}

// ============================================================
// US28 - Critère 2 : Mise à jour continue de la quantité
// ============================================================
function updateDelivrance() {
  if (!delivranceEnCours) return;

  if (isElectric()) {
    tempsChargeSecondes += 0.1;
    quantiteActuelle += getDebitKwhParSeconde() * 0.1;
  } else {
    // Augmenter la quantité (0.5L/s = 0.05L par 100ms)
    quantiteActuelle += debitLitresParSeconde * 0.1;

    // Vérifier qu'on ne dépasse pas le stock
    const stockMax = window.carburantData.stockLitre;
    if (stockMax > 0 && quantiteActuelle >= stockMax) {
      quantiteActuelle = stockMax;
      arreterDelivrance();
      alert("Stock épuisé !");
      return;
    }

    // Limiter à un plein raisonnable (70L)
    if (quantiteActuelle >= 70.0) {
      quantiteActuelle = 70.0;
      arreterDelivrance();
      return;
    }
  }

  // US28 - Critère 3 : Calcul automatique du total
  const total = quantiteActuelle * prixLitre;

  // Mettre à jour l'affichage avec animation
  updateAffichage(quantiteActuelle, total, tempsChargeSecondes);

  // Envoyer la mise à jour au serveur toutes les secondes
  if (Math.floor((isElectric() ? tempsChargeSecondes : quantiteActuelle) * 10) % 10 === 0) {
    envoyerMiseAJour(quantiteActuelle, tempsChargeSecondes);
  }
}

// ============================================================
// US28 - Critère 2 : Mettre à jour l'affichage avec animation
// ============================================================
function updateAffichage(quantite, total, tempsSecondes) {
  // Animation de mise à jour
  if (isElectric()) {
    quantiteValue.textContent = formatTemps(tempsSecondes);
  } else {
    quantiteValue.textContent = quantite.toFixed(3);
  }
  totalValue.textContent = total.toFixed(2);

  // Ajouter classe d'animation
  quantiteValue.parentElement.classList.add("updating");
  totalValue.parentElement.classList.add("updating");

  setTimeout(() => {
    quantiteValue.parentElement.classList.remove("updating");
    totalValue.parentElement.classList.remove("updating");
  }, 300);
}

// ============================================================
// Envoyer mise à jour au serveur
// ============================================================
async function envoyerMiseAJour(quantite, tempsSecondes) {
  try {
    const formData = new FormData();
    formData.append("quantite", quantite.toFixed(3));
    if (isElectric()) {
      const tempsCharge = formatTempsCharge(tempsSecondes);
      formData.append("temps_charge", tempsCharge);
      formData.append("temps_secondes", String(tempsSecondes.toFixed(1)));
    }

    await fetch(getTransactionEndpoint("transaction/maj-delivrance"), {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    console.error("Erreur envoi mise à jour:", error);
  }
}

// ============================================================
// US28 - Critère 4 : Arrêter la délivrance
// ============================================================
async function arreterDelivrance() {
  console.log("Arrêt de la délivrance...");
  if (!delivranceEnCours) {
    return;
  }

  // Arrêter l'intervalle
  if (intervalDelivrance) {
    clearInterval(intervalDelivrance);
    intervalDelivrance = null;
  }

  delivranceEnCours = false;

  // Appel API pour terminer la transaction
  try {
    const response = await fetch(getTransactionEndpoint("transaction/terminer"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Réponse serveur invalide");
    }

    const data = await response.json();

    if (data.status === "ok") {
      console.log("Transaction terminée:", data);

      // US28 - Critère 4 : Figer les valeurs
      if (isElectric()) {
        quantiteValue.textContent = data.temps_charge
          ? formatTempsFromString(data.temps_charge)
          : formatTemps(tempsChargeSecondes);
        totalValue.textContent = data.total_final.toFixed(2);
      } else {
        quantiteValue.textContent = data.quantite_finale.toFixed(3);
        totalValue.textContent = data.total_final.toFixed(2);
      }

      // Mettre à jour l'UI
      statusText.textContent = isElectric() ? "Charge terminée" : "Délivrance terminée";
      statusText.classList.remove("active");

      // US28 - Critère 7 : Afficher les infos de transaction
      afficherInfosTransaction(data);
      transactionTerminee = true;
      transactionFinale = {
        total: data.total_final,
        quantite: data.quantite_finale,
        tempsCharge: data.temps_charge ?? null,
        dateHeure: data.date_heure,
        idTransaction: data.id_transaction
      };
      updateFinTransactionDisplay();

      // Mettre à jour le stock restant
      if (!isElectric()) {
        const stockRestantValue =
          window.carburantData.stockLitre - data.quantite_finale;
        if (stockRestant) {
          stockRestant.textContent = stockRestantValue.toFixed(3) + " L";
        }
      }

      storeLastTransactionDisplay(
        isElectric()
          ? (data.temps_charge ? formatTempsFromString(data.temps_charge) : formatTemps(tempsChargeSecondes))
          : data.quantite_finale.toFixed(3),
        data.total_final.toFixed(2)
      );
    } else {
      console.warn("Arrêt refusé:", data.message || "Erreur inconnue");
    }
  } catch (error) {
    console.error("Erreur arrêt:", error);
    statusText.textContent = "Arrêt impossible";
    statusText.classList.remove("active");
  }
}

// ============================================================
// US28 - Critère 7 : Afficher les informations finales
// ============================================================
function afficherInfosTransaction(data) {
  const idTransactionElem = document.getElementById("id-transaction");
  const dateHeureElem = document.getElementById("date-heure");

  if (idTransactionElem) {
    idTransactionElem.textContent = data.id_transaction;
  }

  if (dateHeureElem) {
    // Formater la date en français
    const date = new Date(data.date_heure);
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };
    dateHeureElem.textContent = date.toLocaleString("fr-FR", options);
  }

  if (!infoTransaction) {
    return;
  }
}

// ============================================================
// Procéder au paiement
// ============================================================
function procederPaiement() {
  console.log("Redirection vers le paiement...");
  if (!isAutomate24()) {
    redirectToCaisse();
    return;
  }
  window.location.href = getTransactionEndpoint("choix-paiement", true);
}

// ============================================================
// Actions physiques
// ============================================================
function setupActionsPhysiques() {
  const actionsToggle = document.getElementById("actions-toggle");
  const actionsContent = document.getElementById("actions-content");

  if (actionsToggle && actionsContent) {
    actionsToggle.addEventListener("click", () => {
      const isHidden = actionsContent.style.display === "none";
      actionsContent.style.display = isHidden ? "block" : "none";
    });
  }
}

function simulerRaccrochage() {
  console.log("Simulation : Pistolet raccroché");
  if (delivranceEnCours) {
    arreterDelivrance();
  }
  pistoletDecroche = false;
  updatePistoletIndicator();
  updateDelivranceAvailability();
  updateFinTransactionDisplay();
}

function annulerTransaction() {
  if (confirm("Voulez-vous vraiment annuler cette transaction ?")) {
    console.log("Transaction annulée");

    // Arrêter la délivrance si en cours
    if (delivranceEnCours) {
      if (intervalDelivrance) {
        clearInterval(intervalDelivrance);
      }
      delivranceEnCours = false;
    }

    // Rediriger vers l'accueil
    window.location.href = getTransactionEndpoint("home", true);
  }
}

function demanderArret() {
  if (demarrageEnCours && !delivranceEnCours) {
    arretDemande = true;
    return;
  }
  arreterDelivrance();
}

function updatePistoletIndicator() {
  if (!pistoletDot || !pistoletText) {
    return;
  }
  if (pistoletDecroche) {
    pistoletDot.classList.add("active");
    pistoletText.textContent = "Pistolet décroché";
  } else {
    pistoletDot.classList.remove("active");
    pistoletText.textContent = "Pistolet raccroché";
  }
}

function updateDelivranceAvailability() {
  if (!btnDelivrance) {
    return;
  }
  const prixOk = !!window.carburantData?.prixDisponible;
  const stockOk = isElectric() ? true : !!window.carburantData?.stockDisponible;
  const selectionOk = isElectric()
    ? chargeSelect && chargeSelect.value
    : carburantSelect && carburantSelect.value;
  btnDelivrance.disabled = !prixOk || !stockOk || !selectionOk || !pistoletDecroche;
}

function updateFinTransactionDisplay() {
  const pretAffichage = transactionTerminee && !pistoletDecroche;

  if (infoTransaction) {
    infoTransaction.style.display = pretAffichage ? "block" : "none";
  }

  if (isAutomate24()) {
    if (choixPaiement) {
      choixPaiement.style.display = "block";
    }
    if (tpeEmbed) {
      tpeEmbed.style.display = "flex";
    }
    if (pretAffichage && transactionFinale && !modePaiement) {
      renderMontantMessage();
    }
    if (montantElem && transactionFinale) {
      montantElem.textContent = formatMontant(transactionFinale.total);
    }
    if (choixMontant && transactionFinale) {
      choixMontant.textContent = formatMontant(transactionFinale.total);
    }
    if (btnPaiement) {
      btnPaiement.style.display = "none";
    }
    toggleActionsPanel(pretAffichage);
    updateChoixScreen();
  } else {
    if (btnPaiement) {
      btnPaiement.style.display = pretAffichage ? "inline-flex" : "none";
    }
    if (choixPaiement) {
      choixPaiement.style.display = "none";
    }
    if (tpeEmbed) {
      tpeEmbed.style.display = "none";
    }
    toggleActionsPanel(false);
  }
}

function updateChoixScreen() {
  if (!choixStatus || !choixActions) {
    return;
  }

  const transactionEnCours = delivranceEnCours || pistoletDecroche;
  const pretPaiement = transactionTerminee && !pistoletDecroche;

  if (!transactionEnCours && !pretPaiement) {
    choixStatus.textContent = "Bonjour";
    choixActions.style.display = "none";
    return;
  }

  if (pretPaiement && !modePaiement) {
    choixStatus.textContent = "Veuillez choisir votre mode de paiement";
    choixActions.style.display = "grid";
    return;
  }

  if (pretPaiement && modePaiement) {
    choixStatus.textContent = "Paiement en cours";
    choixActions.style.display = "none";
    return;
  }

  if (statusText) {
    const headerStatus = statusText.textContent.trim();
    choixStatus.textContent =
      headerStatus && headerStatus !== "En attente"
        ? headerStatus
        : "Transaction en cours";
  } else {
    choixStatus.textContent = "Transaction en cours";
  }
  choixActions.style.display = "none";
}

function getPaiementEndpoint() {
  const path = window.location.pathname || "";
  if (path.includes("index.php")) {
    return "index.php?page=paiement/traiter";
  }
  return "paiement/traiter";
}

function updateCardIndicator() {
  if (!cardIndicator || !cardStatusText) {
    return;
  }
  cardIndicator.classList.toggle("is-on", cardInserted);
  cardStatusText.textContent = cardInserted ? "Carte insérée" : "Carte retirée";
}

function updateTpeMessage(message) {
  if (messageElem) {
    messageElem.textContent = message;
  }
}

function renderMontantMessage() {
  if (!messageElem) {
    return;
  }
  const montantText = formatMontant(transactionFinale ? transactionFinale.total : 0);
  messageElem.innerHTML =
    "Montant à payer : <span id=\"montant\">" + montantText + "</span> €";
  montantElem = messageElem.querySelector("#montant");
}

function insererCarte() {
  cardInserted = true;
  updateCardIndicator();
  if (!paymentActive) {
    return;
  }
  if (codeInput) {
    codeInput.disabled = false;
  }
  updateTpeMessage("Veuillez saisir votre code secret");
}

function retirerCarte() {
  clearPaymentTimers();
  cardInserted = false;
  updateCardIndicator();
  if (codeInput) {
    codeInput.value = "";
    codeInput.disabled = true;
  }
  updateTpeMessage("");
  paymentActive = false;
  tentatives = 3;
}

function ajouterChiffre(chiffre) {
  if (!paymentActive || !codeInput || codeInput.disabled) {
    return;
  }
  if (codeInput.value.length < 4) {
    codeInput.value += chiffre;
  }
}

function retour() {
  if (!codeInput || codeInput.disabled) {
    return;
  }
  codeInput.value = codeInput.value.slice(0, -1);
}

function annuler() {
  if (!paymentActive) {
    return;
  }
  if (cardInserted) {
    clearPaymentTimers();
    if (codeInput) {
      codeInput.value = "";
      codeInput.disabled = true;
    }
    updateTpeMessage("Paiement annulé. Retirez la carte");
    paymentActive = false;
    tentatives = 3;
    return;
  }
  resetPaymentState();
}

function valider() {
  if (!paymentActive) {
    return;
  }
  if (!cardInserted) {
    updateTpeMessage("Insérez votre carte pour continuer");
    return;
  }

  const code = codeInput ? codeInput.value : "";
  const montant = transactionFinale ? transactionFinale.total : 0;
  const endpoint = getPaiementEndpoint();

  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "code=" + encodeURIComponent(code) + "&montant=" + encodeURIComponent(montant),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "erreur_code") {
        tentatives--;

        if (tentatives > 0) {
          updateTpeMessage(
            "Erreur : Code Secret. Il vous reste " + tentatives + " tentatives"
          );
        } else {
          updateTpeMessage("Carte bloquée");
          if (codeInput) {
            codeInput.disabled = true;
          }
        }
      }

      if (data.status === "solde_insuffisant") {
        updateTpeMessage(data.message);
      }

      if (data.status === "ok") {
        updateTpeMessage("Code bon");
        clearPaymentTimers();
        paymentTimer = setTimeout(() => {
          updateTpeMessage("Paiement accepté");
          removeTimer = setTimeout(() => {
            updateTpeMessage("Retirez la carte");
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

function clearPaymentTimers() {
  if (paymentTimer) {
    clearTimeout(paymentTimer);
  }
  if (removeTimer) {
    clearTimeout(removeTimer);
  }
}

function resetPaymentState() {
  clearPaymentTimers();
  cardInserted = false;
  paymentActive = false;
  modePaiement = null;
  tentatives = 3;
  if (codeInput) {
    codeInput.value = "";
    codeInput.disabled = true;
  }
  updateTpeMessage("");
  updateCardIndicator();
  updateChoixScreen();
}

function redirectToCaisse() {
  const target = getTransactionEndpoint("paiement", true);
  if (!transactionFinale) {
    window.location.href = target;
    return;
  }
  const separator = target.includes("?") ? "&" : "?";
  window.location.href =
    target + separator + "montant=" + encodeURIComponent(transactionFinale.total);
}

function toggleActionsPanel(paiementEnCours) {
  if (actionsEssence) {
    actionsEssence.style.display = paiementEnCours ? "none" : "block";
  }
  if (actionsCarte) {
    actionsCarte.style.display = paiementEnCours ? "flex" : "none";
  }
}

function storeLastTransactionDisplay(quantite, total) {
  try {
    const suffix = "_" + energieType;
    localStorage.setItem(LAST_QUANTITE_KEY + suffix, String(quantite));
    localStorage.setItem(LAST_TOTAL_KEY + suffix, String(total));
  } catch (error) {
    console.warn("Impossible d'enregistrer l'historique", error);
  }
}

function restoreLastTransactionDisplay() {
  if (pistoletDecroche || delivranceEnCours) {
    return;
  }
  try {
    const suffix = "_" + energieType;
    const lastQuantite = localStorage.getItem(LAST_QUANTITE_KEY + suffix);
    const lastTotal = localStorage.getItem(LAST_TOTAL_KEY + suffix);
    if (lastQuantite && quantiteValue) {
      quantiteValue.textContent = lastQuantite;
    }
    if (lastTotal && totalValue) {
      totalValue.textContent = lastTotal;
    }
  } catch (error) {
    console.warn("Impossible de restaurer l'historique", error);
  }
}

// ============================================================
// Utilitaires
// ============================================================

/**
 * Formater un nombre en euros
 */
function formatEuros(montant) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);
}

/**
 * Formater une quantité en litres
 */
function formatLitres(quantite) {
  return quantite.toFixed(3) + " L";
}

function getTransactionEndpoint(path, isPage) {
  const current = window.location.pathname || "";
  const base = window.basePath || "";
  const cleaned = path.replace(/^\/+/, "");
  if (current.includes("index.php")) {
    return (base ? base + "/" : "") + "index.php?page=" + cleaned;
  }
  const prefix = base ? base + "/" : "/";
  return isPage ? prefix + cleaned : prefix + cleaned;
}

function isAutomate24() {
  return Number(window.typeAutomate) === 24;
}

function formatMontant(value) {
  const numeric = Number(value) || 0;
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numeric);
}

function isElectric() {
  return energieType === "electricite";
}

function getDebitKwhParSeconde() {
  const typeCharge = (window.electriciteData?.typeCharge || "").toLowerCase();
  if (typeCharge === "rapide") {
    return 0.02;
  }
  if (typeCharge === "lente") {
    return 0.005;
  }
  return 0.01;
}

function formatTemps(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

function formatTempsCharge(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(mins).padStart(2, "0") +
    ":" +
    String(secs).padStart(2, "0")
  );
}

function formatTempsFromString(value) {
  if (!value) {
    return "00:00";
  }
  const parts = String(value).split(":").map((part) => Number(part));
  if (parts.length >= 2) {
    const mins = parts.length === 3 ? parts[1] : parts[0];
    const secs = parts.length === 3 ? parts[2] : parts[1];
    return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  }
  return "00:00";
}
