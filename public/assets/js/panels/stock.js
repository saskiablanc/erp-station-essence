/** panels/stock.js */
const StockPanel = (() => {
  const MODE_ARTICLES = "articles";
  const MODE_CARBURANTS = "carburants";
  const listeners = new Map();
  const STOCK_COLS = 3;

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

  function formatSeuilAlerte(item, mode) {
    if (item?.seuil_alerte === null || item?.seuil_alerte === undefined) {
      return "—";
    }
    const value = Number(item.seuil_alerte);
    if (!Number.isFinite(value)) return "—";
    if (mode === MODE_CARBURANTS) {
      return `${value.toFixed(3)} L`;
    }
    return String(Math.max(0, Math.trunc(value)));
  }

  function normalizeSearch(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function rowHtml(item, mode) {
    return `
      <tr>
        <td class="stock-col-name">${escapeHtml(item.libelle)}</td>
        <td class="stock-col-qty">${escapeHtml(formatQuantite(item, mode))}</td>
        <td class="stock-col-threshold">${escapeHtml(formatSeuilAlerte(item, mode))}</td>
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
    const thresholdHead = root.querySelector(".stock-head-threshold");
    if (nameHead) {
      nameHead.textContent = mode === MODE_CARBURANTS ? "Carburant" : "Produit";
    }
    if (qtyHead) {
      qtyHead.textContent =
        mode === MODE_CARBURANTS
          ? "Quantité disponible (L)"
          : "Quantité disponible";
    }
    if (thresholdHead) {
      thresholdHead.textContent =
        mode === MODE_CARBURANTS ? "Seuil d'alerte (L)" : "Seuil d'alerte";
    }
  }

  function filterItems(root, items, mode) {
    const searchInput = root.querySelector(".stock-search-input");
    const query = normalizeSearch(searchInput?.value ?? "");
    if (!query) return items;

    return items.filter((item) => {
      const libelle = normalizeSearch(item.libelle ?? "");
      if (libelle.includes(query)) return true;

      if (mode === MODE_ARTICLES) {
        const codeBarres = normalizeSearch(item.code_barres ?? "");
        return codeBarres.includes(query);
      }
      return false;
    });
  }

  function renderRows(root, items, mode) {
    const body = root.querySelector(".stock-table-body");
    if (!body) return;

    const filteredItems = filterItems(root, items, mode);
    if (filteredItems.length === 0) {
      body.innerHTML = `
        <tr><td colspan="${STOCK_COLS}" class="stock-state">Aucun élément trouvé.</td></tr>
      `;
      return;
    }

    body.innerHTML = filteredItems.map((item) => rowHtml(item, mode)).join("");
  }

  async function refresh(root) {
    const body = root.querySelector(".stock-table-body");
    if (!body) return;
    const mode = getMode(root);
    syncSwitch(root, mode);

    body.innerHTML = `
      <tr><td colspan="${STOCK_COLS}" class="stock-state">Chargement...</td></tr>
    `;

    try {
      const items = await Requetes.getStock(mode);
      root._stockItems = Array.isArray(items) ? items : [];
      renderRows(root, root._stockItems, mode);
    } catch (err) {
      body.innerHTML = `
        <tr><td colspan="${STOCK_COLS}" class="stock-state stock-state--error">${escapeHtml(err.message || "Erreur de chargement du stock.")}</td></tr>
      `;
    }
  }

  function buildHTML() {
    return `
      <div class="stock-panel">
        <div class="stock-toolbar">
          <div class="stock-switch">
            <button type="button" class="stock-switch-btn active" data-stock-mode="articles">Articles</button>
            <button type="button" class="stock-switch-btn" data-stock-mode="carburants">Carburants</button>
          </div>
          <input
            type="search"
            class="stock-search-input"
            placeholder="Rechercher"
            aria-label="Rechercher"
          />
        </div>
        <div class="stock-table-wrap">
          <table class="stock-table">
            <thead>
              <tr>
                <th class="stock-head-name">Produit</th>
                <th class="stock-head-qty">Quantité disponible</th>
                <th class="stock-head-threshold">Seuil d'alerte</th>
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

  function filterCurrent(root) {
    renderRows(root, Array.isArray(root._stockItems) ? root._stockItems : [], getMode(root));
  }

  return { buildHTML, refresh, bindRefreshOnPayment, filterCurrent };
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
    root._stockItems = [];

    root.querySelectorAll(".stock-switch-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = String(btn.dataset.stockMode || "articles").toLowerCase();
        root.dataset.stockMode = mode === "carburants" ? "carburants" : "articles";
        StockPanel.refresh(root);
      });
    });

    const searchInput = root.querySelector(".stock-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        StockPanel.filterCurrent(root);
      });
    }

    StockPanel.bindRefreshOnPayment(id, root);
  },
});
