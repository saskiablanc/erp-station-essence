let tentatives = 3;
let montant = 80;

function insererCarte() {
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

function valider() {
  let code = document.getElementById("code").value;

  fetch("/paiement/traiter", {
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
        document.getElementById("message").innerText = "Paiement accepté";
        document.getElementById("code").disabled = true;
      }

      document.getElementById("code").value = "";
    });
}

function annuler() {
  document.getElementById("message").innerText = "Paiement annulé";
  document.getElementById("code").value = "";
  document.getElementById("code").disabled = true;
}
