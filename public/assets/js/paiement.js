let tentatives = 3;
let montant = 80;
let paymentTimer = null;
let removeTimer = null;
let paymentActive = true;
let cardInserted = false;

function insererCarte() {
  cardInserted = true;
  updateCardIndicator();
  if (!paymentActive) {
    return;
  }
  document.getElementById("code").disabled = false;
  document.getElementById("message").innerText =
    "Veuillez saisir votre code secret";
}

function ajouterChiffre(chiffre) {
  let champ = document.getElementById("code");
  if (champ.value.length < 4) {
    champ.value += chiffre;
  }
}

function retour() {
  let champ = document.getElementById("code");
  champ.value = champ.value.slice(0, -1);
}

function valider() {
  if (!paymentActive) {
    return;
  }
  let code = document.getElementById("code").value;

  const endpoint = getPaiementEndpoint();
  fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "code=" + code + "&montant=" + montant,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "erreur_code") {
        tentatives--;

        if (tentatives > 0) {
          document.getElementById("message").innerText =
            "Erreur : Code Secret. Il vous reste " + tentatives + " tentatives";
        } else {
          document.getElementById("message").innerText = "Carte bloquée";
          document.getElementById("code").disabled = true;
        }
      }

      if (data.status === "solde_insuffisant") {
        document.getElementById("message").innerText = data.message;
      }

      if (data.status === "ok") {
        const message = document.getElementById("message");
        message.innerText = "Code bon";
        if (paymentTimer) {
          clearTimeout(paymentTimer);
        }
        if (removeTimer) {
          clearTimeout(removeTimer);
        }
        paymentTimer = setTimeout(() => {
          message.innerText = "Paiement accepté";
          removeTimer = setTimeout(() => {
            message.innerText = "Retirez la carte";
          }, 900);
        }, 800);
        document.getElementById("code").disabled = true;
      }

      document.getElementById("code").value = "";
    });
}

function annuler() {
  if (!paymentActive) {
    return;
  }
  if (cardInserted) {
    clearTimers();
    document.getElementById("code").value = "";
    document.getElementById("code").disabled = true;
    document.getElementById("message").innerText =
      "Paiement annulé. Retirez la carte";
    paymentActive = false;
    tentatives = 3;
    return;
  }

  cancelPayment();
}

function getPaiementEndpoint() {
  const path = window.location.pathname || "";
  if (path.includes("index.php")) {
    return "index.php?page=paiement/traiter";
  }
  return "paiement/traiter";
}

function retirerCarte() {
  clearTimers();
  cardInserted = false;
  updateCardIndicator();
  document.getElementById("message").innerText = "";
  document.getElementById("code").value = "";
  document.getElementById("code").disabled = true;
  paymentActive = false;
  tentatives = 3;
}

function cancelPayment() {
  if (!paymentActive) {
    return;
  }
  clearTimers();
  const message = document.getElementById("message");
  message.innerText = "";
  document.getElementById("code").value = "";
  document.getElementById("code").disabled = true;
  paymentActive = false;
  tentatives = 3;
}

function clearTimers() {
  if (paymentTimer) {
    clearTimeout(paymentTimer);
  }
  if (removeTimer) {
    clearTimeout(removeTimer);
  }
}

function updateCardIndicator() {
  const indicator = document.getElementById("card-indicator");
  if (!indicator) {
    return;
  }
  indicator.classList.toggle("is-on", cardInserted);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCardIndicator();
  const panel = document.getElementById("actions-panel");
  const toggle = document.getElementById("actions-toggle");
  if (!panel || !toggle) {
    return;
  }

  toggle.addEventListener("click", () => {
    const collapsed = panel.classList.toggle("collapsed");
    toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
  });
});
