/** panels/gerant/reappro.js — Consultation état réapprovisionnements (US23) */
WM.register("gerant_reappro", {
  label: "Réapprovisionnement",
  icon: "",
  sprint: 4,
  gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon"></div>
      <div class="ph-label">Réapprovisionnement</div>
      <div class="ph-tag">À VENIR — Sprint 4</div>
      <div class="ph-us">US22/23</div>
    </div>`;
  },
});
