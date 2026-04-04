/** panels/gerant/bdd/panel.js */
(() => {
  const ns = (window.BddPanelModules = window.BddPanelModules || {});
  const {
    SCHEMAS,
    loadTable,
    openAdd,
    openEdit,
    openDelete,
    renderNav,
    getDefaultTableId,
    togglePinnedTable,
  } = ns;

function onMount(id) {
  const root = document.getElementById("win-" + id);
  if (!root) return;
  root._bddTable = SCHEMAS.produit ? "produit" : getDefaultTableId();

  renderNav(root);

  root.querySelector(".bdd-nav")?.addEventListener("click", (event) => {
    const pinBtn = event.target.closest("[data-pin-table]");
    if (pinBtn) {
      event.preventDefault();
      event.stopPropagation();
      togglePinnedTable(pinBtn.dataset.pinTable);
      renderNav(root);
      return;
    }

    const tab = event.target.closest(".bdd-tab");
    if (!tab) return;

    root._bddTable = tab.dataset.table;
    renderNav(root);
    const s = SCHEMAS[tab.dataset.table] || {};
    const addBtn = root.querySelector(".bdd-add-btn");
    if (addBtn) addBtn.style.display = s.canAdd ? "" : "none";
    void loadTable(root);
  });

  root
    .querySelector(".bdd-add-btn")
    ?.addEventListener("click", () => void openAdd(root));

  root.querySelector(".bdd-tbody")?.addEventListener("click", (e) => {
    const eb = e.target.closest(".bdd-edit-btn");
    const db = e.target.closest(".bdd-del-btn");
    if (eb) void openEdit(root, eb.dataset.key);
    if (db) void openDelete(root, db.dataset.key);
  });

  const initialSchema = SCHEMAS[root._bddTable] || {};
  const addBtn = root.querySelector(".bdd-add-btn");
  if (addBtn) addBtn.style.display = initialSchema.canAdd ? "" : "none";

  void loadTable(root);
}



  Object.assign(ns, { onMount });

  window.BddPanel = {
    buildHTML: ns.buildHTML,
    onMount,
    invalidateLockedDates: ns.invalidateLockedDates,
  };
})();
