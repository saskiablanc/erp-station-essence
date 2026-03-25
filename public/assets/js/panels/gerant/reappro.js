/** panels/gerant/reappro.js — US23 Consultation + US22 Annulation */
WM.register("gerant_reappro", {
  label: "Réapprovisionnement",
  icon: "",
  sprint: 4,
  gerantOnly: true,

  buildHTML() {
    return `
      <div class="ra-panel">
        <div class="ra-table-wrap" id="ra-table-wrap">
          <div class="ra-msg">Chargement...</div>
        </div>
      </div>
    `;
  },

  onMount() {
    const wrap = document.getElementById("ra-table-wrap");
    var currentStatut = "";

    async function charger() {
      wrap.innerHTML = '<div class="ra-msg">Chargement...</div>';
      try {
        const statut = currentStatut || undefined;
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
        '<th><div class="ra-th-filter-group"><span>Statut</span><select id="ra-filtre" class="ra-th-filter" aria-label="Filtrer par statut" title="Filtrer par statut">' +
        '<option value=""' +
        (currentStatut === "" ? " selected" : "") +
        ">Tous</option>" +
        '<option value="En cours"' +
        (currentStatut === "En cours" ? " selected" : "") +
        ">En cours</option>" +
        '<option value="En retard"' +
        (currentStatut === "En retard" ? " selected" : "") +
        ">En retard</option>" +
        '<option value="Arrivé"' +
        (currentStatut === "Arrivé" ? " selected" : "") +
        ">Arrivé</option>" +
        '<option value="Annulé"' +
        (currentStatut === "Annulé" ? " selected" : "") +
        ">Annulé</option>" +
        "</select></div></th><th>Création</th><th>Souhaitée</th><th>Arrivée</th><th></th>" +
        "</tr></thead><tbody>";

      rows.forEach(function (row) {
        var r = row.r;
        var l = row.l;
        var modifiable =
          r.statut_reappro === "En cours" || r.statut_reappro === "En retard";
        var statutCls =
          {
            "En cours": "encours",
            "En retard": "retard",
            Arrivé: "arrive",
            Annulé: "annule",
          }[r.statut_reappro] || "";

        // Cellule statut : select si modifiable, badge sinon
        var statutHTML;
        if (modifiable) {
          statutHTML =
            '<select class="ra-statut-select ra-statut-select--' +
            statutCls +
            '"' +
            ' data-id="' +
            r.id_reappro +
            '"' +
            ' data-current="' +
            r.statut_reappro +
            '">' +
            '<option value="' +
            r.statut_reappro +
            '" selected>' +
            r.statut_reappro +
            "</option>" +
            '<option value="Arrivé">Arrivé</option>' +
            "</select>";
        } else {
          statutHTML =
            '<span class="ra-badge ra-badge--' +
            statutCls +
            '">' +
            r.statut_reappro +
            "</span>";
        }

        html +=
          '<tr class="ra-row ra-row--' +
          statutCls +
          '">' +
          '<td class="ra-cell-id">' +
          "#" +
          r.id_reappro +
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
          "<td>" +
          statutHTML +
          "</td>" +
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
          (modifiable
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

    // Changement de statut via le select inline
    wrap.addEventListener("change", async function (e) {
      var sel = e.target.closest(".ra-statut-select");
      if (sel) {
        var id = sel.dataset.id;
        var ancien = sel.dataset.current;
        var nouveau = sel.value;

        if (nouveau === ancien) return;

        var confirm = await Swal.fire({
          title: "Réapprovisionnement #" + id,
          text:
            "Passer le statut de « " + ancien + " » à « " + nouveau + " » ?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Confirmer",
          cancelButtonText: "Annuler",
        });

        if (!confirm.isConfirmed) {
          sel.value = ancien;
          return;
        }

        try {
          await Requetes.updateStatutReappro(id, nouveau);
          Toast.ok("Réapprovisionnement #" + id + " → " + nouveau);
          charger();
        } catch (err) {
          Toast.err(err.message);
          sel.value = ancien;
        }
        return;
      }

      // Filtre par statut (header)
      var filtre = e.target.closest("#ra-filtre");
      if (filtre) {
        currentStatut = filtre.value || "";
        charger();
      }
    });

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

    charger();

    // Permet aux autres panels de déclencher un rechargement
    window.ReapproEvents = window.ReapproEvents || {};
    window.ReapproEvents.refresh = charger;
  },
});
