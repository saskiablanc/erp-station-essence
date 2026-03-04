/** panels/ticket.js */
WM.register('ticket', {
  label: 'Achats', icon: 'ACH', sprint: 2,
  buildHTML() {
    const emptyRow = `
      <div class="ticket-row">
        <div></div><div></div><div></div><div></div><div></div><div></div>
      </div>
    `;
    const rows = Array.from({ length: 8 }).map(() => emptyRow).join('');

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
          <div class="ticket-rows">
            ${rows}
          </div>
        </div>
        <div class="ticket-footer">
          <div class="ticket-total-label">TOTAL :</div>
          <div class="ticket-total-box">
            <span class="ticket-total-value">XX.XX €</span>
          </div>
          <button class="ticket-encaisser" type="button">Encaisser</button>
        </div>
      </div>
    `;
  },
});
