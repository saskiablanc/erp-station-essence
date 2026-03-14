const CceConsultPanel = (() => {
  const listeners = new Map();
  const ASSETS_BASE =
    (typeof window !== "undefined" && window.APP_BASE_URL
      ? window.APP_BASE_URL
      : "") + "/assets/img";
  const EXPAND_ICON_SRC = `${ASSETS_BASE}/expand.png`;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(value, withTime = false) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    const pad = (part) => String(part).padStart(2, "0");
    const base = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(2)}`;

    if (!withTime) return base;
    return `${base} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function formatAmount(value) {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return "—";
    return `${amount.toFixed(3)} EUR`;
  }

  function previewHtml(cce) {
    const transactions = Array.isArray(cce.transactions_preview)
      ? cce.transactions_preview
      : [];

    if (transactions.length === 0) {
      return `<div class="cce-consult-history-empty">Aucune transaction CCE pour cette carte.</div>`;
    }

    const tx = transactions[0];
    return `
      <div class="cce-consult-history-row">
        <span class="cce-consult-history-date">${escapeHtml(formatDate(tx.date_heure, true))}</span>
        <span class="cce-consult-history-amount">${escapeHtml(formatAmount(tx.prix_total))}</span>
      </div>
    `;
  }

  function renderState(root, message, isError = false) {
    const body = root.querySelector(".cce-consult-body");
    if (!body) return;

    body.innerHTML = `
      <div class="cce-consult-state${isError ? " error" : ""}">
        ${escapeHtml(message)}
      </div>
    `;
  }

  function renderOverview(root, cce) {
    const body = root.querySelector(".cce-consult-body");
    if (!body) return;

    root._cceCurrent = cce;

    body.innerHTML = `
      <div class="cce-consult-card">
        <div class="cce-consult-card-top">
          <div class="cce-consult-card-id">Carte #${escapeHtml(cce.id_carte_CE)}</div>
          <div class="cce-consult-card-client">${escapeHtml(`${cce.prenom} ${cce.nom}`)}</div>
          <div class="cce-consult-stat cce-consult-stat--solde">
            <div class="cce-consult-stat-label">Solde courant</div>
            <div class="cce-consult-stat-value">${escapeHtml(formatAmount(cce.solde_client))}</div>
          </div>
        </div>

        <div class="cce-consult-stats">
          <div class="cce-consult-stat">
            <div class="cce-consult-stat-label">Dernier apport</div>
            <div class="cce-consult-stat-value">${escapeHtml(formatDate(cce.date_dernier_apport))}</div>
          </div>

          <div class="cce-consult-stat">
            <div class="cce-consult-stat-label">Montant apporte</div>
            <div class="cce-consult-stat-value">${escapeHtml(formatAmount(cce.montant_dernier_apport))}</div>
          </div>
        </div>

        <div class="cce-consult-history">
          <div class="cce-consult-history-head">
            <span class="cce-consult-history-title">Transactions</span>
            <button type="button" class="cce-consult-expand" aria-label="Agrandir les transactions">
              <img src="${EXPAND_ICON_SRC}" alt="" class="cce-consult-expand-icon">
            </button>
          </div>
          ${previewHtml(cce)}
        </div>
      </div>
    `;

    body.querySelector(".cce-consult-expand")?.addEventListener("click", () => {
      void openTransactionsPopup(cce);
    });
  }

  async function refresh(root, idCarte = null) {
    renderState(root, "Chargement...");

    try {
      const cce = idCarte
        ? await Requetes.getCCE(idCarte)
        : await Requetes.getCCELatest();
      renderOverview(root, cce);
    } catch (error) {
      renderState(root, error.message || "Chargement CCE impossible", true);
    }
  }

  async function openTransactionsPopup(cce) {
    const transactions = Array.isArray(cce.transactions) ? cce.transactions : [];

    const rows = transactions
      .map(
        (tx) => `
          <tr>
            <td>${escapeHtml(tx.id_transaction)}</td>
            <td>${escapeHtml(formatDate(tx.date_heure, true))}</td>
            <td>${escapeHtml(formatAmount(tx.prix_total))}</td>
          </tr>
        `,
      )
      .join("");

    await Swal.fire({
      title: `Transactions carte #${escapeHtml(cce.id_carte_CE)}`,
      html: rows
        ? `
          <div class="cce-consult-popup-wrap">
            <table class="cce-consult-popup-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        `
        : `<div class="cce-consult-popup-empty">Aucune transaction CCE à afficher pour cette carte.</div>`,
      customClass: {
        popup: "cce-swal-popup",
        title: "cce-swal-title",
        htmlContainer: "cce-swal-text",
        confirmButton: "cce-swal-btn",
      },
      buttonsStyling: false,
      confirmButtonText: "Fermer",
    });
  }

  function bindRefreshOnCreate(id, root) {
    if (listeners.has(id)) {
      window.removeEventListener("cce:created", listeners.get(id));
      listeners.delete(id);
    }

    const handler = (event) => {
      const currentRoot = document.getElementById("win-" + id);
      if (!currentRoot || !document.body.contains(currentRoot)) {
        window.removeEventListener("cce:created", handler);
        listeners.delete(id);
        return;
      }

      const createdId = Number(event.detail?.id_carte_CE ?? 0);
      refresh(currentRoot, createdId > 0 ? createdId : null);
    };

    window.addEventListener("cce:created", handler);
    listeners.set(id, handler);
  }

  function buildHTML() {
    return `
      <div class="cce-consult-panel">
        <div class="cce-consult-body"></div>
      </div>
    `;
  }

  function onMount(id) {
    const root = document.getElementById("win-" + id);
    if (!root) return;

    root._cceCurrent = null;

    root.querySelector(".cce-consult-refresh")?.addEventListener("click", () => {
      void refresh(root);
    });

    bindRefreshOnCreate(id, root);
    void refresh(root);
  }

  return { buildHTML, onMount };
})();

WM.register("cce_consult", {
  label: "Consulter CCE",
  icon: "CCE",
  sprint: 5,
  buildHTML() {
    return CceConsultPanel.buildHTML();
  },
  onMount(id) {
    CceConsultPanel.onMount(id);
  },
});
