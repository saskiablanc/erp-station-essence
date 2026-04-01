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
    esc,
    rowDate,
    getLockedDates,
  } = ns;

function buildHTML() {
  const tabs = GROUPS.map(
    (g) =>
      `<button class="bdd-tab${g.id === "produit" ? " active" : ""}" data-table="${g.id}">${g.label}</button>`,
  ).join("");
  return `
    <div class="bdd-panel">
      <div class="bdd-nav">${tabs}</div>
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


  Object.assign(ns, { buildHTML, renderTable, setLoading, loadTable });
})();
