/** panels/gerant/reappro.js */
WM.register('gerant_reappro', {
  label: 'Réapprovisionnements', icon: '🚚', sprint: 4, gerantOnly: true,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon">🚚</div>
      <div class="ph-label">Réapprovisionnements</div>
      <div class="ph-tag">À VENIR — Sprint 4</div>
      <div class="ph-us">US20/21/22/23</div>
    </div>`;
  },
});
