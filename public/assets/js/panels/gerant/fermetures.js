/** panels/gerant/fermetures.js — Jours de fermetures de la boutique (US15) */
const GerantFermeturesPanel = (() => {
  const panelStates = new Map();

  function toFrDate(isoDate) {
    if (!isoDate || !isoDate.includes("-")) return "—";
    const [year, month, day] = isoDate.split("-");
    if (!year || !month || !day) return "—";
    return `${day}/${month}/${year}`;
  }

  function toIsoDate(rawValue) {
    const value = String(rawValue || "").trim();
    if (!value) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }

    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;

    const dt = new Date(year, month - 1, day);
    if (
      dt.getFullYear() !== year ||
      dt.getMonth() !== month - 1 ||
      dt.getDate() !== day
    ) {
      return null;
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function applyDateMask(input) {
    if (!input) return;

    input.addEventListener("input", () => {
      const digits = input.value.replace(/\D/g, "").slice(0, 8);
      if (digits.length <= 2) {
        input.value = digits;
      } else if (digits.length <= 4) {
        input.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        input.value = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
      }
    });
  }

  function initNativeDatePicker(root) {
    const textInput = root.querySelector("[data-gf-date-input]");
    const openBtn = root.querySelector("[data-gf-date-btn]");
    if (!textInput || !openBtn) return;

    const openPicker = async () => {
      const iso = toIsoDate(textInput.value);
      const result = await Swal.fire({
        title: "Choisir une date",
        html: `<input type="date" id="gf-swal-date" class="swal2-input" value="${iso ?? ""}" />`,
        showCancelButton: true,
        confirmButtonText: "Valider",
        cancelButtonText: "Annuler",
        customClass: {
          popup: "gf-swal-popup",
          title: "gf-swal-title",
          htmlContainer: "gf-swal-text",
          confirmButton: "gf-swal-btn",
          cancelButton: "gf-swal-btn gf-swal-btn-secondary",
        },
        buttonsStyling: false,
        preConfirm: () => {
          const picker = document.getElementById("gf-swal-date");
          return picker ? picker.value : "";
        },
      });

      const selected = String(result.value || "").trim();
      if (result.isConfirmed && selected) {
        textInput.value = toFrDate(selected);
      }
    };

    openBtn.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    openBtn.addEventListener("click", () => {
      void openPicker();
    });
    textInput.addEventListener("keydown", (event) => {
      if (event.altKey && event.key === "ArrowDown") {
        event.preventDefault();
        void openPicker();
      }
    });
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

  function normalizeRow(raw) {
    return {
      id: Number(raw?.id_fermeture ?? raw?.id ?? 0),
      date: String(raw?.date_fermeture ?? raw?.date ?? ""),
      motif: String(raw?.motif ?? ""),
    };
  }

  async function loadRows(id, root) {
    const state = panelStates.get(id);
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
      Toast.err(error.message || "Chargement des fermetures impossible");
    }
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
                <div class="gf-date-wrap">
                  <input
                    type="text"
                    name="date"
                    data-gf-date-input
                    required
                    maxlength="10"
                    inputmode="numeric"
                    placeholder="jj/mm/aaaa"
                  />
                  <button type="button" class="gf-date-btn" data-gf-date-btn aria-label="Ouvrir le calendrier"></button>
                </div>
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
      rows: [],
    };
    panelStates.set(id, state);
    renderTable(root, state.rows);
    void loadRows(id, root);

    const form = root.querySelector("[data-gf-form]");
    const dateInput = root.querySelector('input[name="date"]');
    applyDateMask(dateInput);
    initNativeDatePicker(root);

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      const current = panelStates.get(id);
      if (!current) return;

      const data = new FormData(form);
      const dateRaw = String(data.get("date") || "").trim();
      const motif = String(data.get("motif") || "").trim();
      const date = toIsoDate(dateRaw);

      if (!dateRaw || !motif) {
        Toast.warn("Veuillez renseigner la date et le motif");
        return;
      }

      if (!date) {
        Toast.warn("Format de date invalide (jj/mm/aaaa)");
        return;
      }

      const duplicateLocal = current.rows.some(
        (row) => row.date === date && row.motif.toLowerCase() === motif.toLowerCase(),
      );
      if (duplicateLocal) {
        Toast.warn("Ce jour de fermeture existe déjà");
        return;
      }

      const submitButton = form.querySelector(".gf-submit-btn");
      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const created = await Requetes.createFermeture({
          date_fermeture: date,
          motif,
        });
        const row = normalizeRow(created?.fermeture ?? created);
        if (row.id > 0) {
          current.rows.push(row);
          sortRows(current.rows);
          renderTable(root, current.rows);
        } else {
          await loadRows(id, root);
        }
        form.reset();
        Toast.ok("Jour de fermeture ajouté");
      } catch (error) {
        Toast.err(error.message || "Ajout impossible");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });

    root.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-gf-delete]");
      if (!button) return;

      const current = panelStates.get(id);
      if (!current) return;

      const rowId = Number(button.dataset.gfDelete || 0);
      if (rowId <= 0) return;

      try {
        await Requetes.deleteFermeture(rowId);
        current.rows = current.rows.filter((row) => row.id !== rowId);
        panelStates.set(id, current);
        renderTable(root, current.rows);
        Toast.ok("Jour de fermeture supprimé");
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
