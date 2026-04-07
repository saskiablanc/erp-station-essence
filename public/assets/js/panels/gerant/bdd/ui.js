/** panels/gerant/bdd/ui.js */
(() => {
  const ns = (window.BddPanelModules = window.BddPanelModules || {});
  const {
    GROUPS,
    SCHEMAS,
    LOCKED_TABLES,
    ICON_EDIT,
    ICON_DELETE,
    ICON_LOCK,
    ICON_PIN,
    esc,
    rowDate,
    getLockedDates,
    isPinnedTable,
    sortGroups,
  } = ns;
const ARCHIVE_YEARS = ["2021", "2022", "2023", "2024", "2025"];
const PROFILE_TABLE_SCOPES = {
  archive: [
    "transaction",
    "transaction_cce",
    "transaction_produit",
    "transaction_energie",
    "recu",
    "fiche_incident",
    "validation_transactions",
    "validation_incidents",
  ],
};

function getProfileForRoot(root) {
  return (
    root?._bddProfile ||
    (typeof Requetes !== "undefined" && Requetes.bddGetProfile
      ? Requetes.bddGetProfile()
      : "courante")
  );
}

function getScopedVisibleTables(profile, visibleTables = null) {
  const scoped = PROFILE_TABLE_SCOPES[String(profile || "").trim()];
  if (!Array.isArray(scoped) || !scoped.length) {
    return Array.isArray(visibleTables) ? visibleTables : null;
  }

  const scopeSet = new Set(
    scoped.map((id) => String(id || "").trim()).filter(Boolean),
  );
  if (!Array.isArray(visibleTables)) {
    return Array.from(scopeSet);
  }
  return visibleTables.filter((id) => scopeSet.has(String(id || "").trim()));
}

function isReadOnlyProfile(root) {
  const profile = getProfileForRoot(root);
  return profile !== "courante";
}

function getGroupsForRoot(root) {
  const visible = Array.isArray(root?._bddVisibleTables)
    ? root._bddVisibleTables
    : null;
  const groups = sortGroups(GROUPS);
  if (visible === null) return groups;
  const visibleSet = new Set(visible.map((id) => String(id || "").trim()));
  return groups.filter((group) => visibleSet.has(group.id));
}

function profileLabel(profile) {
  const value = String(profile || "").trim();
  if (value === "courante") return "Courante";
  if (value === "archive") return "Archive";
  if (!value) return "Courante";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function applyProfileMode(root) {
  const tableId = String(root?._bddTable || "").trim();
  const schema = SCHEMAS[tableId] || null;
  const addBtn = root.querySelector(".bdd-add-btn");
  const readOnly = isReadOnlyProfile(root);
  const yearWrap = root.querySelector(".bdd-year-wrap");

  if (addBtn) {
    addBtn.style.display = schema?.canAdd && !readOnly ? "" : "none";
  }
  if (yearWrap) {
    yearWrap.style.display = readOnly ? "inline-flex" : "none";
  }
  root.classList.toggle("bdd-readonly", readOnly);
}

async function refreshVisibleTables(root) {
  const profile = getProfileForRoot(root);
  let visible = getScopedVisibleTables(profile);
  try {
    const resp = await Requetes.bddTables();
    if (Array.isArray(resp?.tables)) {
      const fromApi = resp.tables
        .map((id) => String(id || "").trim())
        .filter(Boolean);
      visible = getScopedVisibleTables(profile, fromApi);
    }
  } catch (_) {}

  root._bddVisibleTables = Array.isArray(visible) ? visible : null;

  const groups = getGroupsForRoot(root);
  if (!groups.some((g) => g.id === root._bddTable)) {
    root._bddTable = groups[0]?.id || "";
  }
  renderNav(root);
}

async function initProfileSelector(root) {
  const select = root.querySelector(".bdd-profile-select");
  const yearSelect = root.querySelector(".bdd-year-select");
  if (!select) return;

  let profiles = ["courante"];
  try {
    const resp = await Requetes.bddProfiles();
    if (Array.isArray(resp?.profiles) && resp.profiles.length > 0) {
      profiles = resp.profiles.map((p) => String(p || "").trim()).filter(Boolean);
    }
  } catch (_) {}

  if (!profiles.length) profiles = ["courante"];

  const current = Requetes.bddSetProfile(Requetes.bddGetProfile());
  const selected = profiles.includes(current)
    ? current
    : profiles.includes("courante")
      ? "courante"
      : profiles[0];

  root._bddProfile = selected;
  Requetes.bddSetProfile(selected);

  if (yearSelect) {
    yearSelect.innerHTML = ARCHIVE_YEARS
      .map((year) => `<option value="${esc(year)}">${esc(year)}</option>`)
      .join("");
    const currentYear = Requetes.bddGetYear();
    const selectedYear = ARCHIVE_YEARS.includes(currentYear)
      ? currentYear
      : ARCHIVE_YEARS[ARCHIVE_YEARS.length - 1];
    root._bddYear = Requetes.bddSetYear(selectedYear);
    yearSelect.value = selectedYear;

    yearSelect.addEventListener("change", () => {
      const nextYear = String(yearSelect.value || ARCHIVE_YEARS[0]);
      root._bddYear = Requetes.bddSetYear(nextYear);
      void loadTable(root);
    });
  }

  select.innerHTML = profiles
    .map(
      (profile) =>
        `<option value="${esc(profile)}">${esc(profileLabel(profile))}</option>`,
    )
    .join("");
  select.value = selected;
  applyProfileMode(root);

  select.addEventListener("change", () => {
    const next = String(select.value || "courante").trim() || "courante";
    root._bddProfile = Requetes.bddSetProfile(next);
    if (yearSelect) {
      const currentYear = Requetes.bddGetYear();
      const selectedYear = ARCHIVE_YEARS.includes(currentYear)
        ? currentYear
        : ARCHIVE_YEARS[ARCHIVE_YEARS.length - 1];
      root._bddYear = Requetes.bddSetYear(selectedYear);
      yearSelect.value = selectedYear;
    }
    void (async () => {
      await refreshVisibleTables(root);
      applyProfileMode(root);
      await loadTable(root);
    })();
  });
}

function buildNavHTML(activeTable, groups = sortGroups(GROUPS)) {
  return groups
    .map(function (group) {
      const active = group.id === activeTable;
      const pinned = isPinnedTable(group.id);
      return `
        <div class="bdd-tab-item${active ? " is-active" : ""}${pinned ? " is-pinned" : ""}">
          <button class="bdd-tab${active ? " active" : ""}" data-table="${group.id}" type="button">${group.label}</button>
          <button
            class="bdd-pin-btn${pinned ? " active" : ""}"
            data-pin-table="${group.id}"
            type="button"
            title="${pinned ? "Désépingler" : "Épingler"}"
            aria-label="${pinned ? "Désépingler" : "Épingler"} ${group.label}"
          >${ICON_PIN}</button>
        </div>
      `;
    })
    .join("");
}

function getDefaultTableId() {
  const first = sortGroups(GROUPS)[0];
  return first?.id || "produit";
}

function renderNav(root) {
  const nav = root.querySelector(".bdd-nav");
  if (!nav) return;
  const groups = getGroupsForRoot(root);
  if (groups.length === 0) {
    root._bddTable = "";
    nav.innerHTML = "";
    return;
  }

  const activeTable =
    root._bddTable && SCHEMAS[root._bddTable] && groups.some((g) => g.id === root._bddTable)
      ? root._bddTable
      : groups[0]?.id || getDefaultTableId();

  root._bddTable = activeTable;
  nav.innerHTML = buildNavHTML(activeTable, groups);
}

function buildHTML() {
  return `
    <div class="bdd-panel">
      <div class="bdd-nav">${buildNavHTML("produit")}</div>
      <div class="bdd-content">
        <div class="bdd-toolbar">
          <div class="bdd-toolbar-left">
            <span class="bdd-profile-label">Base :</span>
            <select class="bdd-profile-select" aria-label="Choix base de données"></select>
            <div class="bdd-year-wrap" style="display:none">
              <span class="bdd-profile-label">Année :</span>
              <select class="bdd-year-select" aria-label="Choix année archive"></select>
            </div>
          </div>
          <button class="bdd-add-btn">+ Ajouter Ligne</button>
        </div>
        <div class="bdd-table-wrap">
          <div class="bdd-table-center">
            <table class="bdd-table">
              <thead><tr class="bdd-thead-row"></tr></thead>
              <tbody class="bdd-tbody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════
//  Rendu tableau
// ════════════════════════════════════════════════════════
function renderTable(root, schema, rows, lockedDates) {
  const tableId = String(root?._bddTable || "").trim();
  const thead = root.querySelector(".bdd-thead-row");
  const tbody = root.querySelector(".bdd-tbody");
  if (!thead || !tbody) return;

  const readOnly = isReadOnlyProfile(root);
  const showAct = !readOnly && (schema.canEdit || schema.canDel);
  thead.innerHTML =
    schema.cols
      .map(
        (c) =>
          `<th class="bdd-th" ${c.w ? `style="width:${c.w}"` : ""}>${c.label}</th>`,
      )
      .join("") +
    (showAct ? '<th class="bdd-th bdd-th--actions">Actions</th>' : "");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td class="bdd-empty" colspan="${schema.cols.length + (showAct ? 1 : 0)}">Aucune entrée</td></tr>`;
    return;
  }
  tbody.innerHTML = rows
    .map((r) => {
      const key = schema.rowKey(r);
      const k = esc(String(key));

      // Déterminer si la ligne est verrouillée selon le type de table
      let locked = false;
      if (lockedDates && LOCKED_TABLES.has(tableId)) {
        const d = rowDate(tableId, r);
        if (d) {
          if (tableId === "fiche_incident") {
            locked = lockedDates.inc.has(d);
          } else {
            locked = lockedDates.tx.has(d);
          }
        }
        // Pour tx_produit / tx_energie : pas de date dans la row — garde serveur uniquement
      }

      let act = "";
      if (showAct) {
        if (locked) {
          act = `<td class="bdd-td bdd-td--actions">${ICON_LOCK}</td>`;
        } else {
          act = `<td class="bdd-td bdd-td--actions">
      ${schema.canEdit ? `<button class="bdd-action-btn bdd-edit-btn" data-key="${k}" title="Modifier">${ICON_EDIT}</button>` : ""}
      ${schema.canDel ? `<button class="bdd-action-btn bdd-del-btn"  data-key="${k}" title="Supprimer">${ICON_DELETE}</button>` : ""}
    </td>`;
        }
      }
      return `<tr class="bdd-row${locked ? " bdd-row--locked" : ""}" data-key="${k}">${schema
        .rowHtml(r)
        .map((c) => `<td class="bdd-td">${c}</td>`)
        .join("")}${act}</tr>`;
    })
    .join("");
}

function setLoading(root, on) {
  root
    .querySelectorAll(".bdd-add-btn,.bdd-edit-btn,.bdd-del-btn,.bdd-profile-select,.bdd-year-select")
    .forEach((b) => (b.disabled = on));
}

async function loadTable(root) {
  const tableId = String(root?._bddTable || "").trim();
  const schema = SCHEMAS[tableId];
  const tbody = root.querySelector(".bdd-tbody");
  if (tbody)
    tbody.innerHTML = `<tr><td class="bdd-empty" colspan="10">Chargement…</td></tr>`;
  applyProfileMode(root);
  setLoading(root, true);
  try {
    if (!schema) {
      if (tbody) {
        tbody.innerHTML =
          '<tr><td class="bdd-empty" colspan="10">Aucune table disponible pour ce profil.</td></tr>';
      }
      return;
    }

    const needsLock = !isReadOnlyProfile(root) && LOCKED_TABLES.has(tableId);
    const [resp, lockedDates] = await Promise.all([
      schema.load(),
      needsLock ? getLockedDates() : Promise.resolve(null),
    ]);
    const rows = resp[schema.dataKey] || resp.rows || [];
    root._bddRows = rows;
    renderTable(root, schema, rows, lockedDates);
    applyProfileMode(root);
  } catch (e) {
    if (tbody)
      tbody.innerHTML = `<tr><td class="bdd-empty bdd-empty--err" colspan="10">${esc(e.message)}</td></tr>`;
  } finally {
    setLoading(root, false);
  }
}

// ════════════════════════════════════════════════════════
//  Popup ajout
// ════════════════════════════════════════════════════════


  Object.assign(ns, {
    buildHTML,
    buildNavHTML,
    getDefaultTableId,
    initProfileSelector,
    refreshVisibleTables,
    applyProfileMode,
    getGroupsForRoot,
    renderNav,
    renderTable,
    setLoading,
    loadTable,
  });
})();
