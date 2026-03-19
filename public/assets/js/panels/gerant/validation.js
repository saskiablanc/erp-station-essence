/** panels/gerant/validation.js — Validation tables journalières (US16) */
const GerantValidationPanel = (() => {
  function buildHTML() {
    return `
      <section class="gv-panel">
        <div class="gv-grid">
          <div class="gv-row">
            <label>Info transactions journalières</label>
            <input class="gv-input" type="text" data-gv-field="info" />
          </div>

          <div class="gv-row">
            <label>Nb. transactions effectuées</label>
            <input class="gv-input" type="text" data-gv-field="nb_transactions" />
          </div>

          <div class="gv-row">
            <label>Volume total carburant délivré</label>
            <input class="gv-input" type="text" data-gv-field="volume_carburant" />
          </div>

          <div class="gv-row">
            <label>Montant total carburant délivré</label>
            <input class="gv-input" type="text" data-gv-field="montant_carburant" />
          </div>

          <div class="gv-row">
            <label>Volume total électricité délivrée</label>
            <input class="gv-input" type="text" data-gv-field="volume_electricite" />
          </div>

          <div class="gv-row">
            <label>Montant total électricité délivrée</label>
            <input class="gv-input" type="text" data-gv-field="montant_electricite" />
          </div>

          <div class="gv-row">
            <label>Montant total</label>
            <input class="gv-input gv-input--strong" type="text" data-gv-field="montant_total" />
          </div>

          <div class="gv-row">
            <label>Tables d’incident</label>
            <button type="button" class="gv-field gv-action" data-gv-action="incident">
              Consulter tables d’incident
            </button>
          </div>
        </div>

        <div class="gv-footer">
          <button type="button" class="gv-footer-btn" data-gv-action="releve">
            Consulter tables relevé
          </button>
          <button type="button" class="gv-footer-btn gv-footer-btn--primary" data-gv-action="valider">
            Valider
          </button>
        </div>
      </section>
    `;
  }

  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    const fields = {
      info: root.querySelector('[data-gv-field="info"]'),
      nbTransactions: root.querySelector('[data-gv-field="nb_transactions"]'),
      volumeCarburant: root.querySelector('[data-gv-field="volume_carburant"]'),
      montantCarburant: root.querySelector('[data-gv-field="montant_carburant"]'),
      volumeElectricite: root.querySelector('[data-gv-field="volume_electricite"]'),
      montantElectricite: root.querySelector('[data-gv-field="montant_electricite"]'),
      montantTotal: root.querySelector('[data-gv-field="montant_total"]'),
      incidentButton: root.querySelector('[data-gv-action="incident"]'),
      validerButton: root.querySelector('[data-gv-action="valider"]'),
    };

    Object.values(fields).forEach((el) => {
      if (el && el.tagName === "INPUT") {
        el.readOnly = true;
      }
    });

    const fmtNumber = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
    const fmtMoney = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    function setField(input, value) {
      if (!input) return;
      input.value = value;
    }

    function fill(data) {
      setField(fields.info, String(data?.info_transactions_journalieres || ""));
      setField(
        fields.nbTransactions,
        fmtNumber.format(Number(data?.nb_transactions_effectuees || 0)),
      );
      setField(
        fields.volumeCarburant,
        `${fmtNumber.format(Number(data?.volume_total_carburant_l || 0))} L`,
      );
      setField(
        fields.montantCarburant,
        `${fmtMoney.format(Number(data?.montant_total_carburant_eur || 0))} EUR`,
      );
      setField(
        fields.volumeElectricite,
        `${fmtNumber.format(Number(data?.volume_total_electricite_kwh || 0))} kWh`,
      );
      setField(
        fields.montantElectricite,
        `${fmtMoney.format(Number(data?.montant_total_electricite_eur || 0))} EUR`,
      );
      setField(
        fields.montantTotal,
        `${fmtMoney.format(Number(data?.montant_total_eur || 0))} EUR`,
      );

      if (fields.incidentButton) {
        const nbIncidents = Number(data?.nb_incidents || 0);
        fields.incidentButton.textContent =
          nbIncidents > 0
            ? `Consulter tables d’incident (${nbIncidents})`
            : "Consulter tables d’incident";
      }

      if (fields.validerButton) {
        const estValide = Boolean(data?.est_valide);
        fields.validerButton.disabled = estValide;
        fields.validerButton.textContent = estValide ? "Déjà validé" : "Valider";
      }
    }

    async function chargerSynthese() {
      try {
        const data = await Requetes.getValidationJournee();
        fill(data || {});
      } catch (error) {
        Toast?.err(error?.message || "Chargement validation impossible");
      }
    }

    void chargerSynthese();

    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gv-action]");
      if (!button) return;

      const action = button.dataset.gvAction;
      if (!action) return;

      if (action === "incident") {
        Toast?.warn("Consultation des tables d’incident à venir");
        return;
      }
      if (action === "releve") {
        Toast?.warn("Consultation des tables relevé à venir");
        return;
      }
      if (action === "valider") {
        Toast?.ok("Validation enregistrée");
      }
    });
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
