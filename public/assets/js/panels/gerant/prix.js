/** panels/gerant/prix.js */
WM.register('gerant_prix', {
  label: 'Prix Carburants', icon: 'PRX', sprint: 6, gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon">PRX</div>
      <div class="ph-label">Prix Carburants</div>
      <div class="ph-tag">À VENIR — Sprint 6</div>
      <div class="ph-us">US12</div>
    </div>`;
  },
});
