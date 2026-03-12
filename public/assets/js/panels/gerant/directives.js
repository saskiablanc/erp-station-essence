/** panels/gerant/directives.js — Directives de la Direction */
WM.register("gerant_directives", {
  label: "Directives de la Direction",
  icon: "",
  sprint: 6,
  gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon"></div>
      <div class="ph-label">Directives de la Direction</div>
      <div class="ph-tag">À VENIR — Sprint 7</div>
    </div>`;
  },
});
