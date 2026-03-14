/** panels/stock.js */
const StockPanel = (() => {
  const MODE_ARTICLES = "articles";
  const MODE_CARBURANTS = "carburants";
  const listeners = new Map();

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatQuantite(item, mode) {
    const value = Number(item.quantite_stock ?? 0);
    if (mode === MODE_CARBURANTS) {
      return `${value.toFixed(3)} L`;
    }
    return String(Math.max(0, Math.trunc(value)));
  }

  function rowHtml(item, mode) {
    return `
      <tr>
        <td class="stock-col-name">${escapeHtml(item.libelle)}</td>
        <td class="stock-col-qty">${escapeHtml(formatQuantite(item, mode))}</td>
      </tr>
    `;
  }

  function getMode(root) {
    const mode = String(root.dataset.stockMode || MODE_ARTICLES).toLowerCase();
    return mode === MODE_CARBURANTS ? MODE_CARBURANTS : MODE_ARTICLES;
  }

  function syncSwitch(root, mode) {
    root
      .querySelectorAll(".stock-switch-btn")
      .forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.stockMode === mode),
      );

    const nameHead = root.querySelector(".stock-head-name");
    const qtyHead = root.querySelector(".stock-head-qty");
    if (nameHead) {
      nameHead.textContent = mode === MODE_CARBURANTS ? "Carburant" : "Produit";
    }
    if (qtyHead) {
      qtyHead.textContent =
        mode === MODE_CARBURANTS
          ? "Quantité disponible (L)"
          : "Quantité disponible";
    }
  }

  async function refresh(root) {
    const body = root.querySelector(".stock-table-body");
    if (!body) return;
    const mode = getMode(root);
    syncSwitch(root, mode);

    body.innerHTML = `
      <tr><td colspan="2" class="stock-state">Chargement...</td></tr>
    `;

    try {
      const items = await Requetes.getStock(mode);
      if (!Array.isArray(items) || items.length === 0) {
        body.innerHTML = `
          <tr><td colspan="2" class="stock-state">Aucun élément trouvé.</td></tr>
        `;
        return;
      }

      body.innerHTML = items.map((item) => rowHtml(item, mode)).join("");
    } catch (err) {
      body.innerHTML = `
        <tr><td colspan="2" class="stock-state stock-state--error">${escapeHtml(err.message || "Erreur de chargement du stock.")}</td></tr>
      `;
    }
  }

  function buildHTML() {
    return `
      <div class="stock-panel">
        <div class="stock-switch">
          <button type="button" class="stock-switch-btn active" data-stock-mode="articles">Articles</button>
          <button type="button" class="stock-switch-btn" data-stock-mode="carburants">Carburants</button>
        </div>
        <div class="stock-table-wrap">
          <table class="stock-table">
            <thead>
              <tr>
                <th class="stock-head-name">Produit</th>
                <th class="stock-head-qty">Quantité disponible</th>
              </tr>
            </thead>
            <tbody class="stock-table-body"></tbody>
          </table>
        </div>
      </div>
    `;
  }

  function bindRefreshOnPayment(id, root) {
    if (listeners.has(id)) {
      window.removeEventListener("stock:changed", listeners.get(id));
      listeners.delete(id);
    }

    const handler = () => {
      const currentRoot = document.getElementById("win-" + id);
      if (!currentRoot || !document.body.contains(currentRoot)) {
        window.removeEventListener("stock:changed", handler);
        listeners.delete(id);
        return;
      }
      refresh(currentRoot);
    };

    window.addEventListener("stock:changed", handler);
    listeners.set(id, handler);
    refresh(root);
  }

  return { buildHTML, refresh, bindRefreshOnPayment };
})();

WM.register("stock", {
  label: "Stocks",
  icon: "STK",
  sprint: 3,
  buildHTML() {
    return StockPanel.buildHTML();
  },
  onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    root.dataset.stockMode = "articles";
    root.querySelectorAll(".stock-switch-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = String(btn.dataset.stockMode || "articles").toLowerCase();
        root.dataset.stockMode = mode === "carburants" ? "carburants" : "articles";
        StockPanel.refresh(root);
      });
    });

    StockPanel.bindRefreshOnPayment(id, root);
  },
});
