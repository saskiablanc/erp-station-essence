/** panels/ticket.js */
WM.register('ticket', {
  label: 'Achats', icon: 'ACH', sprint: 2,
  buildHTML() {
    return `
      <div class="ticket-panel">
        <div class="ticket-actions">
          <button class="ticket-action-btn" data-action="random" type="button">Ajouter produit</button>
          <button class="ticket-action-btn" data-action="barcode" type="button">Insérer code-barres</button>
        </div>
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
          <div class="ticket-total-label">TOTAL :</div>
          <div class="ticket-total-box">
            <span class="ticket-total-value">XX.XX €</span>
          </div>
          <button class="ticket-encaisser" type="button">Encaisser</button>
        </div>

        <div class="ticket-modal" data-modal="barcode" aria-hidden="true">
          <div class="ticket-modal-card" role="dialog" aria-modal="true" aria-labelledby="barcode-title">
            <div class="ticket-modal-title" id="barcode-title">Insérer un code-barres</div>
            <div class="ticket-modal-body">
              <label class="ticket-modal-label" for="barcode-input">Code-barres</label>
              <input id="barcode-input" class="ticket-modal-input" type="text" inputmode="numeric" autocomplete="off" placeholder="Ex: 1234567890123">
            </div>
            <div class="ticket-modal-actions">
              <button class="ticket-modal-btn secondary" data-action="cancel" type="button">Annuler</button>
              <button class="ticket-modal-btn primary" data-action="submit" type="button">Ajouter</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  onMount(id) {
    const root = document.getElementById('win-' + id);
    if (!root) return;

    const panel = root.querySelector('.ticket-panel');
    const rowsEl = panel.querySelector('.ticket-rows');
    const totalEl = panel.querySelector('.ticket-total-value');
    const modal = panel.querySelector('.ticket-modal');
    const barcodeInput = panel.querySelector('#barcode-input');

    const MIN_ROWS = 8;
    const items = [];

    const formatEuro = (value) => `${value.toFixed(2)} €`;

    const renderRows = () => {
      rowsEl.innerHTML = '';
      items.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'ticket-row filled';
        row.dataset.index = String(index);
        row.innerHTML = `
          <div class="cell num">${index + 1}</div>
          <div class="cell nom">${item.libelle}</div>
          <div class="cell code">${item.code}</div>
          <div class="cell qty">${item.qty}</div>
          <div class="cell prix">${formatEuro(item.prix * item.qty)}</div>
          <div class="cell del">
            <button class="ticket-del" type="button" aria-label="Supprimer">X</button>
          </div>
        `;
        rowsEl.appendChild(row);
      });

      for (let i = items.length; i < MIN_ROWS; i += 1) {
        const empty = document.createElement('div');
        empty.className = 'ticket-row';
        empty.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div>';
        rowsEl.appendChild(empty);
      }

      const total = items.reduce((sum, item) => sum + item.prix * item.qty, 0);
      totalEl.textContent = formatEuro(total);
    };

    const normalizeArticle = (article) => ({
      code: String(article.code_barres ?? article.code ?? ''),
      libelle: article.libelle ?? article.nom ?? article.libelle_produit ?? 'Produit',
      prix: Number(article.prix ?? 0),
    });

    const addArticle = (article) => {
      const item = normalizeArticle(article);
      if (!item.code || Number.isNaN(item.prix)) {
        Toast.err('Produit invalide');
        return;
      }
      const existing = items.find(i => i.code === item.code);
      if (existing) {
        existing.qty += 1;
      } else {
        items.push({ ...item, qty: 1 });
      }
      renderRows();
    };

    const openModal = () => {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      barcodeInput.value = '';
      setTimeout(() => barcodeInput.focus(), 30);
    };

    const closeModal = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    };

    panel.querySelector('[data-action="random"]').addEventListener('click', async () => {
      try {
        const article = await Requetes.randomArticle();
        addArticle(article);
      } catch (err) {
        Toast.err(err.message || 'Impossible de charger un produit');
      }
    });

    panel.querySelector('[data-action="barcode"]').addEventListener('click', () => {
      openModal();
    });

    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });

    modal.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);
    modal.querySelector('[data-action="submit"]').addEventListener('click', async () => {
      const code = barcodeInput.value.trim();
      if (!code) {
        Toast.warn('Saisis un code-barres');
        return;
      }
      try {
        const article = await Requetes.getArticle(code);
        addArticle(article);
        closeModal();
      } catch (err) {
        Toast.err(err.message || 'Code-barres introuvable');
      }
    });

    barcodeInput.addEventListener('keydown', async (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      modal.querySelector('[data-action="submit"]').click();
    });

    rowsEl.addEventListener('click', (event) => {
      const btn = event.target.closest('.ticket-del');
      if (!btn) return;
      const row = btn.closest('.ticket-row');
      if (!row) return;
      const index = Number(row.dataset.index);
      if (Number.isInteger(index)) {
        items.splice(index, 1);
        renderRows();
      }
    });

    renderRows();
  },
});
