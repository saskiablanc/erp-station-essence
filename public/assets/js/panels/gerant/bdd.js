/** panels/gerant/bdd.js — bootstrap */
WM.register("gerant_bdd", {
  label: "BDD Base de Données",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return window.BddPanel.buildHTML();
  },
  onMount(id) {
    window.BddPanel.onMount(id);
  },
});
