/** panels/gerant/incidents.js — Fiches incident (US11) */
const IncidentPanel = (() => {
  const swalBase = {
    customClass: {
      popup: "fi-swal-popup",
      title: "fi-swal-title",
      htmlContainer: "fi-swal-text",
      confirmButton: "fi-swal-btn",
      cancelButton: "fi-swal-btn fi-swal-btn--secondary",
    },
    buttonsStyling: false,
    reverseButtons: false,
    backdrop: "rgba(26, 26, 46, 0.45)",
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatDateDisplay(value) {
    const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return String(value ?? "");
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  function formatTimeDisplay(value) {
    const match = String(value ?? "").match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) return String(value ?? "");
    return `${match[1]}:${match[2]}:${match[3] ?? "00"}`;
  }

  function buildCurrentDate() {
    const now = new Date();
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
  }

  function buildCurrentTime() {
    const now = new Date();
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  }

  function isValidDate(value) {
    const match = String(value ?? "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  function isValidTime(value) {
    return /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.test(
      String(value ?? "").trim(),
    );
  }

  function buildHTML() {
    return `
      <div class="fi-panel">
        <div class="fi-table-wrap">
          <table class="fi-table">
            <thead>
              <tr>
                <th class="fi-col fi-col--num">Numéro</th>
                <th class="fi-col fi-col--date">Date</th>
                <th class="fi-col fi-col--time">Heure</th>
                <th class="fi-col fi-col--type">Type</th>
                <th class="fi-col fi-col--detail">Détail Technique</th>
                <th class="fi-col fi-col--solution">Solution</th>
              </tr>
            </thead>
            <tbody class="fi-body">
              <tr>
                <td class="fi-state" colspan="6">Chargement...</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="fi-footer">
          <button type="button" class="fi-create-btn">
            Créer une nouvelle fiche incident
          </button>
        </div>
      </div>
    `;
  }

  function render(root, data) {
    const body = root.querySelector(".fi-body");
    if (!body) return;

    const incidents = Array.isArray(data?.incidents) ? data.incidents : [];
    root._fiNextReference = Number(data?.next_reference || 1);

    if (incidents.length === 0) {
      body.innerHTML = `
        <tr>
          <td class="fi-state" colspan="6">Aucune fiche incident enregistrée</td>
        </tr>
      `;
      return;
    }

    body.innerHTML = incidents
      .map(
        (incident) => `
          <tr>
            <td class="fi-cell fi-cell--num">${escapeHtml(incident.id_ref_unique)}</td>
            <td class="fi-cell">${escapeHtml(formatDateDisplay(incident.date_creation))}</td>
            <td class="fi-cell">${escapeHtml(formatTimeDisplay(incident.heure_creation))}</td>
            <td class="fi-cell fi-cell--type">${escapeHtml(incident.type_incident)}</td>
            <td class="fi-cell fi-cell--truncate" title="${escapeHtml(incident.detail_tech)}">${escapeHtml(incident.detail_tech)}</td>
            <td class="fi-cell fi-cell--truncate" title="${escapeHtml(incident.solution)}">${escapeHtml(incident.solution)}</td>
          </tr>
        `,
      )
      .join("");
  }

  function renderError(root, message) {
    const body = root.querySelector(".fi-body");
    if (!body) return;

    body.innerHTML = `
      <tr>
        <td class="fi-state fi-state--error" colspan="6">${escapeHtml(message)}</td>
      </tr>
    `;
  }

  function setLoading(root, loading) {
    const button = root.querySelector(".fi-create-btn");
    if (!button) return;

    button.disabled = loading;
    button.textContent = loading ? "Chargement..." : "Créer une nouvelle fiche incident";
  }

  async function refresh(root) {
    setLoading(root, true);
    try {
      const response = await Requetes.getIncidents();
      render(root, response || {});
    } catch (error) {
      renderError(root, error.message || "Chargement impossible");
    } finally {
      setLoading(root, false);
    }
  }

  function buildFormHtml(reference) {
    return `
      <div class="fi-form">
        <label class="fi-form-row">
          <span class="fi-form-label">Référence Unique</span>
          <input id="fi-ref" class="fi-form-input fi-form-input--readonly" type="text" value="${escapeHtml(reference)}" readonly />
        </label>

        <label class="fi-form-row">
          <span class="fi-form-label">Date</span>
          <input id="fi-date" class="fi-form-input" type="text" value="${escapeHtml(buildCurrentDate())}" />
        </label>

        <label class="fi-form-row">
          <span class="fi-form-label">Heure</span>
          <input id="fi-time" class="fi-form-input" type="text" value="${escapeHtml(buildCurrentTime())}" />
        </label>

        <label class="fi-form-row">
          <span class="fi-form-label">Type</span>
          <input id="fi-type" class="fi-form-input" type="text" placeholder="Accident Travail" />
        </label>

        <label class="fi-form-row fi-form-row--textarea">
          <span class="fi-form-label">Détail Technique</span>
          <textarea id="fi-detail" class="fi-form-textarea" placeholder="Détail technique..."></textarea>
        </label>

        <label class="fi-form-row fi-form-row--textarea">
          <span class="fi-form-label">Solution</span>
          <textarea id="fi-solution" class="fi-form-textarea" placeholder="Solution..."></textarea>
        </label>
      </div>
    `;
  }

  async function showCancelled() {
    await Swal.fire({
      ...swalBase,
      icon: "error",
      title: "Opération Annulée",
      confirmButtonText: "Fermer",
      allowOutsideClick: false,
    });
  }

  async function showSuccess(incident) {
    await Swal.fire({
      ...swalBase,
      icon: "success",
      title: `Fiche incident #${incident.id_ref_unique} a été créée`,
      confirmButtonText: "Fermer",
      allowOutsideClick: false,
    });
  }

  async function showSaveError(message) {
    await Swal.fire({
      ...swalBase,
      icon: "error",
      title: "Création impossible",
      html: escapeHtml(message || "Impossible d'enregistrer la fiche incident"),
      confirmButtonText: "Fermer",
      allowOutsideClick: false,
    });
  }

  async function openCreatePopup(root) {
    try {
      const response = await Requetes.getIncidents();
      render(root, response || {});
    } catch (_) {
    }

    const result = await Swal.fire({
      ...swalBase,
      html: buildFormHtml(root._fiNextReference || 1),
      showCloseButton: true,
      showCancelButton: true,
      cancelButtonText: "Annuler",
      confirmButtonText: "Confirmer",
      allowOutsideClick: false,
      focusConfirm: false,
      preConfirm: () => {
        const popup = Swal.getPopup();
        const dateCreation = popup.querySelector("#fi-date")?.value.trim() || "";
        const heureCreation = popup.querySelector("#fi-time")?.value.trim() || "";
        const typeIncident = popup.querySelector("#fi-type")?.value.trim() || "";
        const detailTech = popup.querySelector("#fi-detail")?.value.trim() || "";
        const solution = popup.querySelector("#fi-solution")?.value.trim() || "";

        if (
          !dateCreation ||
          !heureCreation ||
          !typeIncident ||
          !detailTech ||
          !solution
        ) {
          Swal.showValidationMessage("Merci de renseigner tous les champs");
          return false;
        }

        if (!isValidDate(dateCreation)) {
          Swal.showValidationMessage("La date doit être au format JJ/MM/AAAA");
          return false;
        }

        if (!isValidTime(heureCreation)) {
          Swal.showValidationMessage("L'heure doit être au format HH:MM ou HH:MM:SS");
          return false;
        }

        return {
          date_creation: dateCreation,
          heure_creation: heureCreation,
          type_incident: typeIncident,
          detail_tech: detailTech,
          solution,
        };
      },
      didOpen: (popup) => {
        popup.querySelector("#fi-type")?.focus();
      },
    });

    if (!result.isConfirmed) {
      await showCancelled();
      return;
    }

    try {
      const response = await Requetes.creerIncident(result.value);
      const incident = response.incident || response;
      await refresh(root);
      await showSuccess(incident);
    } catch (error) {
      await showSaveError(error.message);
    }
  }

  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    root._fiNextReference = 1;

    root.querySelector(".fi-create-btn")?.addEventListener("click", () => {
      void openCreatePopup(root);
    });

    void refresh(root);
  }

  return { buildHTML, onMount };
})();

WM.register("gerant_incidents", {
  label: "INC Fiches Incident",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return IncidentPanel.buildHTML();
  },
  onMount(id) {
    IncidentPanel.onMount(id);
  },
});
