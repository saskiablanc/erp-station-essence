/* panels/ticket_view.js - vue achats */
window.TicketView = (() => {
  const MIN_ROWS = 8;

  function getVisibleRows(panel, rowsEl) {
    const rowHeightCss = parseFloat(
      getComputedStyle(panel).getPropertyValue('--ticket-row-h'),
    );
    const rowHeight = Number.isFinite(rowHeightCss) && rowHeightCss > 0
      ? rowHeightCss
      : 26;
    const viewportHeight = rowsEl.clientHeight;
    if (!viewportHeight) return MIN_ROWS;
    return Math.max(MIN_ROWS, Math.floor(viewportHeight / rowHeight));
  }

  function buildHTML() {
    return `
      <div class="ticket-panel">
        <div class="ticket-body">
          <div class="ticket-columns">
            <div class="col-num">Numéro</div>
            <div class="col-nom">Nom</div>
            <div class="col-code">Code-barres</div>
            <div class="col-qty">Quantité</div>
            <div class="col-prix">Prix</div>
            <div class="col-del"></div>
          </div>
          <div class="ticket-rows"></div>
        </div>
        <div class="ticket-footer">
          <div class="ticket-footer-left">
            <div class="ticket-actions">
              <button class="ticket-action-btn" data-action="random" type="button">Scanner article</button>
              <button class="ticket-action-btn" data-action="barcode" type="button">Insérer code-barres</button>
              <button class="ticket-action-btn" data-action="list" type="button">Liste Article</button>
            </div>
          </div>
          <div class="ticket-footer-right">
            <div class="ticket-total-label">TOTAL :</div>
            <div class="ticket-total-box">
              <span class="ticket-total-value">XX.XX EUR</span>
            </div>
            <button class="ticket-encaisser" type="button">Encaisser</button>
          </div>
        </div>
      </div>
    `;
  }

  function formatEuro(value) {
    return `${value.toFixed(2)} EUR`;
  }

  function renderRows(panel, cart) {
    const rowsEl = panel.querySelector('.ticket-rows');
    const totalEl = panel.querySelector('.ticket-total-value');
    const items = cart.getItems();
    const scrollbarGutter = Math.max(0, rowsEl.offsetWidth - rowsEl.clientWidth);
    panel.style.setProperty('--ticket-scrollbar-gutter', `${scrollbarGutter}px`);
    const visibleRows = getVisibleRows(panel, rowsEl);
    const targetRows = Math.max(items.length, visibleRows);

    rowsEl.innerHTML = '';
    items.forEach((item, index) => {
      const editableQty = String(item.source || '').toLowerCase() !== 'energie';
      const qtyCell = editableQty
        ? `
          <div class="ticket-qty-stepper" data-qty-stepper="${index}">
            <button
              class="ticket-qty-btn ticket-qty-btn--minus"
              type="button"
              data-qty-action="dec"
              data-qty-index="${index}"
              aria-label="Diminuer la quantité ligne ${index + 1}"
            >−</button>
            <span class="ticket-qty-value" data-qty-value-index="${index}">${item.qty}</span>
            <button
              class="ticket-qty-btn ticket-qty-btn--plus"
              type="button"
              data-qty-action="inc"
              data-qty-index="${index}"
              aria-label="Augmenter la quantité ligne ${index + 1}"
            >+</button>
          </div>
        `
        : `<span class="ticket-qty-readonly">${item.qty}</span>`;

      const row = document.createElement('div');
      row.className = 'ticket-row filled';
      row.dataset.index = String(index);
      row.innerHTML = `
        <div class="cell num">${index + 1}</div>
        <div class="cell nom">${item.libelle}</div>
        <div class="cell code">${item.codeAffiche || item.code}</div>
        <div class="cell qty">${qtyCell}</div>
        <div class="cell prix">${formatEuro(item.prix * item.qty)}</div>
        <div class="cell del"><button class="ticket-del" type="button" aria-label="Supprimer">X</button></div>
      `;
      rowsEl.appendChild(row);
    });

    for (let i = items.length; i < targetRows; i += 1) {
      const empty = document.createElement('div');
      empty.className = 'ticket-row';
      empty.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div>';
      rowsEl.appendChild(empty);
    }

    totalEl.textContent = formatEuro(cart.getTotal());
  }

  return { buildHTML, renderRows };
})();
