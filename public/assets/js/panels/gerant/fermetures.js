/** panels/gerant/fermetures.js — Jours de fermetures de la boutique (US15) */
const GerantFermeturesPanel = (() => {
  const states = new Map();

  function toFrDate(isoDate) {
    if (!isoDate || !isoDate.includes("-")) return "—";
    const [year, month, day] = String(isoDate).split("-");
    if (!year || !month || !day) return "—";
    return `${day}/${month}/${year}`;
  }

  function normalizeRow(raw) {
    return {
      id: Number(raw?.id_fermeture ?? raw?.id ?? 0),
      date: String(raw?.date_fermeture ?? raw?.date ?? ""),
      motif: String(raw?.motif ?? ""),
    };
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
    const body = root.querySelector("[data-gf-table-body]");
    if (!body) return;

    if (!rows.length) {
      body.innerHTML = `
        <tr>
          <td colspan="3" class="gf-empty">Aucun jour enregistré</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(toFrDate(row.date))}</td>
            <td class="gf-cell-motif">${escapeHtml(row.motif)}</td>
            <td class="gf-cell-action">
              <button
                type="button"
                class="gf-delete-btn"
                data-gf-delete="${row.id}"
                aria-label="Supprimer"
                title="Supprimer"
              >✕</button>
            </td>
          </tr>
        `,
      )
      .join("");
  }

  async function loadRows(id, root) {
    const state = states.get(id);
    if (!state) return;

    try {
      const rows = await Requetes.getFermetures();
      state.rows = (Array.isArray(rows) ? rows : [])
        .map(normalizeRow)
        .filter((row) => row.id > 0 && row.date && row.motif);
      sortRows(state.rows);
      renderTable(root, state.rows);
    } catch (error) {
      renderTable(root, []);
      Toast.err(error.message || "Chargement des jours de fermeture impossible");
    }
  }

  function buildHTML() {
    return `
      <section class="gf-panel">
        <div class="gf-layout">
          <div class="gf-table-card">
            <h3 class="gf-side-title">Jours enregistrés</h3>
            <div class="gf-table-scroll">
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
          </div>

          <aside class="gf-form-card">
            <h3 class="gf-form-title">Ajouter un jour férié</h3>
            <form class="gf-form" data-gf-form novalidate>
              <label class="gf-field">
                <span>Date :</span>
                <input type="date" name="date" required />
              </label>

              <label class="gf-field">
                <span>Motif :</span>
                <input type="text" name="motif" maxlength="80" required placeholder="Ex : Inventaire annuel" />
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

    states.set(id, { rows: [] });
    renderTable(root, []);
    void loadRows(id, root);

    const form = root.querySelector("[data-gf-form]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const state = states.get(id);
      if (!state) return;

      const submit = form.querySelector(".gf-submit-btn");
      const data = new FormData(form);
      const date = String(data.get("date") || "").trim();
      const motif = String(data.get("motif") || "").trim();

      if (!date || !motif) {
        Toast.warn("Veuillez renseigner la date et le motif");
        return;
      }

      const already = state.rows.some(
        (row) => row.date === date && row.motif.toLowerCase() === motif.toLowerCase(),
      );
      if (already) {
        Toast.warn("Ce jour existe déjà");
        return;
      }

      if (submit) submit.disabled = true;
      try {
        const created = await Requetes.createFermeture({
          date_fermeture: date,
          motif,
        });
        const row = normalizeRow(created?.fermeture ?? created);
        if (row.id > 0) {
          state.rows.push(row);
          sortRows(state.rows);
          renderTable(root, state.rows);
        } else {
          await loadRows(id, root);
        }
        form.reset();
        Toast.ok("Jour férié ajouté");
      } catch (error) {
        Toast.err(error.message || "Ajout impossible");
      } finally {
        if (submit) submit.disabled = false;
      }
    });

    root.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-gf-delete]");
      if (!btn) return;

      const state = states.get(id);
      if (!state) return;

      const rowId = Number(btn.dataset.gfDelete || 0);
      if (rowId <= 0) return;

      try {
        await Requetes.deleteFermeture(rowId);
        state.rows = state.rows.filter((row) => row.id !== rowId);
        renderTable(root, state.rows);
        Toast.ok("Jour supprimé");
      } catch (error) {
        Toast.err(error.message || "Suppression impossible");
      }
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
