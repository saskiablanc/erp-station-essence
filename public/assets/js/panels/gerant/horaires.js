/** panels/gerant/horaires.js — Modification Horaires Boutique (US15) */
const HorairesBoutiquePanel = (() => {
  const swalBase = {
    customClass: {
      popup: "hb-swal-popup",
      title: "hb-swal-title",
      htmlContainer: "hb-swal-text",
      confirmButton: "hb-swal-btn",
      cancelButton: "hb-swal-btn hb-swal-btn--secondary",
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

  function formatDisplayTime(value) {
    const time = String(value ?? "").trim();
    const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
    if (!match) return time;
    return `${match[1]}h${match[2]}`;
  }

  function normalizeDisplayTime(value) {
    const time = String(value ?? "").trim();
    if (/^([01]\d|2[0-3])h([0-5]\d)$/.test(time)) return time;

    const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
    if (!match) return null;
    return `${match[1]}h${match[2]}`;
  }

  function dayCardHtml(day) {
    return `
      <div class="hb-day" data-jour-id="${escapeHtml(day.id_jour)}" data-libelle="${escapeHtml(day.libelle)}">
        <div class="hb-day-title">${escapeHtml(day.libelle)}</div>

        <label class="hb-field">
          <span class="hb-field-label">Ouverture :</span>
          <input
            type="text"
            class="hb-input hb-input-ouverture"
            value="${escapeHtml(formatDisplayTime(day.heure_ouverture))}"
            inputmode="numeric"
          />
        </label>

        <label class="hb-field">
          <span class="hb-field-label">Fermeture :</span>
          <input
            type="text"
            class="hb-input hb-input-fermeture"
            value="${escapeHtml(formatDisplayTime(day.heure_fermeture))}"
            inputmode="numeric"
          />
        </label>

        <label class="hb-closed-toggle">
          <span>Jour fermé</span>
          <input type="checkbox" class="hb-checkbox" ${day.est_ferme ? "checked" : ""} />
        </label>
      </div>
    `;
  }

  function buildHTML() {
    return `
      <div class="hb-panel">
        <div class="hb-grid-wrap">
          <div class="hb-grid"></div>
        </div>
        <div class="hb-footer">
          <button type="button" class="hb-submit">Valider</button>
        </div>
      </div>
    `;
  }

  function render(root, horaires) {
    const grid = root.querySelector(".hb-grid");
    if (!grid) return;

    root._hbInitialByDay = {};
    horaires.forEach((day) => {
      root._hbInitialByDay[String(day.id_jour)] = {
        ouverture: formatDisplayTime(day.heure_ouverture),
        fermeture: formatDisplayTime(day.heure_fermeture),
        est_ferme: !!day.est_ferme,
        libelle: day.libelle,
      };
    });

    grid.innerHTML = horaires.map(dayCardHtml).join("");
    root.querySelectorAll(".hb-day").forEach((card) => syncClosedState(card));
    setLoading(root, false);
  }

  function setLoading(root, loading) {
    const submit = root.querySelector(".hb-submit");
    if (!submit) return;
    submit.disabled = loading;
    submit.textContent = loading ? "..." : "Valider";
  }

  function syncClosedState(card) {
    const checkbox = card.querySelector(".hb-checkbox");
    const ouverture = card.querySelector(".hb-input-ouverture");
    const fermeture = card.querySelector(".hb-input-fermeture");
    if (!checkbox || !ouverture || !fermeture) return;

    const isClosed = checkbox.checked;
    card.classList.toggle("is-closed", isClosed);
    ouverture.disabled = isClosed;
    fermeture.disabled = isClosed;
  }

  async function refresh(root) {
    setLoading(root, true);
    try {
      const horaires = await Requetes.getHorairesBoutique();
      render(root, Array.isArray(horaires) ? horaires : []);
    } catch (error) {
      const grid = root.querySelector(".hb-grid");
      if (grid) {
        grid.innerHTML = `<div class="hb-state hb-state--error">${escapeHtml(error.message || "Chargement impossible")}</div>`;
      }
      setLoading(root, false);
    }
  }

  function collectPayload(root) {
    const payload = [];

    root.querySelectorAll(".hb-day").forEach((card) => {
      const idJour = Number(card.dataset.jourId || 0);
      const libelle = String(card.dataset.libelle || "");
      const ouvertureInput = card.querySelector(".hb-input-ouverture");
      const fermetureInput = card.querySelector(".hb-input-fermeture");
      const checkbox = card.querySelector(".hb-checkbox");

      const ouverture = normalizeDisplayTime(ouvertureInput?.value ?? "");
      const fermeture = normalizeDisplayTime(fermetureInput?.value ?? "");

      payload.push({
        id_jour: idJour,
        libelle,
        heure_ouverture: ouverture,
        heure_fermeture: fermeture,
        est_ferme: !!checkbox?.checked,
      });
    });

    return payload;
  }

  function getModifiedDays(root, payload) {
    return payload.filter((day) => {
      const initial = root._hbInitialByDay?.[String(day.id_jour)];
      if (!initial) return true;
      return (
        day.heure_ouverture !== initial.ouverture ||
        day.heure_fermeture !== initial.fermeture ||
        day.est_ferme !== initial.est_ferme
      );
    });
  }

  function resolveBaseDay(root, modifiedDays) {
    const activeDayId = Number(root._hbActiveDayId || 0);
    const activeDay = modifiedDays.find((day) => day.id_jour === activeDayId);
    return activeDay || modifiedDays[0];
  }

  async function showInvalidError() {
    await Swal.fire({
      ...swalBase,
      icon: "error",
      title: "Erreur : Valeurs Incorrectes.",
      html: "Les nouveaux horaires n’ont pas pu être enregistrés !",
      confirmButtonText: "Fermer",
    });
  }

  function formatDaysLabel(days) {
    const labels = [
      ...new Set(
        days
          .filter((day) => !day.est_ferme)
          .map((day) => String(day.libelle || "").trim())
          .filter(Boolean),
      ),
    ];

    if (labels.length === 0) return "les jours concernés";
    if (labels.length === 7) return "tous les jours";
    if (labels.length === 1) return `le ${labels[0]}`;
    if (labels.length === 2) return `${labels[0]} et ${labels[1]}`;

    return `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
  }

  async function showSuccess(days) {
    await Swal.fire({
      ...swalBase,
      icon: "success",
      title: `Nouveaux horaires bien enregistrés pour ${formatDaysLabel(days)} !`,
      confirmButtonText: "Fermer",
    });
  }

  async function confirmSave(days) {
    return Swal.fire({
      ...swalBase,
      icon: "question",
      title: "Confirmer les nouveaux horaires ?",
      text:
        "Les horaires seront enregistrés pour " + formatDaysLabel(days) + ".",
      showCancelButton: true,
      confirmButtonText: "Confirmer",
      cancelButtonText: "Annuler",
      allowOutsideClick: false,
    });
  }

  async function onValidate(root) {
    const payload = collectPayload(root);
    const modifiedDays = getModifiedDays(root, payload);

    if (modifiedDays.length === 0) {
      Toast.warn("Aucune modification détectée");
      return;
    }

    const invalidDay = payload.find(
      (day) => !day.heure_ouverture || !day.heure_fermeture,
    );
    if (invalidDay) {
      await showInvalidError();
      return;
    }

    const confirmation = await confirmSave(modifiedDays);
    if (!confirmation.isConfirmed) return;

    setLoading(root, true);
    try {
      const response = await Requetes.updateHorairesBoutique(modifiedDays);
      render(root, response.horaires || []);
      await showSuccess(modifiedDays);
    } catch (error) {
      setLoading(root, false);
      await showInvalidError();
    }
  }

  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    root._hbInitialByDay = {};
    root._hbActiveDayId = 0;

    root.addEventListener("input", (event) => {
      const card = event.target.closest(".hb-day");
      if (!card) return;
      root._hbActiveDayId = Number(card.dataset.jourId || 0);
    });

    root.addEventListener("change", (event) => {
      const card = event.target.closest(".hb-day");
      if (card) {
        root._hbActiveDayId = Number(card.dataset.jourId || 0);
      }
      const checkbox = event.target.closest(".hb-checkbox");
      if (!checkbox) return;
      if (card) syncClosedState(card);
    });

    root.querySelector(".hb-submit")?.addEventListener("click", () => {
      void onValidate(root);
    });

    void refresh(root);
  }

  return { buildHTML, onMount };
})();

WM.register("gerant_horaires", {
  label: "HBT Modification Horaires Boutique",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return HorairesBoutiquePanel.buildHTML();
  },
  onMount(id) {
    HorairesBoutiquePanel.onMount(id);
  },
});
