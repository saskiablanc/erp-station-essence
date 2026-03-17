/** panels/gerant/prix.js — US12 Modification Prix Carburant + US13 Livraison Minimale */
WM.register("gerant_prix", {
  label: "Modification Prix Carburant",
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
    var pending = {}; // { id_carburant: { prix_litre, livraison_min } }

    // ── Popup globale (body) ─────────────────────────────────
    // US12 E41/E42 / US13 E47/E48 : popup confirmation ou erreur
    function showPopup(type, title, msg) {
      var overlay = document.getElementById("pc-global-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "pc-global-overlay";
        overlay.className = "cp-global-overlay"; // réutilise les styles cp- de cce_params.css
        overlay.innerHTML = `
          <div class="cp-popup">
            <div class="cp-popup-icon" id="pc-popup-icon"></div>
            <div class="cp-popup-title" id="pc-popup-title"></div>
            <div class="cp-popup-msg" id="pc-popup-msg"></div>
            <button class="cp-popup-close" id="pc-popup-close">Fermer</button>
          </div>
        `;
        document.body.appendChild(overlay);
        document
          .getElementById("pc-popup-close")
          .addEventListener("click", function () {
            overlay.style.display = "none";
          });
      }
      document.getElementById("pc-popup-icon").className =
        "cp-popup-icon cp-popup-icon--" + type;
      document.getElementById("pc-popup-icon").textContent =
        type === "success" ? "✓" : "✗";
      document.getElementById("pc-popup-title").textContent = title;
      document.getElementById("pc-popup-msg").textContent = msg || "";
      overlay.style.display = "flex";
    }

    // ── Chargement ───────────────────────────────────────────
    // US12 critère 2 / US13 critère 2 : afficher les valeurs actuelles
    async function charger() {
      try {
        var data = await Requetes.getPrix();
        pending = {};
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

    // ── Tracking modifications ────────────────────────────────
    list.addEventListener("input", function (e) {
      var input = e.target.closest("[data-field]");
      if (!input) return;
      var row = input.closest("[data-id]");
      if (!row) return;
      var id = row.dataset.id;
      if (!pending[id]) pending[id] = {};
      pending[id][input.dataset.field] = input.value;
    });

    // ── Modifier valeurs ──────────────────────────────────────
    // US12 critère 3 / US13 critère 3 : sauvegarder toutes les modifications
    btnModifier.addEventListener("click", async function () {
      // Construire le payload complet depuis le DOM
      var rows = list.querySelectorAll("[data-id]");
      var carburants = [];
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

        carburants.push({
          id: parseInt(id),
          prix_litre: parseFloat(prix),
          livraison_min: parseFloat(livr),
        });
      });

      if (!valid) return;
      if (!carburants.length) return;

      btnModifier.disabled = true;
      try {
        // US12+US13 critère 3 : envoi en base
        await Requetes.modifierPrix({ carburants: carburants });
        // US12 E41 / US13 E48 : popup confirmation
        showPopup(
          "success",
          "Valeurs modifiées",
          "Les prix et livraisons minimales ont bien été mis à jour.",
        );
        charger();
      } catch (err) {
        // US12 E42 / US13 E47 : popup erreur
        showPopup(
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
