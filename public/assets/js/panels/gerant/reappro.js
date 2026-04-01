/** panels/gerant/reappro.js — US23 Consultation + US22 Annulation */
const ReapproPanel = (() => {
  let changeHandler = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function isLiquidType(type) {
    const value = String(type ?? "").toLowerCase();
    return (
      value === "carburant" ||
      value === "energie" ||
      value === "electricite"
    );
  }

  function formatMetric(value, digits) {
    const num = Number(value ?? 0);
    if (!Number.isFinite(num)) return digits > 0 ? "0.000" : "0";
    return num.toFixed(digits);
  }

  function getUnitLabel(type) {
    return isLiquidType(type) ? "L" : "qte";
  }

  function normalizeQtyForInput(line) {
    const qty = Number(line?.quantite ?? 0);
    if (isLiquidType(line?.type_article)) {
      return formatMetric(qty, 3);
    }
    return String(Math.max(1, Math.round(qty || 0)));
  }

  function normalizeLine(line, metaByArticle) {
    const idArticle = Number(line?.id_article ?? 0);
    const meta = metaByArticle.get(idArticle) || {};
    const typeArticle = String(
      line?.type_article ?? meta.type_article ?? "",
    );

    return {
      id_article: idArticle,
      nom_article: String(line?.nom_article ?? meta.nom_article ?? ""),
      code_barres:
        line?.code_barres !== null && line?.code_barres !== undefined
          ? String(line.code_barres)
          : "",
      type_article: typeArticle,
      quantite: Number(line?.quantite ?? meta.volume ?? 0),
      quantite_stock: Number(meta.quantite_stock ?? 0),
      seuil_alerte: Number(meta.seuil_alerte ?? 0),
      unit: getUnitLabel(typeArticle),
    };
  }

  function buildMetaMap(created) {
    const map = new Map();
    (Array.isArray(created) ? created : []).forEach(function (article) {
      map.set(Number(article?.id_article ?? 0), article || {});
    });
    return map;
  }

  async function loadAutoReapproDetail(payload) {
    const idReappro = Number(payload?.id_reappro ?? 0);
    const metaByArticle = buildMetaMap(payload?.created);
    if (idReappro > 0) {
      try {
        const reappro = await Requetes.getReappro(idReappro);
        const lines = Array.isArray(reappro?.lignes)
          ? reappro.lignes.map(function (line) {
              return normalizeLine(line, metaByArticle);
            })
          : [];
        if (lines.length > 0) {
          return {
            id_reappro: idReappro,
            lignes: lines,
          };
        }
      } catch (_) {}
    }

    const fallbackLines = (Array.isArray(payload?.created) ? payload.created : [])
      .map(function (article) {
        return normalizeLine(article, metaByArticle);
      })
      .filter(function (line) {
        return line.id_article > 0;
      });

    return {
      id_reappro: idReappro,
      lignes: fallbackLines,
    };
  }

  function buildAutoReviewTable(lines) {
    return `
      <div class="ra-auto-dialog">
        <div class="ra-auto-dialog__intro">
          Le seuil d'alerte a déclenché un réapprovisionnement automatique. Ajustez la quantité avant validation ou annulation.
        </div>
        <div class="ra-auto-dialog__table-wrap">
          <table class="ra-auto-dialog__table">
            <thead>
              <tr>
                <th>Article</th>
                <th>Stock</th>
                <th>Seuil</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              ${lines
                .map(function (line) {
                  return `
                    <tr>
                      <td>
                        <div class="ra-auto-dialog__name">${escapeHtml(line.nom_article || `#${line.id_article}`)}</div>
                        ${
                          line.code_barres
                            ? `<div class="ra-auto-dialog__meta">${escapeHtml(line.code_barres)}</div>`
                            : ""
                        }
                      </td>
                      <td class="ra-auto-dialog__num">
                        ${escapeHtml(formatMetric(line.quantite_stock, isLiquidType(line.type_article) ? 3 : 0))}
                        <span class="ra-auto-dialog__unit">${escapeHtml(line.unit)}</span>
                      </td>
                      <td class="ra-auto-dialog__num">
                        ${escapeHtml(formatMetric(line.seuil_alerte, isLiquidType(line.type_article) ? 3 : 0))}
                        <span class="ra-auto-dialog__unit">${escapeHtml(line.unit)}</span>
                      </td>
                      <td>
                        <div class="ra-auto-dialog__input-wrap">
                          <input
                            class="ra-auto-dialog__input"
                            type="number"
                            min="${isLiquidType(line.type_article) ? "0.001" : "1"}"
                            step="${isLiquidType(line.type_article) ? "0.001" : "1"}"
                            value="${escapeHtml(normalizeQtyForInput(line))}"
                            data-id-article="${line.id_article}"
                            data-type-article="${escapeHtml(line.type_article)}"
                            data-original="${escapeHtml(normalizeQtyForInput(line))}"
                          >
                          <span class="ra-auto-dialog__unit">${escapeHtml(line.unit)}</span>
                        </div>
                      </td>
                    </tr>
                  `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  async function promptAutoReview(payload) {
    const detail = await loadAutoReapproDetail(payload);
    const idReappro = Number(detail?.id_reappro ?? 0);
    const lignes = Array.isArray(detail?.lignes) ? detail.lignes : [];

    if (idReappro <= 0 || lignes.length === 0) {
      await Swal.fire({
        icon: "warning",
        title: "Seuil d'alerte atteint",
        text: "Le réapprovisionnement automatique a été créé, mais son détail n'a pas pu être chargé.",
        confirmButtonText: "Fermer",
      });
      return "pending";
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Réappro auto #" + idReappro,
      html: buildAutoReviewTable(lignes),
      width: 760,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showDenyButton: true,
      confirmButtonText: "Valider le réappro",
      denyButtonText: "Annuler le réappro",
      denyButtonColor: "#ef4444",
      preConfirm: async function () {
        const popup = Swal.getPopup();
        const inputs = popup
          ? Array.from(popup.querySelectorAll(".ra-auto-dialog__input"))
          : [];
        const updates = [];

        for (const input of inputs) {
          const idArticle = Number(input.dataset.idArticle || 0);
          const rawValue = String(input.value || "").trim().replace(",", ".");
          const isLiquid = isLiquidType(input.dataset.typeArticle || "");
          const parsed = Number(rawValue);

          if (!Number.isFinite(parsed) || parsed <= 0) {
            Swal.showValidationMessage(
              "Chaque quantité doit être supérieure à 0.",
            );
            return false;
          }

          const normalized = isLiquid
            ? Number(parsed.toFixed(3))
            : Math.max(1, Math.round(parsed));
          const original = Number(
            String(input.dataset.original || "0").replace(",", "."),
          );

          input.value = isLiquid
            ? normalized.toFixed(3)
            : String(normalized);

          if (Math.abs(normalized - original) > 0.0005) {
            updates.push({
              id_article: idArticle,
              quantite: normalized,
            });
          }
        }

        try {
          for (const update of updates) {
            await Requetes.updateReapproLigne(
              idReappro,
              update.id_article,
              update.quantite,
            );
          }
          return { updates: updates };
        } catch (err) {
          Swal.showValidationMessage(err.message || "Modification impossible");
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      const count = Array.isArray(result.value?.updates)
        ? result.value.updates.length
        : 0;
      Toast.ok(
        count > 0
          ? "Réappro auto #" + idReappro + " ajusté puis validé"
          : "Réappro auto #" + idReappro + " validé",
      );
      dispatchChanged({
        type: "auto-confirm",
        id_reappro: idReappro,
      });
      return "confirmed";
    }

    if (result.isDenied) {
      try {
        await Requetes.annulerReappro(idReappro);
        Toast.warn("Réappro automatique #" + idReappro + " annulé");
        dispatchChanged({
          type: "auto-cancel",
          id_reappro: idReappro,
          statut: "Annulé",
        });
        return "cancelled";
      } catch (err) {
        Toast.err(err.message);
        return "pending";
      }
    }

    return "pending";
  }

  async function showEmployeThresholdNotice(payload) {
    const created = Array.isArray(payload?.created) ? payload.created : [];
    const idReappro = Number(payload?.id_reappro ?? 0);
    const listHtml = created
      .map(function (article) {
        return `
          <tr>
            <td style="padding:4px 10px 4px 0;text-align:left;">${escapeHtml(article?.nom_article || `#${article?.id_article || ""}`)}</td>
            <td style="padding:4px 0;text-align:right;">${escapeHtml(
              isLiquidType(article?.type_article)
                ? `${formatMetric(article?.volume ?? 0, 3)} L`
                : `${Math.max(0, Math.round(Number(article?.volume ?? 0)))} qte`,
            )}</td>
          </tr>
        `;
      })
      .join("");

    await Swal.fire({
      icon: "warning",
      title: "Seuil d'alerte atteint",
      html: `
        <div class="ra-auto-dialog ra-auto-dialog--employe">
          <div class="ra-auto-dialog__intro">
            Un réapprovisionnement automatique a été lancé. Prévenez le gérant pour ajuster ou confirmer la commande.
          </div>
          <div class="ra-auto-dialog__meta-line"><b>N° ordre :</b> #${escapeHtml(idReappro || "—")}</div>
          ${
            listHtml
              ? `<table class="ra-auto-dialog__mini-table">${listHtml}</table>`
              : ""
          }
        </div>
      `,
      confirmButtonText: "Compris",
    });
  }

  function dispatchChanged(detail = {}) {
    window.dispatchEvent(new CustomEvent("reappro:changed", { detail }));
  }

  function bindRefresh(charger) {
    if (changeHandler) {
      window.removeEventListener("reappro:changed", changeHandler);
    }
    changeHandler = function () {
      charger();
    };
    window.addEventListener("reappro:changed", changeHandler);
  }

  return {
    dispatchChanged,
    bindRefresh,
    promptAutoReview,
    showEmployeThresholdNotice,
  };
})();

WM.register("gerant_reappro", {
  label: "Réapprovisionnement",
  icon: "RAP",
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

      if (rows.length === 0) {
        html +=
          '<tr><td colspan="9" style="text-align:center;padding:20px;font-family:var(--mono);font-size:12px;color:var(--text-dim);">Aucun réapprovisionnement pour ce filtre</td></tr>';
        html += "</tbody></table>";
        wrap.innerHTML = html;
        return;
      }

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
          if (nouveau === "Arrivé") {
            window.dispatchEvent(new CustomEvent("stock:changed"));
          }
          ReapproPanel.dispatchChanged({
            type: "status",
            id_reappro: Number(id),
            statut: nouveau,
          });
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
        ReapproPanel.dispatchChanged({
          type: "cancel",
          id_reappro: Number(id),
          statut: "Annulé",
        });
      } catch (err) {
        Toast.err(err.message);
      }
    });

    charger();
    ReapproPanel.bindRefresh(charger);

    // Permet aux autres panels de déclencher un rechargement
    window.ReapproEvents = window.ReapproEvents || {};
    window.ReapproEvents.refresh = charger;
    window.ReapproEvents.dispatchChanged = ReapproPanel.dispatchChanged;
  },
});
