/** panels/ticket.js */
WM.register('ticket', {
  label: 'Panier', icon: 'PAN', sprint: 2,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon">PAN</div>
      <div class="ph-label">Panier</div>
      <div class="ph-tag">À VENIR — Sprint 2</div>
      <div class="ph-us">US4 — Enregistrement Achats</div>
    </div>`;
  },
});
