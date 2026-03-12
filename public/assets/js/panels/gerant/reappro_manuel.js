/** panels/gerant/reappro_manuel.js — US21 Lancer réapprovisionnement manuel */
WM.register("gerant_reappro_manuel", {
  label: "Lancer Réapprovisionnement Manuel",
  icon: "",
  sprint: 4,
  gerantOnly: true,

  buildHTML() {
    return `
      <div class="rm-panel">
        <div class="rm-form" id="rm-form">
          <div class="rm-row">
            <label class="rm-label">N° Ordre</label>
            <input type="text" class="rm-input" id="rm-num" value="AUTO" disabled>
          </div>
          <div class="rm-row">
            <label class="rm-label">Nom Article</label>
            <select id="rm-article" class="rm-input rm-input--select">
              <option value="">Chargement...</option>
            </select>
          </div>
          <div class="rm-row">
            <label class="rm-label">Quantité</label>
            <input type="number" class="rm-input" id="rm-qty" min="1" value="1">
          </div>
          <div class="rm-row">
            <label class="rm-label">Statut</label>
            <input type="text" class="rm-input" value="En cours" disabled>
          </div>
          <div class="rm-row">
            <label class="rm-label">Date de Création</label>
            <input type="text" class="rm-input" id="rm-date-creation" disabled>
          </div>
          <div class="rm-row">
            <label class="rm-label">Date souhaitée</label>
            <input type="date" class="rm-input" id="rm-date-souhaitee">
          </div>
          <div class="rm-row">
            <label class="rm-label">Date d'arrivée</label>
            <input type="text" class="rm-input" value="—" disabled>
          </div>
          <div class="rm-actions">
            <button class="rm-btn rm-btn--cancel" id="rm-cancel">Annuler</button>
            <button class="rm-btn rm-btn--send" id="rm-send">Envoyer</button>
          </div>
        </div>
      </div>
    `;
  },

  onMount() {
    var selectArticle = document.getElementById("rm-article");
    var inputQty = document.getElementById("rm-qty");
    var inputDateSouhaitee = document.getElementById("rm-date-souhaitee");
    var inputDateCreation = document.getElementById("rm-date-creation");
    var btnSend = document.getElementById("rm-send");
    var btnCancel = document.getElementById("rm-cancel");

    // Date de création = aujourd'hui
    var today = new Date().toISOString().split("T")[0];
    inputDateCreation.value = today;

    // Date souhaitée par défaut : demain
    var demain = new Date();
    demain.setDate(demain.getDate() + 1);
    inputDateSouhaitee.value = demain.toISOString().split("T")[0];

    // Charger les articles
    async function chargerArticles() {
      try {
        var articles = await Requetes.getArticlesReappro();
        selectArticle.innerHTML =
          '<option value="">— Choisir un article —</option>' +
          articles
            .map(function (a) {
              return (
                '<option value="' +
                a.id_article +
                '">' +
                a.nom_article +
                " (" +
                a.type_article +
                ")</option>"
              );
            })
            .join("");
      } catch (e) {
        selectArticle.innerHTML = '<option value="">Erreur chargement</option>';
      }
    }

    function resetForm() {
      selectArticle.value = "";
      inputQty.value = "1";
      inputDateSouhaitee.value = demain.toISOString().split("T")[0];
    }

    // US21 critère 2 : lancer le réapprovisionnement
    btnSend.addEventListener("click", async function () {
      var idArticle = parseInt(selectArticle.value);
      var qty = parseInt(inputQty.value);
      var dateSouhaitee = inputDateSouhaitee.value || null;

      if (!idArticle) {
        Toast.warn("Sélectionne un article");
        return;
      }
      if (!qty || qty <= 0) {
        Toast.warn("Quantité invalide");
        return;
      }

      // US21 critère 3 : formulaire articles + quantités
      try {
        var res = await Requetes.creerReappro({
          date_souhaitee: dateSouhaitee,
          lignes: [{ id_article: idArticle, quantite: qty }],
        });

        // US21 critère 4 : confirmation avec numéro d'ordre, statut, date/heure
        await Swal.fire({
          icon: "success",
          title: "Réapprovisionnement créé",
          html:
            '<div style="text-align:left;font-size:13px;">' +
            "<b>N° Ordre :</b> #" +
            res.id_reappro +
            "<br>" +
            "<b>Statut :</b> En cours<br>" +
            "<b>Date :</b> " +
            (res.reappro ? res.reappro.date_reappro : today) +
            "</div>",
        });

        resetForm();
      } catch (err) {
        Toast.err(err.message);
      }
    });

    btnCancel.addEventListener("click", resetForm);

    chargerArticles();
  },
});
