/** panels/gerant/fermetures.js — Jours de fermetures de la boutique (US15) */
WM.register("gerant_fermetures", {
  label: "Jours de fermetures de la boutique",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon"></div>
      <div class="ph-label">Jours de fermetures de la boutique</div>
      <div class="ph-tag">À VENIR — Sprint 6</div>
      <div class="ph-us">US15</div>
    </div>`;
  },
});
