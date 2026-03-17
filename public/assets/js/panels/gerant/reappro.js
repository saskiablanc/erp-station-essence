/** panels/gerant/reappro.js — US23 Consultation + US22 Annulation */
WM.register("gerant_reappro", {
  label: "Réapprovisionnement",
  icon: "",
  sprint: 4,
  gerantOnly: true,

  buildHTML() {
    return `
      <div class="ra-panel">
        <div class="ra-toolbar">
          <select id="ra-filtre" class="ra-select">
            <option value="">Tous les statuts</option>
            <option value="En cours">En cours</option>
            <option value="En retard">En retard</option>
            <option value="Arrivé">Arrivé</option>
            <option value="Annulé">Annulé</option>
          </select>
        </div>
        <div class="ra-table-wrap" id="ra-table-wrap">
          <div class="ra-msg">Chargement...</div>
        </div>
      </div>
    `;
  },

  onMount() {
    const filtre = document.getElementById("ra-filtre");
    const wrap = document.getElementById("ra-table-wrap");

    async function charger() {
      wrap.innerHTML = '<div class="ra-msg">Chargement...</div>';
      try {
        const statut = filtre.value || undefined;
        const data = await Requetes.getReappros(statut);
        render(data);
      } catch (e) {
        wrap.innerHTML =
          '<div class="ra-msg ra-msg--err">Erreur : ' + e.message + "</div>";
      }
    }

    function render(reappros) {
      // US23 critère 2 : tableau listant tous les réappros
      var rows = [];
      reappros.forEach(function (r) {
        if (!r.lignes || r.lignes.length === 0) {
          rows.push({ r: r, l: null });
        } else {
          r.lignes.forEach(function (l) {
            rows.push({ r: r, l: l });
          });
        }
      });

      if (rows.length === 0) {
        wrap.innerHTML = '<div class="ra-msg">Aucun réapprovisionnement</div>';
        return;
      }

      var html =
        '<table class="ra-table"><thead><tr>' +
        "<th>N° Ordre</th><th>Nom</th><th>Code-barres</th><th>Quantité</th>" +
        "<th>Statut</th><th>Création</th><th>Souhaitée</th><th>Arrivée</th><th></th>" +
        "</tr></thead><tbody>";

      rows.forEach(function (row) {
        var r = row.r;
        var l = row.l;
        var annulable =
          r.statut_reappro === "En cours" || r.statut_reappro === "En retard";
        var statutCls =
          {
            "En cours": "encours",
            "En retard": "retard",
            Arrivé: "arrive",
            Annulé: "annule",
          }[r.statut_reappro] || "";

        html +=
          '<tr class="ra-row ra-row--' +
          statutCls +
          '">' +
          '<td class="ra-cell-id">' +
          "#" + r.id_reappro +
          "</td>" +
          "<td>" +
          (l ? l.nom_article || "—" : "—") +
          "</td>" +
          '<td class="ra-cell-code">' +
          (l && l.code_barres ? l.code_barres : "") +
          "</td>" +
          '<td class="ra-cell-qty">' +
          (l ? l.quantite : "") +
          "</td>" +
          '<td><span class="ra-badge ra-badge--' +
          statutCls +
          '">' +
          r.statut_reappro +
          "</span></td>" +
          '<td class="ra-cell-date">' +
          r.date_reappro +
          "</td>" +
          '<td class="ra-cell-date">' +
          (r.date_souhaitee || "—") +
          "</td>" +
          '<td class="ra-cell-date">' +
          (l && l.date_arrivee ? l.date_arrivee : "—") +
          "</td>" +
          "<td>" +
          (annulable
            ? '<button class="ra-del" data-annuler="' +
              r.id_reappro +
              '" title="Annuler">✕</button>'
            : "") +
          "</td>" +
          "</tr>";
      });

      html += "</tbody></table>";
      wrap.innerHTML = html;
    }

    // US22 : clic sur croix rouge pour annuler
    wrap.addEventListener("click", async function (e) {
      var btn = e.target.closest("[data-annuler]");
      if (!btn) return;
      var id = btn.dataset.annuler;

      // US22 critère 3 : confirmation
      var confirm = await Swal.fire({
        title: "Annuler le réapprovisionnement #" + id + " ?",
        text: "Le statut passera à Annulé. Cette action est irréversible.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Confirmer l'annulation",
        cancelButtonText: "Retour",
      });
      if (!confirm.isConfirmed) return;

      try {
        await Requetes.annulerReappro(id);
        Toast.ok("Réapprovisionnement #" + id + " annulé");
        charger();
      } catch (err) {
        Toast.err(err.message);
      }
    });

    filtre.addEventListener("change", charger);
    charger();
  },
});
