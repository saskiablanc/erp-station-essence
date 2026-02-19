/** panels/gerant/incidents.js */
WM.register('gerant_incidents', {
  label: 'Incidents', icon: '🚨', sprint: 6, gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon">🚨</div>
      <div class="ph-label">Incidents</div>
      <div class="ph-tag">À VENIR — Sprint 6</div>
      <div class="ph-us">US11</div>
    </div>`;
  },
});
