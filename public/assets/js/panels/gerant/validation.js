/** panels/gerant/validation.js — Validation tables journalières (US16) */
const GerantValidationPanel = (() => {
  const fmtNum = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  const fmtMoney = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function toYmd(date) {
    return date.toISOString().slice(0, 10);
  }
  function toFr(ymd) {
    if (!ymd) return "—";
    const [y, m, d] = ymd.split("-");
    return `${d}/${m}/${y}`;
  }
  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  // ── Grille synthèse réutilisable (panel + popup) ──────
  function buildSyntheseGrid(prefix) {
    return `
      <div class="gv-grid">
        <div class="gv-row"><label>Relevé</label>
          <input class="gv-input" type="text" data-gv-field="${prefix}info" readonly /></div>
        <div class="gv-row"><label>Transactions</label>
          <input class="gv-input" type="text" data-gv-field="${prefix}nb_transactions" readonly /></div>
        <div class="gv-row"><label>Vol. carburant</label>
          <input class="gv-input" type="text" data-gv-field="${prefix}volume_carburant" readonly /></div>
        <div class="gv-row"><label>Mnt. carburant</label>
          <input class="gv-input" type="text" data-gv-field="${prefix}montant_carburant" readonly /></div>
        <div class="gv-row"><label>Vol. électricité</label>
          <input class="gv-input" type="text" data-gv-field="${prefix}volume_electricite" readonly /></div>
        <div class="gv-row"><label>Mnt. électricité</label>
          <input class="gv-input" type="text" data-gv-field="${prefix}montant_electricite" readonly /></div>
        <div class="gv-row"><label>Total</label>
          <input class="gv-input gv-input--strong" type="text" data-gv-field="${prefix}montant_total" readonly /></div>
        <div class="gv-row"><label>Incidents</label>
          <input class="gv-input" type="text" data-gv-field="${prefix}nb_incidents" readonly /></div>
      </div>
      <div class="gv-statuts">
        <span class="gv-badge" data-gv-badge="${prefix}tx">Tx —</span>
        <span class="gv-badge" data-gv-badge="${prefix}inc">Inc —</span>
      </div>`;
  }

  // ── HTML panel principal (compact) ───────────────────
  function buildHTML() {
    return `
      <section class="gv-panel">
        ${buildSyntheseGrid("p_")}
        <div class="gv-footer">
          <button type="button" class="gv-footer-btn" data-gv-action="ouvrir">
            Validation
          </button>
        </div>
      </section>`;
  }

  // ── HTML popup ────────────────────────────────────────
  function buildPopup() {
    const el = document.createElement("div");
    el.className = "gv-overlay";
    el.innerHTML = `
      <div class="gv-popup">

        <div class="gv-popup-header">
          <div class="gv-popup-datebar">
            <button class="gv-nav-btn" data-gv-nav="prev">&#8592;</button>
            <input  class="gv-date-input" type="date" data-gv-field="popup_date" />
            <button class="gv-nav-btn" data-gv-nav="next">&#8594;</button>
            <button class="gv-nav-btn gv-nav-btn--today" data-gv-nav="today">Auj.</button>
          </div>
          <button class="gv-popup-close" data-gv-action="fermer">&#x2715;</button>
        </div>

        <div class="gv-popup-main">

          <!-- Colonne gauche : synthèse -->
          <div class="gv-popup-side">
            ${buildSyntheseGrid("pp_")}
          </div>

          <!-- Colonne droite : tables + validation -->
          <div class="gv-popup-content">
            <div class="gv-popup-tabs">
              <button class="gv-tab active" data-gv-tab="transactions">Transactions</button>
              <button class="gv-tab"        data-gv-tab="incidents">Incidents</button>
            </div>

            <div class="gv-popup-body">
              <div class="gv-list-wrap" data-gv-list="transactions">
                <table class="gv-list-table">
                  <thead><tr><th>ID</th><th>Date / Heure</th><th>Montant</th></tr></thead>
                  <tbody data-gv-tbody="transactions"></tbody>
                </table>
              </div>
              <div class="gv-list-wrap gv-list-wrap--hidden" data-gv-list="incidents">
                <table class="gv-list-table">
                  <thead><tr><th>Ref</th><th>Heure</th><th>Type</th><th>Détail</th></tr></thead>
                  <tbody data-gv-tbody="incidents"></tbody>
                </table>
              </div>
            </div>

            <div class="gv-popup-footer">
              <span class="gv-popup-statut" data-gv-field="popup_statut"></span>
              <button type="button" class="gv-footer-btn gv-footer-btn--primary" data-gv-action="valider">
                Valider
              </button>
            </div>
          </div>

        </div>
      </div>`;
    return el;
  }

  // ── onMount ───────────────────────────────────────────
  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    let currentDate = toYmd(new Date());
    let synthData = {};
    let activeTab = "transactions";
    let popup = null;

    // ── Remplissage d'une grille (panel ou popup) ─────
    function fillGrid(data, prefix, el) {
      function s(field, val) {
        var inp = el.querySelector('[data-gv-field="' + prefix + field + '"]');
        if (inp) inp.value = val;
      }
      s("info", String(data.info_transactions_journalieres || ""));
      s(
        "nb_transactions",
        fmtNum.format(Number(data.nb_transactions_effectuees || 0)),
      );
      s(
        "volume_carburant",
        fmtNum.format(Number(data.volume_total_carburant_l || 0)) + " L",
      );
      s(
        "montant_carburant",
        fmtMoney.format(Number(data.montant_total_carburant_eur || 0)) +
          " \u20ac",
      );
      s(
        "volume_electricite",
        fmtNum.format(Number(data.volume_total_electricite_kwh || 0)) + " kWh",
      );
      s(
        "montant_electricite",
        fmtMoney.format(Number(data.montant_total_electricite_eur || 0)) +
          " \u20ac",
      );
      s(
        "montant_total",
        fmtMoney.format(Number(data.montant_total_eur || 0)) + " \u20ac",
      );
      s("nb_incidents", fmtNum.format(Number(data.nb_incidents || 0)));

      var bTx = el.querySelector('[data-gv-badge="' + prefix + 'tx"]');
      var bInc = el.querySelector('[data-gv-badge="' + prefix + 'inc"]');
      if (bTx) {
        var okTx = Boolean(data.est_valide_tx);
        bTx.textContent = okTx ? "Tx valid." : "Tx non valid.";
        bTx.className = "gv-badge" + (okTx ? " gv-badge--ok" : "");
      }
      if (bInc) {
        var okInc = Boolean(data.est_valide_inc);
        bInc.textContent = okInc ? "Inc valid." : "Inc non valid.";
        bInc.className = "gv-badge" + (okInc ? " gv-badge--ok" : "");
      }
    }

    function fillSynthese(data) {
      synthData = data || {};
      fillGrid(synthData, "p_", root);
      if (popup) fillGrid(synthData, "pp_", popup);
    }

    // ── Popup ─────────────────────────────────────────
    function openPopup() {
      if (popup) return;
      popup = buildPopup();
      document.body.appendChild(popup);

      var dateInput = popup.querySelector('[data-gv-field="popup_date"]');
      if (dateInput) dateInput.value = currentDate;

      // Remplir la synthèse déjà chargée
      fillGrid(synthData, "pp_", popup);
      updatePopupFooter();

      // Charger les listes
      chargerListes(currentDate);

      popup.addEventListener("click", async function (e) {
        if (
          e.target === popup ||
          e.target.closest("[data-gv-action='fermer']")
        ) {
          closePopup();
          return;
        }

        var nav = e.target.closest("[data-gv-nav]");
        if (nav) {
          var d = new Date(currentDate + "T12:00:00");
          var dir = nav.dataset.gvNav;
          if (dir === "prev") d.setDate(d.getDate() - 1);
          if (dir === "next") d.setDate(d.getDate() + 1);
          if (dir === "today") {
            var t = new Date();
            d.setFullYear(t.getFullYear(), t.getMonth(), t.getDate());
          }
          chargerJournee(toYmd(d));
          return;
        }

        var tab = e.target.closest("[data-gv-tab]");
        if (tab) {
          popup.querySelectorAll(".gv-tab").forEach(function (t) {
            t.classList.remove("active");
          });
          tab.classList.add("active");
          activeTab = tab.dataset.gvTab;
          popup.querySelectorAll("[data-gv-list]").forEach(function (el) {
            el.classList.toggle(
              "gv-list-wrap--hidden",
              el.dataset.gvList !== activeTab,
            );
          });
          updatePopupFooter();
          return;
        }

        var btn = e.target.closest("[data-gv-action='valider']");
        if (btn && !btn.disabled) await doValider();
      });

      var popupDateInput = popup.querySelector('[data-gv-field="popup_date"]');
      if (popupDateInput) {
        popupDateInput.addEventListener("change", function () {
          if (popupDateInput.value) chargerJournee(popupDateInput.value);
        });
      }
    }

    function closePopup() {
      if (popup) {
        popup.remove();
        popup = null;
      }
    }

    // Charge synthèse + listes pour une date
    function chargerJournee(date) {
      currentDate = date;
      var di = popup && popup.querySelector('[data-gv-field="popup_date"]');
      if (di) di.value = date;
      setListLoading();
      Promise.all([
        Requetes.getValidationJournee(date),
        Requetes.getTransactionsJour(date),
        Requetes.getIncidentsJour(date),
      ])
        .then(function (r) {
          fillSynthese(r[0] || {});
          fillTx((r[1] && r[1].transactions) || []);
          fillInc((r[2] && r[2].incidents) || []);
          updatePopupFooter();
        })
        .catch(function (e) {
          Toast && Toast.err(e && e.message ? e.message : "Erreur chargement");
        });
    }

    // Charge seulement les listes (sans recharger la synthèse)
    function chargerListes(date) {
      setListLoading();
      Promise.all([
        Requetes.getTransactionsJour(date),
        Requetes.getIncidentsJour(date),
      ])
        .then(function (r) {
          fillTx((r[0] && r[0].transactions) || []);
          fillInc((r[1] && r[1].incidents) || []);
        })
        .catch(function () {});
    }

    function setListLoading() {
      if (!popup) return;
      ["transactions", "incidents"].forEach(function (t) {
        var tb = popup.querySelector('[data-gv-tbody="' + t + '"]');
        if (tb)
          tb.innerHTML =
            '<tr><td class="gv-list-empty" colspan="4">Chargement\u2026</td></tr>';
      });
    }

    function fillTx(rows) {
      if (!popup) return;
      var tb = popup.querySelector('[data-gv-tbody="transactions"]');
      if (!tb) return;
      if (!rows.length) {
        tb.innerHTML =
          '<tr><td class="gv-list-empty" colspan="3">Aucune transaction ce jour</td></tr>';
        return;
      }
      tb.innerHTML = rows
        .map(function (r) {
          return (
            '<tr class="gv-list-row"><td>' +
            esc(r.id_transaction) +
            "</td><td>" +
            esc(r.date_heure) +
            "</td><td>" +
            fmtMoney.format(Number(r.prix_total)) +
            " \u20ac</td></tr>"
          );
        })
        .join("");
    }

    function fillInc(rows) {
      if (!popup) return;
      var tb = popup.querySelector('[data-gv-tbody="incidents"]');
      if (!tb) return;
      if (!rows.length) {
        tb.innerHTML =
          '<tr><td class="gv-list-empty" colspan="4">Aucun incident ce jour</td></tr>';
        return;
      }
      tb.innerHTML = rows
        .map(function (r) {
          return (
            '<tr class="gv-list-row"><td>' +
            esc(r.id_ref_unique) +
            "</td><td>" +
            esc(r.heure_creation) +
            "</td><td>" +
            esc(r.type_incident) +
            '</td><td class="gv-list-detail">' +
            esc(r.detail_tech) +
            "</td></tr>"
          );
        })
        .join("");
    }

    function updatePopupFooter() {
      if (!popup) return;
      var statut = popup.querySelector('[data-gv-field="popup_statut"]');
      var btn = popup.querySelector('[data-gv-action="valider"]');
      if (!statut || !btn) return;
      var isTx = activeTab === "transactions";
      var locked = isTx
        ? Boolean(synthData.est_valide_tx)
        : Boolean(synthData.est_valide_inc);
      var dv = isTx
        ? synthData.date_validation_tx
        : synthData.date_validation_inc;
      var label = isTx ? "Transactions" : "Incidents";
      if (locked) {
        var dvFmt = dv ? new Date(dv).toLocaleString("fr-FR") : "—";
        statut.textContent = label + " — valid\u00e9 le " + dvFmt;
        statut.className = "gv-popup-statut gv-popup-statut--locked";
        btn.disabled = true;
        btn.textContent = "D\u00e9j\u00e0 valid\u00e9";
      } else {
        statut.textContent = label + " — non valid\u00e9";
        statut.className = "gv-popup-statut";
        btn.disabled = false;
        btn.textContent = "Valider";
      }
    }

    async function doValider() {
      var typeKey = activeTab;
      var typeLabel =
        activeTab === "transactions" ? "transactions" : "incidents";
      var res = await Swal.fire({
        icon: "warning",
        title: "Confirmer la validation\u00a0?",
        html:
          '<p style="font-family:var(--mono);font-size:13px;line-height:1.6">' +
          "Table <strong>" +
          typeLabel +
          "</strong> — " +
          toFr(currentDate) +
          "<br>" +
          "Cette table sera d\u00e9finitivement verrouill\u00e9e." +
          "</p>",
        showCancelButton: true,
        cancelButtonText: "Annuler",
        confirmButtonText: "Valider",
        customClass: {
          popup: "bdd-swal-popup",
          title: "bdd-swal-title",
          htmlContainer: "bdd-swal-html",
          confirmButton: "bdd-swal-btn",
          cancelButton: "bdd-swal-btn bdd-swal-btn--cancel",
        },
        buttonsStyling: false,
        reverseButtons: false,
        backdrop: "rgba(26,26,46,0.45)",
        allowOutsideClick: false,
        didOpen: function () {
          // Force Swal au-dessus de notre overlay (z-index 9500)
          var container = document.querySelector(".swal2-container");
          if (container) container.style.zIndex = "10000";
        },
      });
      if (!res.isConfirmed) return;
      try {
        var data = await Requetes.validerJournee(currentDate, typeKey);
        fillSynthese(data || {});
        updatePopupFooter();
        if (typeof BddPanel !== "undefined" && BddPanel.invalidateLockedDates)
          BddPanel.invalidateLockedDates();
        Toast &&
          Toast.ok(
            "Table " +
              typeLabel +
              " du " +
              toFr(currentDate) +
              " valid\u00e9e.",
          );
      } catch (err) {
        Toast &&
          Toast.err(err && err.message ? err.message : "Erreur validation");
      }
    }

    // ── Chargement initial du panel ───────────────────
    Requetes.getValidationJournee(currentDate)
      .then(function (data) {
        fillSynthese(data || {});
      })
      .catch(function () {});

    // ── Bouton "Validation" du panel ──────────────────
    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-gv-action='ouvrir']")) openPopup();
    });

    // ── Intercepte le bouton max WM pour ouvrir le popup ──
    var maxBtn = root.querySelector(".wc.max");
    if (maxBtn) {
      maxBtn.addEventListener(
        "click",
        function (e) {
          e.stopImmediatePropagation();
          e.preventDefault();
          openPopup();
        },
        true,
      ); // capture phase — passe avant le listener WM
    }
  }

  return { buildHTML, onMount };
})();

WM.register("gerant_validation", {
  label: "Validation Tables",
  icon: "VAL",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return GerantValidationPanel.buildHTML();
  },
  onMount(id) {
    GerantValidationPanel.onMount(id);
  },
});
