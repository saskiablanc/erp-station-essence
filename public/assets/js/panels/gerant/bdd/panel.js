/** panels/gerant/bdd/panel.js */
(() => {
  const ns = (window.BddPanelModules = window.BddPanelModules || {});
  const { SCHEMAS, loadTable, openAdd, openEdit, openDelete } = ns;

function onMount(id) {
  const root = document.getElementById("win-" + id);
  if (!root) return;
  root._bddTable = "produit";

  root.querySelectorAll(".bdd-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      root
        .querySelectorAll(".bdd-tab")
        .forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      root._bddTable = tab.dataset.table;
      const s = SCHEMAS[tab.dataset.table] || {};
      const addBtn = root.querySelector(".bdd-add-btn");
      if (addBtn) addBtn.style.display = s.canAdd ? "" : "none";
      void loadTable(root);
    });
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

  void loadTable(root);
}



  Object.assign(ns, { onMount });

  window.BddPanel = {
    buildHTML: ns.buildHTML,
    onMount,
    invalidateLockedDates: ns.invalidateLockedDates,
  };
})();
