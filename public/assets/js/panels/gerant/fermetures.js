/** panels/gerant/fermetures.js — Jours de fermetures de la boutique (US15) */
const GerantFermeturesPanel = (() => {
  const states = new Map();

  function toFrDate(isoDate, recurrent) {
    if (!isoDate || !isoDate.includes("-")) return "—";
    const parts = String(isoDate).split("-");
    if (parts.length < 3) return "—";
    const [year, month, day] = parts;
    if (!month || !day) return "—";
    if (recurrent || year === "0000") return `${day}/${month}`;
    return `${day}/${month}/${year}`;
  }

  function normalizeRow(raw) {
    return {
      id: Number(raw?.id_fermeture ?? raw?.id ?? 0),
      date: String(raw?.date_fermeture ?? raw?.date ?? ""),
      motif: String(raw?.motif ?? ""),
      recurrent: !!(raw?.recurrent && String(raw.recurrent) !== "0"),
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

  function confirmAction(icon, title, text, confirmText) {
    return Swal.fire({
      icon: icon || "question",
      title: title || "",
      text: text || "",
      showCancelButton: true,
      confirmButtonText: confirmText || "Confirmer",
      cancelButtonText: "Annuler",
      allowOutsideClick: false,
    });
  }

  function sortRows(rows) {
    rows.sort((a, b) => {
      // Sort by month-day regardless of year
      const amd = String(a.date).slice(5);
      const bmd = String(b.date).slice(5);
      return amd.localeCompare(bmd);
    });
  }

  function toMonthDayForApi(value) {
    const trimmed = String(value || "").trim();
    let day = null;
    let month = null;

    // Native <input type="date"> => YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      month = Number(isoMatch[2]);
      day = Number(isoMatch[3]);
    } else {
      // Manual fallback => JJ/MM
      const frMatch = trimmed.match(/^(\d{1,2})\s*[/-]\s*(\d{1,2})$/);
      if (!frMatch) return null;
      day = Number(frMatch[1]);
      month = Number(frMatch[2]);
    }

    if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
    if (month < 1 || month > 12) return null;

    // Year 2000 keeps 29/02 valid for annual closures.
    const maxDay = new Date(2000, month, 0).getDate();
    if (day < 1 || day > maxDay) return null;

    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${mm}-${dd}`;
  }

  function renderTable(root, rows) {
    const body = root.querySelector("[data-gf-table-body]");
    if (!body) return;

    if (!rows.length) {
      body.innerHTML = `
        <tr>
          <td colspan="4" class="gf-empty">Aucun jour enregistré</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(toFrDate(row.date, row.recurrent))}</td>
            <td class="gf-cell-motif">${escapeHtml(row.motif)}</td>
            <td class="gf-cell-type">
              <span class="gf-type-badge ${row.recurrent ? "gf-type-badge--rec" : "gf-type-badge--exc"}">
                ${row.recurrent ? "Annuel" : "Except."}
              </span>
            </td>
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
      Toast.err(
        error.message || "Chargement des jours de fermeture impossible",
      );
    }
  }

  function buildHTML() {
    return `
      <section class="gf-panel">
        <div class="gf-layout">
          <div class="gf-table-card">
            <div class="gf-table-scroll">
              <table class="gf-table" aria-label="Jours de fermeture">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Motif</th>
                    <th>Type</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody data-gf-table-body></tbody>
              </table>
            </div>
          </div>

          <aside class="gf-form-card">
            <form class="gf-form" data-gf-form novalidate>

              <div class="gf-toggle-wrap">
                <button type="button" class="gf-toggle-btn active" data-gf-type="recurrent">Annuel</button>
                <button type="button" class="gf-toggle-btn" data-gf-type="exceptionnel">Exceptionnel</button>
              </div>

              <label class="gf-field">
                <span data-gf-date-label>Date :</span>
                <input
                  type="date"
                  name="date"
                  required
                  data-gf-date-input
                />
              </label>

              <label class="gf-field">
                <span>Motif :</span>
                <input type="text" name="motif" maxlength="80" required placeholder="Ex : Noël, inventaire…" />
              </label>

              <input type="hidden" name="recurrent" value="1" />
              <button type="submit" class="gf-submit-btn">Ajouter jour férié</button>
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

    // ── Toggle récurrent / exceptionnel ──
    const toggleBtns = root.querySelectorAll("[data-gf-type]");
    const hiddenRec = root.querySelector('input[name="recurrent"]');
    const dateInput = root.querySelector("[data-gf-date-input]");
    const dateLabel = root.querySelector("[data-gf-date-label]");

    function setDateInputMode(recurrent) {
      if (!dateInput) return;
      dateInput.value = "";

      if (recurrent) {
        dateInput.type = "date";
        dateInput.classList.add("gf-annual-date");
        // Lock year to a fixed leap year: user picks day/month only.
        dateInput.min = "2000-01-01";
        dateInput.max = "2000-12-31";
        if (dateLabel) dateLabel.textContent = "Date :";
      } else {
        dateInput.type = "date";
        dateInput.classList.remove("gf-annual-date");
        dateInput.removeAttribute("min");
        dateInput.removeAttribute("max");
        if (dateLabel) dateLabel.textContent = "Date :";
      }
    }

    // Default mode = annuel.
    setDateInputMode(true);

    toggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const recurrent = btn.dataset.gfType === "recurrent";
        if (hiddenRec) {
          hiddenRec.value = recurrent ? "1" : "0";
        }
        setDateInputMode(recurrent);
      });
    });

    // ── Soumission du formulaire ──
    const form = root.querySelector("[data-gf-form]");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const state = states.get(id);
      if (!state) return;

      const submit = form.querySelector(".gf-submit-btn");
      const data = new FormData(form);
      const rawDate = String(data.get("date") || "").trim();
      const motif = String(data.get("motif") || "").trim();
      const recurrent = String(data.get("recurrent")) === "1";
      const date = recurrent ? toMonthDayForApi(rawDate) : rawDate;

      if (!date || !motif) {
        Toast.warn(
          recurrent
            ? "Veuillez sélectionner une date (jour/mois) et un motif"
            : "Veuillez renseigner la date et le motif",
        );
        return;
      }

      const confirmAdd = await confirmAction(
        "question",
        recurrent ? "Ajouter un jour annuel ?" : "Ajouter un jour exceptionnel ?",
        recurrent
          ? "Ce jour de fermeture sera répété chaque année."
          : "Ce jour de fermeture sera ajouté une seule fois.",
        "Confirmer l'ajout",
      );
      if (!confirmAdd.isConfirmed) return;

      if (submit) submit.disabled = true;
      try {
        const created = await Requetes.createFermeture({
          date_fermeture: date,
          motif,
          recurrent,
        });
        const row = normalizeRow(created?.fermeture ?? created);
        if (row.id > 0) {
          state.rows.push(row);
          sortRows(state.rows);
        }
        // Always re-render from state
        renderTable(root, state.rows);
        form.reset();
        // Reset toggle to default (récurrent)
        toggleBtns.forEach((b) => b.classList.remove("active"));
        const recBtn = root.querySelector('[data-gf-type="recurrent"]');
        if (recBtn) recBtn.classList.add("active");
        if (hiddenRec) hiddenRec.value = "1";
        setDateInputMode(true);
        Toast.ok("Jour férié ajouté");
      } catch (error) {
        Toast.err(error.message || "Ajout impossible");
      } finally {
        if (submit) submit.disabled = false;
      }
    });

    // ── Suppression ──
    root.addEventListener("click", async (event) => {
      const btn = event.target.closest("[data-gf-delete]");
      if (!btn) return;

      const state = states.get(id);
      if (!state) return;

      const rowId = Number(btn.dataset.gfDelete || 0);
      if (rowId <= 0) return;
      const row = state.rows.find((item) => item.id === rowId);

      const confirmDelete = await confirmAction(
        "warning",
        "Supprimer ce jour de fermeture ?",
        row
          ? `${row.motif} — ${toFrDate(row.date, row.recurrent)}`
          : "Cette action est irréversible.",
        "Supprimer",
      );
      if (!confirmDelete.isConfirmed) return;

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
  label: "Jours fermetures boutique",
  icon: "JFB",
  sprint: 6,
  fullscreenMinWidth: 860,
  fullscreenMinHeight: 540,
  gerantOnly: true,
  buildHTML() {
    return GerantFermeturesPanel.buildHTML();
  },
  onMount(id) {
    GerantFermeturesPanel.onMount(id);
  },
});
