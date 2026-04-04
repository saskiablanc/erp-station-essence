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

function buildNavHTML(activeTable) {
  return sortGroups(GROUPS)
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

  const activeTable =
    root._bddTable && SCHEMAS[root._bddTable]
      ? root._bddTable
      : getDefaultTableId();

  root._bddTable = activeTable;
  nav.innerHTML = buildNavHTML(activeTable);
}

function buildHTML() {
  return `
    <div class="bdd-panel">
      <div class="bdd-nav">${buildNavHTML("produit")}</div>
      <div class="bdd-content">
        <div class="bdd-toolbar"><button class="bdd-add-btn">+ Ajouter Ligne</button></div>
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
  const tableId = root._bddTable || "produit";
  const thead = root.querySelector(".bdd-thead-row");
  const tbody = root.querySelector(".bdd-tbody");
  if (!thead || !tbody) return;

  const showAct = schema.canEdit || schema.canDel;
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
    .querySelectorAll(".bdd-add-btn,.bdd-edit-btn,.bdd-del-btn")
    .forEach((b) => (b.disabled = on));
}

async function loadTable(root) {
  const schema = SCHEMAS[root._bddTable || "produit"];
  const tableId = root._bddTable || "produit";
  const tbody = root.querySelector(".bdd-tbody");
  if (tbody)
    tbody.innerHTML = `<tr><td class="bdd-empty" colspan="10">Chargement…</td></tr>`;
  setLoading(root, true);
  try {
    const needsLock = LOCKED_TABLES.has(tableId);
    const [resp, lockedDates] = await Promise.all([
      schema.load(),
      needsLock ? getLockedDates() : Promise.resolve(null),
    ]);
    const rows = resp[schema.dataKey] || resp.rows || [];
    root._bddRows = rows;
    renderTable(root, schema, rows, lockedDates);
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
    renderNav,
    renderTable,
    setLoading,
    loadTable,
  });
})();
