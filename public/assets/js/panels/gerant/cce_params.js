/** panels/gerant/cce_params.js — US14 Modification Paramètres CCE */
WM.register("gerant_cce_params", {
  label: "Modification Paramètres CCE",
  icon: "",
  sprint: 6,
  gerantOnly: true,

  buildHTML() {
    return `
      <div class="cp-panel">
        <div class="cp-scroll">
          <div class="cp-section-title">Paramètres CCE</div>

          <!-- US14 critère 2 : montant minimum -->
          <div class="cp-row-min">
            <span class="cp-label">Montant Minimum à Mettre sur la Carte</span>
            <div class="cp-field-group">
              <input id="cp-montant-min" type="number" class="cp-input" step="1" min="0" />
              <span class="cp-unit">€</span>
              <button class="cp-btn-save-min" id="cp-btn-save-min" title="Enregistrer">✓</button>
            </div>
          </div>

          <!-- US14 critère 2 : section bonus dynamique -->
          <div class="cp-bonus-header">
            <span class="cp-bonus-title">Bonus</span>
            <button class="cp-btn-ajout" id="cp-btn-ajout">+ Ajouter Bonus</button>
          </div>
    
          <div class="cp-bonus-thead">
            <span>Tranche de Bonus</span>
            <span>Montant du Bonus</span>
            <span></span>
          </div>

          <div id="cp-bonus-list"></div>
        </div>

        <!-- US14 critère 2 : bouton modifier valeurs (fixe en bas) -->
        <div class="cp-footer">
          <button class="cp-btn-modifier" id="cp-btn-modifier" disabled>Modifier valeurs</button>
        </div>
      </div>
    `;
  },

  onMount() {
    var inputMin = document.getElementById("cp-montant-min");
    var btnSaveMin = document.getElementById("cp-btn-save-min");
    var btnAjout = document.getElementById("cp-btn-ajout");
    var bonusList = document.getElementById("cp-bonus-list");
    var btnModifier = document.getElementById("cp-btn-modifier");

    var bonusData = [];
    var newRows = [];
    var pendingBonus = {};
    var newRowCount = 0;

    // ── Popup globale (sur body = centre de la caisse entière) ──
    // US14 E50 (erreur) / E51 (confirmation)
    function showPopup(type, title, msg) {
      // Réutiliser un overlay existant ou en créer un
      var overlay = document.getElementById("cp-global-overlay");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "cp-global-overlay";
        overlay.className = "cp-global-overlay";
        overlay.innerHTML = `
          <div class="cp-popup">
            <div class="cp-popup-icon" id="cp-popup-icon"></div>
            <div class="cp-popup-title" id="cp-popup-title"></div>
            <div class="cp-popup-msg" id="cp-popup-msg"></div>
            <button class="cp-popup-close" id="cp-popup-close">Fermer</button>
          </div>
        `;
        document.body.appendChild(overlay);
        document
          .getElementById("cp-popup-close")
          .addEventListener("click", function () {
            overlay.style.display = "none";
          });
      }

      document.getElementById("cp-popup-icon").className =
        "cp-popup-icon cp-popup-icon--" + type;
      document.getElementById("cp-popup-icon").textContent =
        type === "success" ? "✓" : "✗";
      document.getElementById("cp-popup-title").textContent = title;
      document.getElementById("cp-popup-msg").textContent = msg || "";
      overlay.style.display = "flex";
    }

    // ── Chargement ───────────────────────────────────────────
    // US14 critère 2 : afficher les valeurs actuelles au mount
    async function charger() {
      try {
        var data = await Requetes.getCceParams();
        inputMin.value = parseFloat(data.montant_min);
        bonusData = data.bonus || [];
        newRows = [];
        pendingBonus = {};
        afficher();
        btnModifier.disabled = false;
      } catch (e) {
        showPopup("error", "Erreur de chargement", e.message);
      }
    }

    // ── Rendu tableau bonus ───────────────────────────────────
    function afficher() {
      var html = "";
      bonusData.forEach(function (b) {
        html += ligneBonus(
          "exist-" + b.id_bonus,
          parseFloat(b.tranche),
          parseFloat(b.montant_bonus),
          false,
        );
      });
      newRows.forEach(function (r) {
        html += ligneBonus("new-" + r.tmpId, r.tranche, r.montant_bonus, true);
      });
      bonusList.innerHTML =
        html || '<div class="cp-msg">Aucune tranche définie</div>';
    }

    function ligneBonus(rowId, tranche, montantBonus, isNew) {
      return `
        <div class="cp-bonus-row" data-row-id="${rowId}" data-is-new="${isNew ? "1" : "0"}">
          <div class="cp-field-group cp-center">
            <input type="number" class="cp-input" data-field="tranche"
              value="${tranche !== "" ? tranche : ""}" step="1" min="1" placeholder="ex : 100" />
            <span class="cp-unit">€</span>
          </div>
          <div class="cp-field-group cp-center">
            <input type="number" class="cp-input" data-field="montant_bonus"
              value="${montantBonus !== "" ? montantBonus : ""}" step="1" min="0" placeholder="ex : 10" />
            <span class="cp-unit">€</span>
          </div>
          <button class="cp-btn-suppr" data-row-id="${rowId}" title="Supprimer">✕</button>
        </div>
      `;
    }

    // ── Tracking modifs lignes existantes ─────────────────────
    bonusList.addEventListener("input", function (e) {
      var input = e.target.closest("[data-field]");
      if (!input) return;
      var row = input.closest("[data-row-id]");
      if (!row || row.dataset.isNew === "1") return;
      var id = row.dataset.rowId.replace("exist-", "");
      if (!pendingBonus[id]) pendingBonus[id] = {};
      pendingBonus[id][input.dataset.field] = input.value;
    });

    // ── Suppression ───────────────────────────────────────────
    bonusList.addEventListener("click", async function (e) {
      var btn = e.target.closest(".cp-btn-suppr");
      if (!btn) return;
      var rowId = btn.dataset.rowId;

      if (rowId.startsWith("new-")) {
        var tmpId = parseInt(rowId.replace("new-", ""));
        newRows = newRows.filter(function (r) {
          return r.tmpId !== tmpId;
        });
        afficher();
        return;
      }

      var id = rowId.replace("exist-", "");
      try {
        await Requetes.deleteBonus(id);
        showPopup(
          "success",
          "Tranche supprimée",
          "La tranche de bonus a bien été supprimée.",
        );
        charger();
      } catch (err) {
        showPopup("error", "Erreur", err.message);
      }
    });

    // ── Ajout bonus LOCAL ─────────────────────────────────────
    btnAjout.addEventListener("click", function () {
      newRowCount++;
      newRows.push({ tmpId: newRowCount, tranche: "", montant_bonus: "" });
      afficher();
      btnModifier.disabled = false;
    });

    // ── Sauvegarde montant min (✓) ────────────────────────────
    btnSaveMin.addEventListener("click", async function () {
      var val = inputMin.value.trim();
      // US14 critère 4/5
      if (val === "" || isNaN(parseFloat(val)) || parseFloat(val) < 0) {
        showPopup(
          "error",
          "Mauvaise Entrée",
          "erreur input de montant Min : veuillez entrer une valeur numérique",
        );
        return;
      }
      try {
        await Requetes.updateMontantMin(parseFloat(val));
        // US14 E51
        showPopup(
          "success",
          "Valeurs modifiées",
          "Le montant minimum a bien été mis à jour.",
        );
      } catch (e) {
        // US14 critère 6
        showPopup("error", "Erreur : Format Minimum Montant", e.message);
      }
    });

    // ── Modifier valeurs ──────────────────────────────────────
    // US14 critère 3 : sauvegarde de toutes les modifications
    btnModifier.addEventListener("click", async function () {
      var existIds = Object.keys(pendingBonus);
      var newRowsData = [];
      var valid = true;

      // Valider nouvelles lignes depuis le DOM
      var rows = bonusList.querySelectorAll('[data-is-new="1"]');
      rows.forEach(function (row) {
        if (!valid) return;
        var t = row.querySelector('[data-field="tranche"]').value.trim();
        var b = row.querySelector('[data-field="montant_bonus"]').value.trim();
        // US14 critère 4/5
        if (t === "" || isNaN(parseFloat(t)) || parseFloat(t) <= 0) {
          showPopup(
            "error",
            "Mauvaise Entrée",
            "erreur input de Bonus : veuillez entrer une valeur numérique pour la tranche.",
          );
          valid = false;
          return;
        }
        if (b === "" || isNaN(parseFloat(b)) || parseFloat(b) < 0) {
          showPopup(
            "error",
            "Mauvaise Entrée",
            "erreur input de Bonus : veuillez entrer une valeur numérique pour le montant.",
          );
          valid = false;
          return;
        }
        newRowsData.push({
          tranche: parseFloat(t),
          montant_bonus: parseFloat(b),
        });
      });

      if (!valid) return;

      // Valider lignes existantes modifiées
      for (var i = 0; i < existIds.length; i++) {
        var id = existIds[i];
        var pb = pendingBonus[id];
        var row = bonusList.querySelector('[data-row-id="exist-' + id + '"]');
        var t =
          pb.tranche !== undefined
            ? pb.tranche
            : row.querySelector('[data-field="tranche"]').value;
        var b =
          pb.montant_bonus !== undefined
            ? pb.montant_bonus
            : row.querySelector('[data-field="montant_bonus"]').value;
        if (isNaN(parseFloat(t)) || parseFloat(t) <= 0) {
          // US14 critère 6
          showPopup(
            "error",
            "Erreur : Format Bonus",
            "erreur input de Bonus : veuillez entrer une valeur numérique.",
          );
          return;
        }
        pendingBonus[id].tranche = parseFloat(t);
        pendingBonus[id].montant_bonus = parseFloat(b);
      }

      if (existIds.length === 0 && newRowsData.length === 0) {
        showPopup(
          "error",
          "Aucune modification",
          "Modifiez au moins une valeur avant de confirmer.",
        );
        return;
      }

      btnModifier.disabled = true;
      try {
        for (var j = 0; j < existIds.length; j++) {
          var pb2 = pendingBonus[existIds[j]];
          await Requetes.updateBonus(
            existIds[j],
            pb2.tranche,
            pb2.montant_bonus,
          );
        }
        for (var k = 0; k < newRowsData.length; k++) {
          await Requetes.addBonus(
            newRowsData[k].tranche,
            newRowsData[k].montant_bonus,
          );
        }
        // US14 E51
        showPopup(
          "success",
          "Valeurs modifiées",
          "Les paramètres CCE ont bien été enregistrés.",
        );
        charger();
      } catch (err) {
        // US14 E50
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
