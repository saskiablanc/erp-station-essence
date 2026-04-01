/** panels/gerant/bdd.js — bootstrap */
WM.register("gerant_bdd", {
  label: "Base de Données",
  icon: "BDD",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return window.BddPanel.buildHTML();
  },
  onMount(id) {
    window.BddPanel.onMount(id);
  },
});
