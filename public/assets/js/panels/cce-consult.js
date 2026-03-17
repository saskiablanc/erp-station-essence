const CceConsultPanel = (() => {
  const listeners = new Map();

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

  function setSelectedCard(cce) {
    const selected = {
      id_carte_CE: Number(cce?.id_carte_CE ?? 0) || 0,
      nom: String(cce?.nom ?? ''),
      prenom: String(cce?.prenom ?? ''),
      solde_client: Number(cce?.solde_client ?? 0) || 0,
    };
    window.CCESelection = selected;
    window.dispatchEvent(new CustomEvent('cce:selected', { detail: selected }));
  }

  function formatMoney(value) {
    return `${Number(value || 0).toFixed(2)} EUR`;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  function renderScannerState(root, message = 'Sélectionnez une carte CCE.') {
    const body = root.querySelector('.cce-consult-body');
    if (!body) return;

    body.innerHTML = `
      <div class="cce-consult-state cce-consult-state--scanner">
        <div class="cce-consult-state-text">${escapeHtml(message)}</div>
        <button type="button" class="cce-consult-scan-btn">Scanner CCE</button>
      </div>
    `;

    body.querySelector('.cce-consult-scan-btn')?.addEventListener('click', () => {
      void openScannerPopup(root);
    });
  }

  function renderOverview(root, cce) {
    const body = root.querySelector(".cce-consult-body");
    if (!body) return;

    root._cceCurrent = cce;
    root._cceCurrentId = Number(cce.id_carte_CE || 0) || null;
    setSelectedCard(cce);

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
            <div class="cce-consult-stat-label">Montant apporté</div>
            <div class="cce-consult-stat-value">${escapeHtml(formatAmount(cce.montant_dernier_apport))}</div>
          </div>
        </div>

        <div class="cce-consult-actions">
          <button type="button" class="cce-consult-action-btn">Actions</button>
        </div>
      </div>
    `;

    body.querySelector(".cce-consult-action-btn")?.addEventListener("click", () => {
      void openActionsPopup(root, cce);
    });
  }

  async function refresh(root, idCarte = null) {
    if (!idCarte || Number(idCarte) <= 0) {
      renderScannerState(root, 'Cliquez sur "Scanner CCE" pour sélectionner une carte.');
      return;
    }

    renderState(root, "Chargement...");

    try {
      const cce = await Requetes.getCCE(idCarte);
      renderOverview(root, cce);
    } catch (error) {
      renderScannerState(root, error.message || 'Chargement CCE impossible');
    }
  }

  async function openScannerPopup(root) {
    let cards = [];
    try {
      cards = await Requetes.getCCEs();
    } catch (error) {
      await Swal.fire({
        title: 'Scanner CCE',
        text: error.message || 'Chargement des cartes CCE impossible.',
        icon: 'error',
        customClass: {
          popup: 'cce-swal-popup',
          title: 'cce-swal-title',
          htmlContainer: 'cce-swal-text',
          confirmButton: 'cce-swal-btn',
        },
        buttonsStyling: false,
        confirmButtonText: 'Fermer',
      });
      return;
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      await Swal.fire({
        title: 'Scanner CCE',
        text: 'Aucune carte CCE disponible.',
        icon: 'info',
        customClass: {
          popup: 'cce-swal-popup',
          title: 'cce-swal-title',
          htmlContainer: 'cce-swal-text',
          confirmButton: 'cce-swal-btn',
        },
        buttonsStyling: false,
        confirmButtonText: 'Fermer',
      });
      return;
    }

    let selectedId = 0;
    const rows = cards
      .map((card) => {
        const id = Number(card.id_carte_CE || 0);
        const nom = `${card.prenom ?? ''} ${card.nom ?? ''}`.trim() || `Carte #${id}`;
        return `
          <tr>
            <td>${escapeHtml(`Carte #${id}`)}</td>
            <td>${escapeHtml(nom)}</td>
            <td>${escapeHtml(formatAmount(card.solde_client))}</td>
            <td>
              <button type="button" class="cce-consult-select-btn" data-cce-select="${id}">
                Sélectionner
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    await Swal.fire({
      title: 'Scanner CCE',
      html: `
        <div class="cce-consult-popup-wrap cce-consult-popup-wrap--scan">
          <table class="cce-consult-popup-table">
            <thead>
              <tr>
                <th>Carte</th>
                <th>Nom</th>
                <th>Solde</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `,
      customClass: {
        popup: 'cce-swal-popup',
        title: 'cce-swal-title',
        htmlContainer: 'cce-swal-text',
        confirmButton: 'cce-swal-btn',
        cancelButton: 'cce-swal-btn',
      },
      buttonsStyling: false,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Fermer',
      allowOutsideClick: false,
      didOpen: (popup) => {
        popup.querySelectorAll('[data-cce-select]').forEach((button) => {
          button.addEventListener('click', () => {
            selectedId = Number(button.dataset.cceSelect || 0);
            Swal.close();
          });
        });
      },
    });

    if (selectedId > 0) {
      void refresh(root, selectedId);
    }
  }

  async function chooseRechargeMethod(montant) {
    let method = null;

    const result = await Swal.fire({
      title: 'Choix du paiement',
      html: `
        <div class="ticket-pay-choice-total">Montant à recharger : <strong>${formatMoney(montant)}</strong></div>
        <div class="ticket-pay-choice-grid ticket-pay-choice-grid--two">
          <button type="button" class="ticket-pay-choice-btn" data-payment-method="cb">Carte bleue</button>
          <button type="button" class="ticket-pay-choice-btn" data-payment-method="espece">Espèce</button>
        </div>
        <button type="button" class="ticket-pay-choice-btn ticket-pay-choice-btn-cancel" data-payment-cancel>
          Annuler
        </button>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: 'cce-swal-popup',
        title: 'cce-swal-title',
        htmlContainer: 'cce-swal-text',
      },
      didOpen: (popup) => {
        popup.querySelectorAll('[data-payment-method]').forEach((button) => {
          button.addEventListener('click', () => {
            method = String(button.dataset.paymentMethod || '').toLowerCase();
            Swal.close();
          });
        });
        popup.querySelector('[data-payment-cancel]')?.addEventListener('click', () => {
          method = null;
          Swal.close();
        });
      },
    });

    if (result.isDismissed && !method) return null;
    return method;
  }

  function formatCents(valueCents) {
    return `${(Math.max(0, valueCents) / 100).toFixed(2)} EUR`;
  }

  async function promptRechargeAmount() {
    const maxDigits = 7;
    let digits = '';
    let confirmed = false;

    await Swal.fire({
      html: `
        <div class="ticket-barcode-modal">
          <button type="button" class="ticket-barcode-close" data-recharge-close aria-label="Fermer">X</button>
          <div class="cce-recharge-title">Montant à ajouter</div>
          <div class="ticket-barcode-display-wrap">
            <div class="ticket-barcode-display" data-recharge-display>0.00 EUR</div>
          </div>
          <div class="ticket-barcode-error" data-recharge-error></div>
          <div class="ticket-barcode-keypad">
            <button type="button" data-recharge-key="1">1</button>
            <button type="button" data-recharge-key="2">2</button>
            <button type="button" data-recharge-key="3">3</button>
            <button type="button" data-recharge-key="4">4</button>
            <button type="button" data-recharge-key="5">5</button>
            <button type="button" data-recharge-key="6">6</button>
            <button type="button" data-recharge-key="7">7</button>
            <button type="button" data-recharge-key="8">8</button>
            <button type="button" data-recharge-key="9">9</button>
            <button type="button" data-recharge-action="back">\u2039</button>
            <button type="button" data-recharge-key="0">0</button>
            <button type="button" data-recharge-action="validate" data-barcode-action="validate">\u2713</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: 'ticket-swal-popup ticket-swal-popup-barcode',
        htmlContainer: 'ticket-swal-barcode-html',
      },
      didOpen: (popup) => {
        const display = popup.querySelector('[data-recharge-display]');
        const error = popup.querySelector('[data-recharge-error]');

        const refresh = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          display.textContent = formatCents(valueCents);
        };

        const close = () => Swal.close();
        const validate = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          if (valueCents <= 0) {
            error.textContent = 'Montant requis';
            return;
          }
          confirmed = true;
          close();
        };

        popup.querySelector('[data-recharge-close]')?.addEventListener('click', close);
        popup.querySelectorAll('[data-recharge-key]').forEach((button) => {
          button.addEventListener('click', () => {
            if (digits.length >= maxDigits) {
              error.textContent = 'Montant trop élevé';
              return;
            }
            digits += String(button.dataset.rechargeKey || '');
            error.textContent = '';
            refresh();
          });
        });
        popup.querySelector('[data-recharge-action="back"]')?.addEventListener('click', () => {
          digits = digits.slice(0, -1);
          error.textContent = '';
          refresh();
        });
        popup.querySelector('[data-recharge-action="validate"]')?.addEventListener('click', validate);

        const onKeyDown = (event) => {
          if (event.key >= '0' && event.key <= '9') {
            event.preventDefault();
            if (digits.length >= maxDigits) {
              error.textContent = 'Montant trop élevé';
              return;
            }
            digits += event.key;
            error.textContent = '';
            refresh();
            return;
          }
          if (event.key === 'Backspace') {
            event.preventDefault();
            digits = digits.slice(0, -1);
            error.textContent = '';
            refresh();
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            validate();
          }
        };

        popup.addEventListener('keydown', onKeyDown);
        popup._rechargeKeyDownHandler = onKeyDown;
      },
      willClose: (popup) => {
        if (popup?._rechargeKeyDownHandler) {
          popup.removeEventListener('keydown', popup._rechargeKeyDownHandler);
          delete popup._rechargeKeyDownHandler;
        }
      },
    });

    if (!confirmed) return null;
    const cents = digits ? Number.parseInt(digits, 10) : 0;
    return cents / 100;
  }

  async function promptCashAmount(total) {
    const totalCents = Math.round(Number(total || 0) * 100);
    const maxDigits = 7;
    let digits = '';
    let confirmed = false;

    await Swal.fire({
      html: `
        <div class="ticket-cash-modal">
          <button type="button" class="ticket-cash-close" data-cash-close aria-label="Fermer">X</button>
          <div class="ticket-cash-total">Montant à régler : <strong>${formatMoney(total)}</strong></div>
          <div class="ticket-cash-display-wrap">
            <div class="ticket-cash-display" data-cash-display>0.00 EUR</div>
          </div>
          <div class="ticket-cash-error" data-cash-error></div>
          <div class="ticket-cash-keypad">
            <button type="button" data-cash-key="1">1</button>
            <button type="button" data-cash-key="2">2</button>
            <button type="button" data-cash-key="3">3</button>
            <button type="button" data-cash-key="4">4</button>
            <button type="button" data-cash-key="5">5</button>
            <button type="button" data-cash-key="6">6</button>
            <button type="button" data-cash-key="7">7</button>
            <button type="button" data-cash-key="8">8</button>
            <button type="button" data-cash-key="9">9</button>
            <button type="button" data-cash-action="back">\u2039</button>
            <button type="button" data-cash-key="0">0</button>
            <button type="button" data-cash-action="validate">\u2713</button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: false,
      allowEscapeKey: true,
      customClass: {
        popup: 'ticket-swal-popup ticket-swal-popup-cash',
        htmlContainer: 'ticket-swal-cash-html',
      },
      didOpen: (popup) => {
        const display = popup.querySelector('[data-cash-display]');
        const error = popup.querySelector('[data-cash-error]');

        const refresh = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          display.textContent = formatCents(valueCents);
        };

        const close = () => Swal.close();
        const validate = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          if (valueCents < totalCents) {
            error.textContent = 'Montant insuffisant';
            return;
          }
          confirmed = true;
          close();
        };

        popup.querySelector('[data-cash-close]')?.addEventListener('click', close);
        popup.querySelectorAll('[data-cash-key]').forEach((button) => {
          button.addEventListener('click', () => {
            if (digits.length >= maxDigits) {
              error.textContent = 'Montant trop élevé';
              return;
            }
            digits += String(button.dataset.cashKey || '');
            error.textContent = '';
            refresh();
          });
        });
        popup.querySelector('[data-cash-action="back"]')?.addEventListener('click', () => {
          digits = digits.slice(0, -1);
          error.textContent = '';
          refresh();
        });
        popup.querySelector('[data-cash-action="validate"]')?.addEventListener('click', validate);
      },
    });

    if (!confirmed) return null;

    const givenCents = digits ? Number.parseInt(digits, 10) : 0;
    return {
      given: givenCents / 100,
      change: Math.max(0, givenCents - totalCents) / 100,
    };
  }

  async function openRechargePopup(root, cce) {
    const montant = await promptRechargeAmount();
    if (!montant || montant <= 0) return;

    const method = await chooseRechargeMethod(montant);
    if (!method) return;

    let cashDetails = null;
    if (method === 'espece') {
      cashDetails = await promptCashAmount(montant);
      if (!cashDetails) return;
    } else {
      Swal.fire({
        title: 'Paiement en cours',
        html: 'Connexion au terminal de paiement...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
        customClass: {
          popup: 'cce-swal-popup',
          title: 'cce-swal-title',
          htmlContainer: 'cce-swal-text',
        },
      });
      const delay = 1000 + Math.floor(Math.random() * 1000);
      await wait(delay);
    }

    try {
      await Requetes.rechargerCCE(Number(cce.id_carte_CE), montant);
      await refresh(root, Number(cce.id_carte_CE));
      await Swal.fire({
        title: 'Paiement accepté',
        html: `
          ${method === 'espece' && cashDetails
            ? `<div>Montant reçu : <strong>${formatMoney(cashDetails.given)}</strong></div>
               ${cashDetails.change > 0 ? `<div>Trop-perçu : <strong>${formatMoney(cashDetails.change)}</strong></div>` : ''}`
            : ''}
          <div style="margin-top:${method === 'espece' ? '8px' : '0'};">
            Rechargement CCE effectué avec succès.
          </div>
        `,
        icon: 'success',
        confirmButtonText: method === 'espece' ? 'Valider' : 'Fermer',
        allowOutsideClick: false,
        customClass: {
          popup: 'cce-swal-popup',
          title: 'cce-swal-title',
          htmlContainer: 'cce-swal-text',
          confirmButton: 'cce-swal-btn',
        },
        buttonsStyling: false,
      });
    } catch (error) {
      await Swal.fire({
        title: 'Rechargement impossible',
        text: error.message || 'Une erreur est survenue.',
        icon: 'error',
        customClass: {
          popup: 'cce-swal-popup',
          title: 'cce-swal-title',
          htmlContainer: 'cce-swal-text',
          confirmButton: 'cce-swal-btn',
        },
        buttonsStyling: false,
        confirmButtonText: 'Fermer',
      });
    }
  }

  async function openActionsPopup(root, cce) {
    const result = await Swal.fire({
      title: 'Actions',
      text: `Carte #${cce.id_carte_CE}`,
      showDenyButton: true,
      showCancelButton: false,
      showCloseButton: true,
      confirmButtonText: 'Recharger CCE',
      denyButtonText: 'Consulter transactions',
      allowOutsideClick: false,
      customClass: {
        popup: 'cce-swal-popup cce-swal-popup-actions',
        title: 'cce-swal-title',
        htmlContainer: 'cce-swal-text',
        actions: 'cce-swal-actions-two',
        confirmButton: 'cce-swal-btn',
        denyButton: 'cce-swal-btn',
      },
      buttonsStyling: false,
    });

    if (result.isConfirmed) {
      await openRechargePopup(root, cce);
      return;
    }
    if (result.isDenied) {
      await openTransactionsPopup(cce);
    }
  }

  async function openTransactionsPopup(cce) {
    try {
      const payload = await Requetes.getCCETransactions(Number(cce.id_carte_CE));
      const columns = Array.isArray(payload?.columns) ? payload.columns : [];
      const rows = Array.isArray(payload?.rows) ? payload.rows : [];

      const headHtml = columns
        .map((column) => `<th>${escapeHtml(column)}</th>`)
        .join('');

      const bodyHtml = rows
        .map((row) => `
          <tr>
            ${columns
              .map((column) => `<td>${escapeHtml(row?.[column] ?? '—')}</td>`)
              .join('')}
          </tr>
        `)
        .join('');

      await Swal.fire({
        title: `Transactions CCE — carte #${escapeHtml(cce.id_carte_CE)}`,
        html: columns.length > 0
          ? rows.length > 0
            ? `
              <div class="cce-consult-popup-wrap">
                <table class="cce-consult-popup-table">
                  <thead><tr>${headHtml}</tr></thead>
                  <tbody>${bodyHtml}</tbody>
                </table>
              </div>
            `
            : `<div class="cce-consult-popup-empty">Aucune transaction CCE pour cette carte.</div>`
          : `<div class="cce-consult-popup-empty">Aucune colonne exploitable dans Transaction.</div>`,
        customClass: {
          popup: 'cce-swal-popup',
          title: 'cce-swal-title',
          htmlContainer: 'cce-swal-text',
          confirmButton: 'cce-swal-btn',
        },
        buttonsStyling: false,
        confirmButtonText: 'Fermer',
      });
    } catch (error) {
      await Swal.fire({
        title: 'Transactions CCE',
        text: error.message || 'Chargement des transactions CCE impossible.',
        icon: 'error',
        customClass: {
          popup: 'cce-swal-popup',
          title: 'cce-swal-title',
          htmlContainer: 'cce-swal-text',
          confirmButton: 'cce-swal-btn',
        },
        buttonsStyling: false,
        confirmButtonText: 'Fermer',
      });
    }
  }

  function bindRefreshListeners(id, root) {
    if (listeners.has(id)) {
      window.removeEventListener('cce:created', listeners.get(id).created);
      window.removeEventListener('cce:updated', listeners.get(id).updated);
      listeners.delete(id);
    }

    const onCreated = (event) => {
      const currentRoot = document.getElementById("win-" + id);
      if (!currentRoot || !document.body.contains(currentRoot)) {
        window.removeEventListener('cce:created', onCreated);
        window.removeEventListener('cce:updated', onUpdated);
        listeners.delete(id);
        return;
      }

      const createdId = Number(event.detail?.id_carte_CE ?? 0);
      refresh(currentRoot, createdId > 0 ? createdId : currentRoot._cceCurrentId);
    };

    const onUpdated = (event) => {
      const currentRoot = document.getElementById('win-' + id);
      if (!currentRoot || !document.body.contains(currentRoot)) {
        window.removeEventListener('cce:created', onCreated);
        window.removeEventListener('cce:updated', onUpdated);
        listeners.delete(id);
        return;
      }

      const updatedId = Number(event.detail?.id_carte_CE ?? 0);
      if (updatedId > 0 && updatedId === Number(currentRoot._cceCurrentId || 0)) {
        void refresh(currentRoot, updatedId);
      }
    };

    window.addEventListener('cce:created', onCreated);
    window.addEventListener('cce:updated', onUpdated);
    listeners.set(id, { created: onCreated, updated: onUpdated });
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
    root._cceCurrentId = null;

    bindRefreshListeners(id, root);
    renderScannerState(root, 'Cliquez sur "Scanner CCE" pour sélectionner une carte.');
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
