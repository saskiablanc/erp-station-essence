/** panels/gerant/fermetures.js — Jours de fermetures de la boutique (US15) */
const GerantFermeturesPanel = (() => {
  const panelStates = new Map();

  function getInitialRows() {
    return [
      { id: 1, date: "2025-12-25", motif: "Jour de Noël" },
      { id: 2, date: "2026-01-01", motif: "Jour de l’an" },
      { id: 3, date: "2026-04-01", motif: "Jour de fermeture exceptionnelle" },
    ];
  }

  function toFrDate(isoDate) {
    if (!isoDate || !isoDate.includes("-")) return "—";
    const [year, month, day] = isoDate.split("-");
    if (!year || !month || !day) return "—";
    return `${day}/${month}/${year}`;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function sortRows(rows) {
    rows.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function renderTable(root, rows) {
    const tbody = root.querySelector("[data-gf-table-body]");
    if (!tbody) return;

    if (!rows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="gf-empty">Aucun jour de fermeture enregistré</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(toFrDate(row.date))}</td>
            <td>${escapeHtml(row.motif)}</td>
            <td class="gf-cell-action">
              <button
                type="button"
                class="gf-delete-btn"
                data-gf-delete="${row.id}"
                title="Supprimer"
                aria-label="Supprimer"
              >✕</button>
            </td>
          </tr>
        `,
      )
      .join("");
  }

  function buildHTML() {
    return `
      <section class="gf-panel">
        <div class="gf-layout">
          <div class="gf-table-card">
            <table class="gf-table" aria-label="Jours de fermeture">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Motif</th>
                  <th></th>
                </tr>
              </thead>
              <tbody data-gf-table-body></tbody>
            </table>
          </div>

          <aside class="gf-form-card">
            <h3 class="gf-form-title">Ajouter un nouveau jour de fermeture :</h3>
            <form class="gf-form" data-gf-form novalidate>
              <label class="gf-field">
                <span>Date :</span>
                <input type="date" name="date" required />
              </label>

              <label class="gf-field">
                <span>Motif :</span>
                <input
                  type="text"
                  name="motif"
                  required
                  maxlength="80"
                  placeholder="Ex : Inventaire annuel"
                />
              </label>

              <button type="submit" class="gf-submit-btn">Valider</button>
            </form>
          </aside>
        </div>
      </section>
    `;
  }

  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    const state = {
      rows: getInitialRows(),
      nextId: 4,
    };
    sortRows(state.rows);
    panelStates.set(id, state);
    renderTable(root, state.rows);

    const form = root.querySelector("[data-gf-form]");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();

      const current = panelStates.get(id);
      if (!current) return;

      const data = new FormData(form);
      const date = String(data.get("date") || "").trim();
      const motif = String(data.get("motif") || "").trim();

      if (!date || !motif) {
        Toast.warn("Veuillez renseigner la date et le motif");
        return;
      }

      const duplicate = current.rows.some(
        (row) => row.date === date && row.motif.toLowerCase() === motif.toLowerCase(),
      );
      if (duplicate) {
        Toast.warn("Ce jour de fermeture existe déjà");
        return;
      }

      current.rows.push({ id: current.nextId++, date, motif });
      sortRows(current.rows);
      renderTable(root, current.rows);
      form.reset();
      Toast.ok("Jour de fermeture ajouté");
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-gf-delete]");
      if (!button) return;

      const current = panelStates.get(id);
      if (!current) return;

      const rowId = Number(button.dataset.gfDelete || 0);
      if (rowId <= 0) return;

      current.rows = current.rows.filter((row) => row.id !== rowId);
      panelStates.set(id, current);
      renderTable(root, current.rows);
      Toast.ok("Jour de fermeture supprimé");
    });
  }

  return { buildHTML, onMount };
})();

WM.register("gerant_fermetures", {
  label: "Jours de fermetures de la boutique",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return GerantFermeturesPanel.buildHTML();
  },
  onMount(id) {
    GerantFermeturesPanel.onMount(id);
  },
});
