/** panels/paiement.js */
WM.register('paiement', {
  label: 'Paiement', icon: 'PAY', sprint: 2,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon">PAY</div>
      <div class="ph-label">Paiement</div>
      <div class="ph-tag">À VENIR — Sprint 2</div>
      <div class="ph-us">US3 — Gestion Transaction</div>
    </div>`;
  },
});
