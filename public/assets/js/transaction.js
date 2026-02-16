/**
 * transaction.js - US28 : Consultation des informations de transaction
 * Gère la simulation de délivrance en temps réel et l'affichage dynamique
 */

// ============================================================
// Variables globales
// ============================================================
let delivranceEnCours = false;
let intervalDelivrance = null;
let quantiteActuelle = 0.0;
let debitLitresParSeconde = 0.5; // 30L/min = 0.5L/s
const prixLitre = window.carburantData?.prixLitre || 0;

// ============================================================
// Éléments DOM
// ============================================================
const btnDemarrer = document.getElementById("btn-demarrer");
const btnArreter = document.getElementById("btn-arreter");
const btnPaiement = document.getElementById("btn-paiement");
const statusText = document.getElementById("status-text");
const quantiteValue = document.getElementById("quantite-value");
const totalValue = document.getElementById("total-value");
const infoTransaction = document.getElementById("info-transaction");
const stockRestant = document.getElementById("stock-restant");

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
  if (btnDemarrer) {
    btnDemarrer.addEventListener("click", demarrerDelivrance);
  }

  if (btnArreter) {
    btnArreter.addEventListener("click", arreterDelivrance);
  }

  if (btnPaiement) {
    btnPaiement.addEventListener("click", procederPaiement);
  }

  // Actions physiques
  setupActionsPhysiques();
});

// ============================================================
// US28 - Critères 2, 3 : Démarrer la délivrance
// ============================================================
async function demarrerDelivrance() {
  console.log("Démarrage de la délivrance...");

  // Appel API pour créer la transaction
  try {
    const response = await fetch("/transaction/demarrer", {
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

    // Mettre à jour l'UI
    btnDemarrer.style.display = "none";
    btnArreter.style.display = "inline-flex";
    statusText.textContent = "Délivrance en cours";
    statusText.classList.add("active");

    // Démarrer l'intervalle de mise à jour (US28 - critère 2)
    intervalDelivrance = setInterval(updateDelivrance, 100); // Mise à jour toutes les 100ms
  } catch (error) {
    console.error("Erreur démarrage:", error);
    alert("Erreur lors du démarrage de la délivrance");
  }
}

// ============================================================
// US28 - Critère 2 : Mise à jour continue de la quantité
// ============================================================
function updateDelivrance() {
  if (!delivranceEnCours) return;

  // Augmenter la quantité (0.5L/s = 0.05L par 100ms)
  quantiteActuelle += debitLitresParSeconde * 0.1;

  // Vérifier qu'on ne dépasse pas le stock
  const stockMax = window.carburantData.stockLitre;
  if (quantiteActuelle >= stockMax) {
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

  // US28 - Critère 3 : Calcul automatique du total
  const total = quantiteActuelle * prixLitre;

  // Mettre à jour l'affichage avec animation
  updateAffichage(quantiteActuelle, total);

  // Envoyer la mise à jour au serveur toutes les secondes
  if (Math.floor(quantiteActuelle * 10) % 10 === 0) {
    envoyerMiseAJour(quantiteActuelle);
  }
}

// ============================================================
// US28 - Critère 2 : Mettre à jour l'affichage avec animation
// ============================================================
function updateAffichage(quantite, total) {
  // Animation de mise à jour
  quantiteValue.textContent = quantite.toFixed(3);
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
async function envoyerMiseAJour(quantite) {
  try {
    const formData = new FormData();
    formData.append("quantite", quantite.toFixed(3));

    await fetch("/transaction/maj-delivrance", {
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

  // Arrêter l'intervalle
  if (intervalDelivrance) {
    clearInterval(intervalDelivrance);
    intervalDelivrance = null;
  }

  delivranceEnCours = false;

  // Appel API pour terminer la transaction
  try {
    const response = await fetch("/transaction/terminer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.status === "ok") {
      console.log("Transaction terminée:", data);

      // US28 - Critère 4 : Figer les valeurs
      quantiteValue.textContent = data.quantite_finale.toFixed(3);
      totalValue.textContent = data.total_final.toFixed(2);

      // Mettre à jour l'UI
      btnArreter.style.display = "none";
      btnPaiement.style.display = "inline-flex";
      statusText.textContent = "Délivrance terminée";
      statusText.classList.remove("active");

      // US28 - Critère 7 : Afficher les infos de transaction
      afficherInfosTransaction(data);

      // Mettre à jour le stock restant
      const stockRestantValue =
        window.carburantData.stockLitre - data.quantite_finale;
      if (stockRestant) {
        stockRestant.textContent = stockRestantValue.toFixed(3) + " L";
      }
    }
  } catch (error) {
    console.error("Erreur arrêt:", error);
    alert("Erreur lors de l'arrêt de la délivrance");
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

  // Afficher le panneau d'infos
  if (infoTransaction) {
    infoTransaction.style.display = "block";
  }
}

// ============================================================
// Procéder au paiement
// ============================================================
function procederPaiement() {
  console.log("Redirection vers le paiement...");
  // Rediriger vers l'écran de choix de paiement ou TPE
  window.location.href = "/choix-paiement";
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

function simulerPompe() {
  console.log("Simulation : Pistolet décroché");
  alert("🔧 Pistolet décroché - Vous pouvez démarrer la délivrance");
}

function simulerRaccrochage() {
  console.log("Simulation : Pistolet raccroché");
  if (delivranceEnCours) {
    arreterDelivrance();
  }
  alert("🔧 Pistolet raccroché");
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
    window.location.href = "/";
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
