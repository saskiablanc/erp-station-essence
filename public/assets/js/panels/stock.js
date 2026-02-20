/** panels/stock.js */
WM.register('stock', {
  label: 'Stocks', icon: 'STK', sprint: 3,
  buildHTML() {
    return `<div class="placeholder">
      <div class="ph-icon">STK</div>
      <div class="ph-label">Stocks</div>
      <div class="ph-tag">À VENIR — Sprint 3</div>
      <div class="ph-us">US7 — État Stock</div>
    </div>`;
  },
});
