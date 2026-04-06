/* panels/payment/shared.js - helpers communs paiement */
window.TicketPaymentShared = (() => {
  const swalBase = {
    customClass: {
      popup: 'ticket-swal-popup',
      title: 'ticket-swal-title',
      htmlContainer: 'ticket-swal-text',
      confirmButton: 'ticket-swal-btn',
      denyButton: 'ticket-swal-btn',
      cancelButton: 'ticket-swal-btn ticket-swal-btn-secondary',
    },
    buttonsStyling: false,
    reverseButtons: true,
  };

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getSelectedCceId() {
    return Number(window.CCESelection?.id_carte_CE ?? 0);
  }

  function setSelectedCce(cce) {
    // Point unique: la carte CCE scannée est synchronisée ici.
    const selected = {
      id_carte_CE: Number(cce?.id_carte_CE ?? 0) || 0,
      nom: String(cce?.nom ?? ''),
      prenom: String(cce?.prenom ?? ''),
      solde_client: Number(cce?.solde_client ?? 0) || 0,
    };
    window.CCESelection = selected;
    try {
      if (selected.id_carte_CE > 0) {
        sessionStorage.setItem('cce_selected_card_id', String(selected.id_carte_CE));
      } else {
        sessionStorage.removeItem('cce_selected_card_id');
      }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('cce:selected', { detail: selected }));
  }

  async function requestCceScanFromSimulator() {
    if (typeof BroadcastChannel === 'undefined') {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Scan CCE indisponible',
        html: 'Ce navigateur ne supporte pas le canal de communication du scan CCE.',
        confirmButtonText: 'Fermer',
      });
      return null;
    }

    const channel = new BroadcastChannel('unica-cce-scan');
    let onMessage = null;

    try {
      channel.postMessage({ type: 'cce-scan-request' });

      const responsePromise = new Promise((resolve) => {
        onMessage = (event) => {
          if (event?.data?.type === 'cce-scan-response' && event?.data?.carte) {
            resolve({ source: 'simulator', carte: event.data.carte });
          }
        };
        channel.addEventListener('message', onMessage);
      });

      const popupPromise = Swal.fire({
        ...swalBase,
        title: 'Scanner CCE',
        html: `
          <div style="text-align:center;padding:10px 0;">
            <div style="margin-bottom:14px;color:var(--text-mid,#4b5563);font-size:13px;">
              En attente de la sélection d'une carte sur le site de simulation...
            </div>
            <div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:ticket-wait-pulse 1.2s ease-in-out infinite;"></div>
            <style>@keyframes ticket-wait-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style>
          </div>
        `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Annuler',
        allowOutsideClick: false,
      }).then(() => ({ source: 'swal' }));

      const raceResult = await Promise.race([responsePromise, popupPromise]);
      if (raceResult?.source === 'simulator' && raceResult.carte) {
        Swal.close();
        return raceResult.carte;
      }
      return null;
    } finally {
      if (onMessage) {
        channel.removeEventListener('message', onMessage);
      }
      channel.close();
    }
  }

  function formatMoney(value) {
    return `${Number(value || 0).toFixed(2)} EUR`;
  }

  function formatMoneyEuro(value) {
    return `${Number(value || 0).toFixed(2).replace('.', ',')} €`;
  }

  function parseEuroInput(value) {
    const normalized = String(value ?? '').replace(',', '.').trim();
    if (!normalized) return 0;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function toCents(value) {
    return Math.round(Number(value || 0) * 100);
  }

  function fromCents(valueCents) {
    return Math.max(0, Number(valueCents || 0)) / 100;
  }

  function getMethodLabel(method) {
    if (method === 'cb') return 'Carte bleue';
    if (method === 'cce') return 'CCE';
    if (method === 'especes') return 'Espèces';
    return method;
  }

  function notifySimulator(message) {
    // Ping cross-site pour rafraîchir le simulateur sans reload.
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel('unica-cce-scan');
        channel.postMessage(message);
        channel.close();
      } catch (_) {}
    }
    if (String(message?.type || '') === 'cce-balance-updated') {
      try {
        localStorage.setItem(
          'unica_cce_balance_ping',
          JSON.stringify({
            ts: Date.now(),
            id_carte_CE: Number(message?.id_carte_CE || 0),
          }),
        );
      } catch (_) {}
    }
  }

  async function getScannedCceInfo() {
    const idCarte = getSelectedCceId();
    if (idCarte <= 0) return null;

    try {
      const cce = await Requetes.getCCE(idCarte);
      return {
        idCarte,
        solde: Number(cce?.solde_client ?? 0),
      };
    } catch (_) {
      return null;
    }
  }

  function getLineTotal(item) {
    return Number(item?.prix || 0) * Number(item?.qty || 0);
  }

  function getItemsTotal(items) {
    return (items || []).reduce((sum, item) => sum + getLineTotal(item), 0);
  }

  function isEnergyItem(item) {
    const source = String(item?.source || '').toLowerCase();
    return source === 'energie' || source === 'carburant' || source === 'electricite';
  }

  function getItemsEnergyTotal(items) {
    return (items || [])
      .filter((item) => isEnergyItem(item))
      .reduce((sum, item) => sum + getLineTotal(item), 0);
  }

  function normalizePaymentPlan(planRaw, fallbackMethod = 'cb') {
    const paymentOrder = { cce: 1, especes: 2, cb: 3 };
    const plan = [...(Array.isArray(planRaw) ? planRaw : [])].sort(
      (a, b) =>
        (paymentOrder[String(a?.method || '').toLowerCase()] ?? 99) -
        (paymentOrder[String(b?.method || '').toLowerCase()] ?? 99),
    );
    const primaryMethod = String(plan[0]?.method || fallbackMethod || 'cb').toLowerCase();
    return { plan, primaryMethod };
  }

  function collectTransactionIds(responses) {
    const ids = [];
    for (const response of responses) {
      const id = Number(response?.id_transaction ?? 0);
      if (id > 0) {
        ids.push(id);
      }
    }
    return [...new Set(ids)];
  }

  function buildBreakdownHtml(methodTotalsCents) {
    const order = ['cce', 'especes', 'cb'];
    return order
      .filter((method) => Number(methodTotalsCents[method] || 0) > 0)
      .map(
        (method) =>
          `<div>${getMethodLabel(method)} : <strong>${formatMoney(fromCents(methodTotalsCents[method]))}</strong></div>`,
      )
      .join('');
  }

  function resolvePrimaryMethodFromTotals(methodTotalsCents) {
    const order = ['cce', 'especes', 'cb'];
    return order.find((method) => Number(methodTotalsCents[method] || 0) > 0) || 'cb';
  }

  return {
    swalBase,
    wait,
    getSelectedCceId,
    setSelectedCce,
    requestCceScanFromSimulator,
    formatMoney,
    formatMoneyEuro,
    parseEuroInput,
    toCents,
    fromCents,
    getMethodLabel,
    notifySimulator,
    getScannedCceInfo,
    getLineTotal,
    getItemsTotal,
    getItemsEnergyTotal,
    isEnergyItem,
    normalizePaymentPlan,
    collectTransactionIds,
    buildBreakdownHtml,
    resolvePrimaryMethodFromTotals,
  };
})();
