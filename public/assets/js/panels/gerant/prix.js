/** panels/gerant/prix.js — US12 Modification Prix Carburant + US13 Livraison Minimale */
WM.register("gerant_prix", {
  label: "PMP Modification Prix Carburant",
  icon: "",
  sprint: 6,
  gerantOnly: true,

  // US12 critère 2 / US13 critère 2 : interface avec tableau carburants, prix, livraison min
  buildHTML() {
    return `
      <div class="pc-panel">
        <div class="pc-scroll">

          <div class="pc-thead">
            <span>Carburants</span>
            <span>Prix</span>
            <span>Livraison minimale</span>
          </div>

          <div id="pc-list">
            <div class="pc-msg">Chargement...</div>
          </div>

        </div>

        <!-- US12 critère 2 / US13 critère 2 : bouton Modifier valeurs -->
        <div class="pc-footer">
          <button class="pc-btn-modifier" id="pc-btn-modifier" disabled>Modifier valeurs</button>
        </div>
      </div>
    `;
  },

  onMount() {
    var list = document.getElementById("pc-list");
    var btnModifier = document.getElementById("pc-btn-modifier");
    var originalById = {};

    function approxEqual(a, b, epsilon) {
      return Math.abs(Number(a || 0) - Number(b || 0)) <= (epsilon || 0.0005);
    }

    function showPopup(type, title, msg) {
      return Swal.fire({
        icon: type || "info",
        title: title || "",
        text: msg || "",
        confirmButtonText: "Fermer",
        allowOutsideClick: false,
      });
    }

    // ── Chargement ───────────────────────────────────────────
    // US12 critère 2 / US13 critère 2 : afficher les valeurs actuelles
    async function charger() {
      try {
        var data = await Requetes.getPrix();
        originalById = {};
        data.forEach(function (c) {
          originalById[String(c.id_carburant)] = {
            prix_litre: Number(c.prix_litre),
            livraison_min: Number(c.livraison_min),
          };
        });
        afficher(data);
        btnModifier.disabled = false;
      } catch (e) {
        list.innerHTML =
          '<div class="pc-msg pc-msg--err">Erreur : ' + e.message + "</div>";
      }
    }

    // ── Rendu du tableau ─────────────────────────────────────
    function afficher(carburants) {
      if (!carburants.length) {
        list.innerHTML = '<div class="pc-msg">Aucun carburant</div>';
        return;
      }
      var html = "";
      carburants.forEach(function (c) {
        var prix = parseFloat(c.prix_litre).toFixed(3);
        var livr = parseFloat(c.livraison_min);

        html += `
          <div class="pc-row" data-id="${c.id_carburant}">
            <span class="pc-libelle">${c.libelle}</span>
            <div class="pc-field-group">
              <input type="number" class="pc-input" data-field="prix_litre"
                value="${prix}" step="0.001" min="0.001" />
              <span class="pc-unit">€/L</span>
            </div>
            <div class="pc-field-group pc-center">
              <input type="number" class="pc-input" data-field="livraison_min"
                value="${livr}" step="1" min="0" />
              <span class="pc-unit">L</span>
            </div>
          </div>
        `;
      });
      list.innerHTML = html;
    }

    // ── Modifier valeurs ──────────────────────────────────────
    // US12 critère 3 / US13 critère 3 : sauvegarder toutes les modifications
    btnModifier.addEventListener("click", async function () {
      // Construire le payload complet depuis le DOM
      var rows = list.querySelectorAll("[data-id]");
      var carburants = [];
      var changedPrix = false;
      var changedLivraison = false;
      var valid = true;

      rows.forEach(function (row) {
        if (!valid) return;
        var id = row.dataset.id;
        var prix = row.querySelector('[data-field="prix_litre"]').value.trim();
        var livr = row
          .querySelector('[data-field="livraison_min"]')
          .value.trim();

        // US12 critère 4 : validation prix
        if (prix === "" || isNaN(parseFloat(prix)) || parseFloat(prix) <= 0) {
          showPopup(
            "error",
            "Erreur : Format Price",
            "Veuillez entrer un prix valide (> 0) pour chaque carburant.",
          );
          valid = false;
          return;
        }
        // US13 critère 4 : validation livraison min
        if (livr === "" || isNaN(parseFloat(livr)) || parseFloat(livr) < 0) {
          showPopup(
            "error",
            "Erreur : Format Values",
            "Veuillez entrer une livraison minimale valide (≥ 0) pour chaque carburant.",
          );
          valid = false;
          return;
        }

        var prixValue = parseFloat(prix);
        var livrValue = parseFloat(livr);
        var original = originalById[id] || {
          prix_litre: prixValue,
          livraison_min: livrValue,
        };
        var hasPrixChange = !approxEqual(prixValue, original.prix_litre, 0.0005);
        var hasLivrChange = !approxEqual(livrValue, original.livraison_min, 0.0005);

        if (hasPrixChange || hasLivrChange) {
          carburants.push({
            id: parseInt(id),
            prix_litre: prixValue,
            livraison_min: livrValue,
          });
          changedPrix = changedPrix || hasPrixChange;
          changedLivraison = changedLivraison || hasLivrChange;
        }
      });

      if (!valid) return;
      if (!carburants.length) {
        await showPopup(
          "info",
          "Aucune modification détectée",
          "Aucun prix ni aucune livraison minimale n'ont été modifiés.",
        );
        return;
      }

      btnModifier.disabled = true;
      try {
        // US12+US13 critère 3 : envoi en base
        await Requetes.modifierPrix({ carburants: carburants });
        if (changedPrix && changedLivraison) {
          await showPopup(
            "success",
            "Valeurs modifiées",
            "Les prix carburant et les livraisons minimales ont bien été mis à jour.",
          );
        } else if (changedPrix) {
          await showPopup(
            "success",
            "Prix modifiés",
            "Seuls les prix carburant ont été mis à jour.",
          );
        } else {
          await showPopup(
            "success",
            "Livraisons minimales modifiées",
            "Seules les livraisons minimales ont été mises à jour.",
          );
        }
        await charger();
      } catch (err) {
        // US12 E42 / US13 E47 : popup erreur
        await showPopup(
          "error",
          "Mauvaise Entrée",
          err.message || "Une erreur est survenue.",
        );
        btnModifier.disabled = false;
      }
    });

    charger();
  },
});
