/** panels/gerant/reappro_manuel.js — US21 Lancer réapprovisionnement manuel */
WM.register("gerant_reappro_manuel", {
  label: "RMA Lancer Réapprovisionnement Manuel",
  icon: "",
  sprint: 4,
  gerantOnly: true,

  buildHTML() {
    return `
      <div class="rm-panel">

        <!-- En-tête : N° ordre + date souhaitée -->
        <div class="rm-header">
          <div class="rm-header-row">
            <span class="rm-header-label">N° Ordre</span>
            <span class="rm-header-val" id="rm-num">…</span>
          </div>
          <div class="rm-header-row">
            <span class="rm-header-label">Date souhaitée</span>
            <input type="date" class="rm-date-input" id="rm-date-souhaitee">
          </div>
        </div>

        <!-- Formulaire ajout ligne -->
        <div class="rm-add-row">
          <select id="rm-article" class="rm-sel">
            <option value="">Chargement…</option>
          </select>
          <input type="number" id="rm-qty" class="rm-qty-input" min="1" value="1" placeholder="Qté">
          <button class="rm-btn-add" id="rm-add">+ Ajouter</button>
        </div>

        <!-- Panier de lignes -->
        <div class="rm-lines-wrap">
          <table class="rm-lines-table" id="rm-lines-table">
            <thead>
              <tr>
                <th>Article</th>
                <th class="rm-th-qty">Qté</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="rm-lines-body">
              <tr id="rm-empty-row">
                <td colspan="3" class="rm-empty">Aucun article ajouté</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Actions -->
        <div class="rm-footer">
          <button class="rm-btn rm-btn--cancel" id="rm-cancel">Réinitialiser</button>
          <button class="rm-btn rm-btn--send" id="rm-send" disabled>Envoyer la commande</button>
        </div>

      </div>
    `;
  },

  onMount() {
    var selectArticle = document.getElementById("rm-article");
    var inputQty = document.getElementById("rm-qty");
    var inputDate = document.getElementById("rm-date-souhaitee");
    var spanNum = document.getElementById("rm-num");
    var btnAdd = document.getElementById("rm-add");
    var btnSend = document.getElementById("rm-send");
    var btnCancel = document.getElementById("rm-cancel");
    var tbody = document.getElementById("rm-lines-body");
    var emptyRow = document.getElementById("rm-empty-row");

    // Panier local : [{id_article, nom_article, quantite}]
    var lignes = [];
    var articlesMap = {}; // id_article -> nom_article

    // Date souhaitée par défaut : demain
    var demain = new Date();
    demain.setDate(demain.getDate() + 1);
    inputDate.value = demain.toISOString().split("T")[0];

    // ── Numéro d'ordre estimé ────────────────────────────────
    async function chargerProchainNumero() {
      try {
        var reappros = await Requetes.getReappros();
        var maxId = 0;
        reappros.forEach(function (r) {
          maxId = Math.max(maxId, parseInt(r.id_reappro, 10) || 0);
        });
        spanNum.textContent = "#" + (maxId + 1);
      } catch (_) {
        spanNum.textContent = "AUTO";
      }
    }

    // ── Chargement articles ──────────────────────────────────
    async function chargerArticles() {
      try {
        var articles = await Requetes.getArticlesReappro();
        articlesMap = {};
        articles.forEach(function (a) {
          articlesMap[a.id_article] = a.nom_article;
        });
        selectArticle.innerHTML =
          '<option value="">— Choisir un article —</option>' +
          articles
            .map(function (a) {
              var type = String(a.type_article || "").replace(
                /^./,
                function (c) {
                  return c.toUpperCase();
                },
              );
              return (
                '<option value="' +
                a.id_article +
                '">' +
                a.nom_article +
                " (" +
                type +
                ")</option>"
              );
            })
            .join("");
      } catch (e) {
        selectArticle.innerHTML = '<option value="">Erreur chargement</option>';
      }
    }

    // ── Rendu du tableau de lignes ───────────────────────────
    function renderLignes() {
      // Supprimer toutes les lignes sauf emptyRow (on le retire puis remet)
      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);

      if (lignes.length === 0) {
        tbody.appendChild(emptyRow);
        btnSend.disabled = true;
        return;
      }

      btnSend.disabled = false;
      lignes.forEach(function (ligne, idx) {
        var tr = document.createElement("tr");
        tr.className = "rm-line-row";
        tr.innerHTML =
          '<td class="rm-line-nom">' +
          ligne.nom_article +
          "</td>" +
          '<td class="rm-line-qty">' +
          '<input type="number" class="rm-qty-inline" min="1" value="' +
          ligne.quantite +
          '" data-idx="' +
          idx +
          '">' +
          "</td>" +
          '<td class="rm-line-del"><button class="rm-del" data-idx="' +
          idx +
          '">✕</button></td>';
        tbody.appendChild(tr);
      });

      // Listeners dynamiques sur les inputs et boutons de suppression
      tbody.querySelectorAll(".rm-qty-inline").forEach(function (inp) {
        inp.addEventListener("change", function () {
          var i = parseInt(this.getAttribute("data-idx"), 10);
          var v = parseInt(this.value, 10);
          if (v > 0) lignes[i].quantite = v;
          else this.value = lignes[i].quantite;
        });
      });
      tbody.querySelectorAll(".rm-del").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = parseInt(this.getAttribute("data-idx"), 10);
          lignes.splice(i, 1);
          renderLignes();
        });
      });
    }

    // ── Ajout d'une ligne ────────────────────────────────────
    btnAdd.addEventListener("click", function () {
      var idArticle = parseInt(selectArticle.value, 10);
      var qty = parseInt(inputQty.value, 10);
      var nom = articlesMap[idArticle];

      if (!idArticle) {
        Toast.warn("Sélectionne un article");
        return;
      }
      if (!qty || qty < 1) {
        Toast.warn("Quantité invalide");
        return;
      }

      // US21 : on peut commander plusieurs articles en même temps
      // Si l'article est déjà dans le panier, on cumule les quantités
      var existant = null;
      lignes.forEach(function (l) {
        if (l.id_article === idArticle) existant = l;
      });

      if (existant) {
        existant.quantite += qty;
      } else {
        lignes.push({ id_article: idArticle, nom_article: nom, quantite: qty });
      }

      // Remettre le sélecteur à zéro et la quantité à 1
      selectArticle.value = "";
      inputQty.value = 1;
      renderLignes();
    });

    // ── Envoi ────────────────────────────────────────────────
    btnSend.addEventListener("click", async function () {
      if (lignes.length === 0) {
        Toast.warn("Aucune ligne à commander");
        return;
      }

      var payload = {
        date_souhaitee: inputDate.value || null,
        lignes: lignes.map(function (l) {
          return { id_article: l.id_article, quantite: l.quantite };
        }),
      };

      try {
        // US21 critère 2 : lancer le réapprovisionnement
        var res = await Requetes.creerReappro(payload);

        // US21 critère 4 : confirmation avec numéro d'ordre, statut, date/heure
        var today = new Date().toLocaleDateString("fr-FR");
        var lignesHtml = lignes
          .map(function (l) {
            return (
              "<tr><td>" +
              l.nom_article +
              '</td><td style="text-align:right;padding-left:12px">' +
              l.quantite +
              "</td></tr>"
            );
          })
          .join("");

        await Swal.fire({
          icon: "success",
          title: "Commande envoyée",
          html:
            '<div style="text-align:left;font-size:13px;">' +
            "<b>N° Ordre :</b> #" +
            res.id_reappro +
            "<br>" +
            "<b>Statut :</b> En cours<br>" +
            "<b>Date :</b> " +
            today +
            "<br><br>" +
            '<table style="width:100%;font-size:12px;">' +
            '<tr><th style="text-align:left">Article</th><th style="text-align:right">Qté</th></tr>' +
            lignesHtml +
            "</table></div>",
        });

        lignes = [];
        renderLignes();
        chargerProchainNumero();
        selectArticle.value = "";
        inputQty.value = 1;

        window.dispatchEvent(
          new CustomEvent("reappro:changed", {
            detail: {
              type: "manual-create",
              id_reappro: Number(res.id_reappro || 0),
            },
          }),
        );
      } catch (err) {
        Toast.err(err.message || "Erreur lors de l'envoi");
      }
    });

    // ── Réinitialiser ────────────────────────────────────────
    btnCancel.addEventListener("click", function () {
      lignes = [];
      renderLignes();
      selectArticle.value = "";
      inputQty.value = 1;
      inputDate.value = demain.toISOString().split("T")[0];
      chargerProchainNumero();
    });

    // ── Init ─────────────────────────────────────────────────
    chargerArticles();
    chargerProchainNumero();
    renderLignes();
  },
});
