/** panels/gerant/horaires.js */
WM.register('gerant_horaires', {
  label: 'Horaires', icon: 'HOR', sprint: 6, gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon">HOR</div>
      <div class="ph-label">Horaires</div>
      <div class="ph-tag">À VENIR — Sprint 6</div>
      <div class="ph-us">US15</div>
    </div>`;
  },
});
