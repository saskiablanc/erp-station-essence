/** panels/gerant/reappro_manuel.js — Lancer réapprovisionnement manuel (US21) */
WM.register("gerant_reappro_manuel", {
  label: "Lancer Réapprovisionnement Manuel",
  icon: "",
  sprint: 4,
  gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon"></div>
      <div class="ph-label">Lancer Réapprovisionnement Manuel</div>
      <div class="ph-tag">À VENIR — Sprint 4</div>
      <div class="ph-us">US21</div>
    </div>`;
  },
});
