/** panels/gerant/reappro_defauts.js — US20 Valeurs défauts réapprovisionnement */
WM.register("gerant_reappro_defauts", {
  label: "Valeurs Défauts Réapprovisionnement",
  icon: "",
  sprint: 4,
  gerantOnly: true,

  buildHTML() {
    return `
      <div class="vd-panel">
        <div class="vd-content" id="vd-content">
          <div class="ra-msg">Chargement...</div>
        </div>
        <div class="vd-footer">
          <button class="vd-btn-confirm" id="vd-confirm" disabled>Confirmer nouvelles valeurs</button>
        </div>
      </div>
    `;
  },

  onMount() {
    var content = document.getElementById("vd-content");
    var btnConfirm = document.getElementById("vd-confirm");
    var allData = [];
    var modified = {};

    function formatTypeLabel(type) {
      var value = String(type || "").trim();
      if (!value) return "Non défini";
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    function getVolumeUnit(type) {
      var value = String(type || "").toLowerCase();
      if (value === "carburant" || value === "energie") return "L";
      if (value === "electricite") return "kWh";
      return "qte";
    }

    async function charger() {
      content.innerHTML = '<div class="ra-msg">Chargement...</div>';
      try {
        allData = await Requetes.getValeursDefaut();
        modified = {};
        btnConfirm.disabled = true;
        afficher();
      } catch (e) {
        content.innerHTML =
          '<div class="ra-msg ra-msg--err">Erreur : ' + e.message + "</div>";
      }
    }

    function afficher() {
      if (!allData.length) {
        content.innerHTML = '<div class="ra-msg">Aucune donnée</div>';
        return;
      }

      // US20 critère 2 : grouper par type_article avec accordéons
      var grouped = {};
      allData.forEach(function (d) {
        if (!grouped[d.type_article]) grouped[d.type_article] = [];
        grouped[d.type_article].push(d);
      });

      var html =
        '<table class="vd-table"><thead><tr>' +
        "<th>Type</th><th>Seuil d'alerte</th><th>Volume</th><th>Fréquence</th>" +
        "</tr></thead><tbody>";

      Object.keys(grouped).forEach(function (type) {
        var volumeUnit = getVolumeUnit(type);

        // Ligne titre du type avec accordéon
        html +=
          '<tr class="vd-type-row" data-toggle-type="' +
          type +
          '">' +
          '<td colspan="3"><strong>' +
          formatTypeLabel(type) +
          "</strong></td>" +
          '<td class="vd-toggle">▼</td>' +
          "</tr>";

        // Lignes articles de ce type
        grouped[type].forEach(function (d) {
          var unite =
            d.frequence_unite === "jour"
              ? "/jour"
              : d.frequence_unite === "semaine"
                ? "/semaine"
                : "/mois";
          html +=
            '<tr class="vd-article-row" data-type-group="' +
            type +
            '" data-id-article="' +
            d.id_article +
            '">' +
            '<td class="vd-nom">' +
            (d.nom_article || "#" + d.id_article) +
            "</td>" +
            '<td><div class="vd-field-wrap vd-field-wrap--alert"><span class="vd-prefix">&lt;</span><input type="number" class="vd-input vd-input--metric" data-field="seuil_alerte" value="' +
            d.seuil_alerte +
            '" step="0.1" min="0"></div></td>' +
            '<td><div class="vd-field-wrap"><input type="number" class="vd-input vd-input--metric" data-field="volume" value="' +
            d.volume +
            '" step="0.1" min="0"><span class="vd-suffix">' +
            volumeUnit +
            "</span></div></td>" +
            '<td class="vd-freq-cell">' +
            '<input type="number" class="vd-input vd-input--sm" data-field="frequence_valeur" value="' +
            d.frequence_valeur +
            '" min="1">' +
            '<select class="vd-sel" data-field="frequence_unite">' +
            '<option value="jour"' +
            (d.frequence_unite === "jour" ? " selected" : "") +
            ">/jour</option>" +
            '<option value="semaine"' +
            (d.frequence_unite === "semaine" ? " selected" : "") +
            ">/semaine</option>" +
            '<option value="mois"' +
            (d.frequence_unite === "mois" ? " selected" : "") +
            ">/mois</option>" +
            "</select>" +
            "</td>" +
            "</tr>";
        });
      });

      html += "</tbody></table>";
      content.innerHTML = html;
    }

    // Accordéon : toggle visibilité des lignes articles
    content.addEventListener("click", function (e) {
      var typeRow = e.target.closest("[data-toggle-type]");
      if (!typeRow) return;
      var type = typeRow.dataset.toggleType;
      var rows = content.querySelectorAll('[data-type-group="' + type + '"]');
      var toggle = typeRow.querySelector(".vd-toggle");
      var hidden = rows[0] && rows[0].classList.contains("vd-hidden");
      rows.forEach(function (r) {
        r.classList.toggle("vd-hidden", !hidden);
      });
      if (toggle) toggle.textContent = hidden ? "▼" : "▶";
    });

    // Tracker les modifications
    content.addEventListener("input", function (e) {
      var input = e.target.closest("[data-field]");
      if (!input) return;
      var row = input.closest("[data-id-article]");
      if (!row) return;
      var idArticle = row.dataset.idArticle;
      if (!modified[idArticle]) modified[idArticle] = {};
      var field = input.dataset.field;
      modified[idArticle][field] =
        input.type === "number" ? parseFloat(input.value) : input.value;
      btnConfirm.disabled = false;
    });
    content.addEventListener("change", function (e) {
      var sel = e.target.closest("[data-field]");
      if (!sel) return;
      var row = sel.closest("[data-id-article]");
      if (!row) return;
      var idArticle = row.dataset.idArticle;
      if (!modified[idArticle]) modified[idArticle] = {};
      modified[idArticle][sel.dataset.field] = sel.value;
      btnConfirm.disabled = false;
    });

    // US20 critère 3-4 : sauvegarder toutes les modifications + confirmation
    btnConfirm.addEventListener("click", async function () {
      var ids = Object.keys(modified);
      if (ids.length === 0) return;

      try {
        for (var i = 0; i < ids.length; i++) {
          await Requetes.updateValeurDefaut(ids[i], modified[ids[i]]);
        }
        // US20 critère 4 : message de confirmation
        Toast.ok(
          "Valeurs enregistrées (" +
            ids.length +
            " article" +
            (ids.length > 1 ? "s" : "") +
            ")",
        );
        // US20 critère 5 : recharger
        charger();
      } catch (err) {
        Toast.err(err.message);
      }
    });

    charger();
  },
});
