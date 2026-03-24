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

  function buildHTML() {
    return `
      <section class="gv-panel">

        <div class="gv-datebar">
          <button class="gv-nav-btn" data-gv-nav="prev">&#8592;</button>
          <input  class="gv-date-input" type="date" data-gv-field="date_input" />
          <button class="gv-nav-btn" data-gv-nav="next">&#8594;</button>
          <button class="gv-nav-btn gv-nav-btn--today" data-gv-nav="today">Auj.</button>
        </div>

        <div class="gv-grid">
          <div class="gv-row"><label>Relevé</label>
            <input class="gv-input" type="text" data-gv-field="info" readonly /></div>
          <div class="gv-row"><label>Nb. transactions</label>
            <input class="gv-input" type="text" data-gv-field="nb_transactions" readonly /></div>
          <div class="gv-row"><label>Vol. carburant</label>
            <input class="gv-input" type="text" data-gv-field="volume_carburant" readonly /></div>
          <div class="gv-row"><label>Montant carburant</label>
            <input class="gv-input" type="text" data-gv-field="montant_carburant" readonly /></div>
          <div class="gv-row"><label>Vol. électricité</label>
            <input class="gv-input" type="text" data-gv-field="volume_electricite" readonly /></div>
          <div class="gv-row"><label>Montant électricité</label>
            <input class="gv-input" type="text" data-gv-field="montant_electricite" readonly /></div>
          <div class="gv-row"><label>Montant total</label>
            <input class="gv-input gv-input--strong" type="text" data-gv-field="montant_total" readonly /></div>
          <div class="gv-row"><label>Nb. incidents</label>
            <input class="gv-input" type="text" data-gv-field="nb_incidents" readonly /></div>
        </div>

        <div class="gv-tabs">
          <button class="gv-tab active" data-gv-tab="transactions">Transactions</button>
          <button class="gv-tab"        data-gv-tab="incidents">Incidents</button>
        </div>

        <div class="gv-list-wrap" data-gv-list="transactions">
          <table class="gv-list-table">
            <thead><tr><th>ID</th><th>Date/Heure</th><th>Montant</th></tr></thead>
            <tbody data-gv-tbody="transactions"></tbody>
          </table>
        </div>

        <div class="gv-list-wrap gv-list-wrap--hidden" data-gv-list="incidents">
          <table class="gv-list-table">
            <thead><tr><th>Ref</th><th>Heure</th><th>Type</th><th>Détail</th></tr></thead>
            <tbody data-gv-tbody="incidents"></tbody>
          </table>
        </div>

        <div class="gv-footer">
          <div class="gv-status" data-gv-field="statut">—</div>
          <button type="button" class="gv-footer-btn gv-footer-btn--primary" data-gv-action="valider">
            Valider
          </button>
        </div>

      </section>`;
  }

  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    let currentDate = toYmd(new Date());
    let activeTab = "transactions"; // onglet actif
    let synthData = {}; // dernière synthèse chargée

    const f = {
      dateInput: root.querySelector('[data-gv-field="date_input"]'),
      info: root.querySelector('[data-gv-field="info"]'),
      nbTransactions: root.querySelector('[data-gv-field="nb_transactions"]'),
      volumeCarburant: root.querySelector('[data-gv-field="volume_carburant"]'),
      montantCarburant: root.querySelector(
        '[data-gv-field="montant_carburant"]',
      ),
      volumeElectricite: root.querySelector(
        '[data-gv-field="volume_electricite"]',
      ),
      montantElectricite: root.querySelector(
        '[data-gv-field="montant_electricite"]',
      ),
      montantTotal: root.querySelector('[data-gv-field="montant_total"]'),
      nbIncidents: root.querySelector('[data-gv-field="nb_incidents"]'),
      statut: root.querySelector('[data-gv-field="statut"]'),
      validerBtn: root.querySelector('[data-gv-action="valider"]'),
      tbodyTx: root.querySelector('[data-gv-tbody="transactions"]'),
      tbodyInc: root.querySelector('[data-gv-tbody="incidents"]'),
    };

    if (f.dateInput) f.dateInput.value = currentDate;

    // ── Synthèse chiffrée ─────────────────────────────────
    function fillSynthese(data) {
      synthData = data || {};
      if (f.info)
        f.info.value = String(data?.info_transactions_journalieres || "");
      if (f.nbTransactions)
        f.nbTransactions.value = fmtNum.format(
          Number(data?.nb_transactions_effectuees || 0),
        );
      if (f.volumeCarburant)
        f.volumeCarburant.value =
          fmtNum.format(Number(data?.volume_total_carburant_l || 0)) + " L";
      if (f.montantCarburant)
        f.montantCarburant.value =
          fmtMoney.format(Number(data?.montant_total_carburant_eur || 0)) +
          " \u20ac";
      if (f.volumeElectricite)
        f.volumeElectricite.value =
          fmtNum.format(Number(data?.volume_total_electricite_kwh || 0)) +
          " kWh";
      if (f.montantElectricite)
        f.montantElectricite.value =
          fmtMoney.format(Number(data?.montant_total_electricite_eur || 0)) +
          " \u20ac";
      if (f.montantTotal)
        f.montantTotal.value =
          fmtMoney.format(Number(data?.montant_total_eur || 0)) + " \u20ac";
      if (f.nbIncidents)
        f.nbIncidents.value = fmtNum.format(Number(data?.nb_incidents || 0));
      updateFooter();
    }

    // ── Footer : statut + bouton selon onglet actif ───────
    function updateFooter() {
      if (!f.statut || !f.validerBtn) return;

      const isTx = activeTab === "transactions";
      const locked = isTx
        ? Boolean(synthData.est_valide_tx)
        : Boolean(synthData.est_valide_inc);
      const dv = isTx
        ? synthData.date_validation_tx
        : synthData.date_validation_inc;
      const label = isTx ? "transactions" : "incidents";

      if (locked) {
        const dvFmt = dv ? new Date(dv).toLocaleString("fr-FR") : "—";
        f.statut.textContent =
          "\uD83D\uDD12 Table " + label + " verrouill\u00e9e le " + dvFmt;
        f.statut.className = "gv-status gv-status--locked";
        f.validerBtn.disabled = true;
        f.validerBtn.textContent = "D\u00e9j\u00e0 valid\u00e9";
      } else {
        f.statut.textContent = "Table " + label + " en attente de validation";
        f.statut.className = "gv-status";
        f.validerBtn.disabled = false;
        f.validerBtn.textContent = "Valider";
      }
    }

    // ── Tables de consultation ────────────────────────────
    function fillTransactions(rows) {
      if (!f.tbodyTx) return;
      if (!rows || !rows.length) {
        f.tbodyTx.innerHTML = `<tr><td class="gv-list-empty" colspan="3">Aucune transaction ce jour</td></tr>`;
        return;
      }
      f.tbodyTx.innerHTML = rows
        .map(function (r) {
          return `<tr class="gv-list-row">
          <td>${esc(r.id_transaction)}</td>
          <td>${esc(r.date_heure)}</td>
          <td>${fmtMoney.format(Number(r.prix_total))} \u20ac</td>
        </tr>`;
        })
        .join("");
    }

    function fillIncidents(rows) {
      if (!f.tbodyInc) return;
      if (!rows || !rows.length) {
        f.tbodyInc.innerHTML = `<tr><td class="gv-list-empty" colspan="4">Aucun incident ce jour</td></tr>`;
        return;
      }
      f.tbodyInc.innerHTML = rows
        .map(function (r) {
          return `<tr class="gv-list-row">
          <td>${esc(r.id_ref_unique)}</td>
          <td>${esc(r.heure_creation)}</td>
          <td>${esc(r.type_incident)}</td>
          <td class="gv-list-detail">${esc(r.detail_tech)}</td>
        </tr>`;
        })
        .join("");
    }

    // ── Chargement complet ────────────────────────────────
    async function chargerJournee(date) {
      currentDate = date;
      if (f.dateInput) f.dateInput.value = date;
      try {
        const [synthese, txData, incData] = await Promise.all([
          Requetes.getValidationJournee(date),
          Requetes.getTransactionsJour(date),
          Requetes.getIncidentsJour(date),
        ]);
        fillSynthese(synthese || {});
        fillTransactions((txData && txData.transactions) || []);
        fillIncidents((incData && incData.incidents) || []);
      } catch (e) {
        Toast &&
          Toast.err(e && e.message ? e.message : "Chargement impossible");
      }
    }

    void chargerJournee(currentDate);

    // ── Événements ───────────────────────────────────────
    root.addEventListener("click", async function (e) {
      // Navigation dates
      const nav = e.target.closest("[data-gv-nav]");
      if (nav) {
        const d = new Date(currentDate + "T12:00:00");
        const dir = nav.dataset.gvNav;
        if (dir === "prev") d.setDate(d.getDate() - 1);
        if (dir === "next") d.setDate(d.getDate() + 1);
        if (dir === "today") {
          const t = new Date();
          d.setFullYear(t.getFullYear(), t.getMonth(), t.getDate());
        }
        void chargerJournee(toYmd(d));
        return;
      }

      // Onglets — changement de tab met à jour le footer
      const tab = e.target.closest("[data-gv-tab]");
      if (tab) {
        root.querySelectorAll(".gv-tab").forEach(function (t) {
          t.classList.remove("active");
        });
        tab.classList.add("active");
        activeTab = tab.dataset.gvTab;
        root.querySelectorAll("[data-gv-list]").forEach(function (el) {
          el.classList.toggle(
            "gv-list-wrap--hidden",
            el.dataset.gvList !== activeTab,
          );
        });
        updateFooter(); // ← recalcule statut + bouton selon nouvel onglet
        return;
      }

      // Bouton Valider
      const btn = e.target.closest("[data-gv-action='valider']");
      if (!btn || btn.disabled) return;

      const typeLabel =
        activeTab === "transactions" ? "des transactions" : "des incidents";
      const typeKey = activeTab; // 'transactions' ou 'incidents'

      const res = await Swal.fire({
        icon: "warning",
        title: "Valider la table\u00a0?",
        html: `<p style="font-family:var(--mono);font-size:13px;line-height:1.6">
                 Table relevé <strong>${typeLabel}</strong><br>
                 Journée du <strong>${toFr(currentDate)}</strong><br><br>
                 Une fois validée, cette table sera
                 <strong>définitivement verrouillée</strong>.
               </p>`,
        showCancelButton: true,
        cancelButtonText: "Annuler",
        confirmButtonText: "Confirmer",
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
      });

      if (!res.isConfirmed) return;

      try {
        const data = await Requetes.validerJournee(currentDate, typeKey);
        fillSynthese(data || {});
        // Invalider le cache BDD panel
        if (typeof BddPanel !== "undefined" && BddPanel.invalidateLockedDates) {
          BddPanel.invalidateLockedDates();
        }
        Toast &&
          Toast.ok(
            "Table " +
              typeLabel +
              " du " +
              toFr(currentDate) +
              " verrouill\u00e9e \uD83D\uDD12",
          );
      } catch (err) {
        Toast &&
          Toast.err(
            err && err.message ? err.message : "Erreur lors de la validation",
          );
      }
    });

    if (f.dateInput) {
      f.dateInput.addEventListener("change", function () {
        if (f.dateInput.value) void chargerJournee(f.dateInput.value);
      });
    }
  }

  return { buildHTML, onMount };
})();

WM.register("gerant_validation", {
  label: "Validation Tables",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return GerantValidationPanel.buildHTML();
  },
  onMount(id) {
    GerantValidationPanel.onMount(id);
  },
});
