/* panels/ticket_payment.js - simulation paiement avec SweetAlert2 */
window.TicketPayment = (() => {
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

  function distributeByWeights(totalCents, methods, weightsByMethod) {
    if (totalCents <= 0 || methods.length === 0) return {};
    const safeMethods = methods.filter((method) => (weightsByMethod[method] ?? 0) > 0);
    if (safeMethods.length === 0) return {};

    const totalWeight = safeMethods.reduce((acc, method) => acc + Number(weightsByMethod[method] || 0), 0);
    if (totalWeight <= 0) return {};

    const distribution = {};
    const remainders = [];
    let allocated = 0;

    safeMethods.forEach((method) => {
      const raw = (totalCents * Number(weightsByMethod[method])) / totalWeight;
      const base = Math.floor(raw);
      distribution[method] = base;
      allocated += base;
      remainders.push({ method, remainder: raw - base });
    });

    let missing = totalCents - allocated;
    remainders.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < missing; i += 1) {
      const item = remainders[i % remainders.length];
      distribution[item.method] += 1;
    }

    return distribution;
  }

  async function choosePaymentPlan(total, options = {}) {
    const totalCents = toCents(total);
    const cceRuleLimitCents = Math.max(0, toCents(options.cceMax ?? total));
    const cceInfo = options.cceInfo || null;
    const cceBalanceCents =
      cceInfo && Number.isFinite(Number(cceInfo.solde))
        ? Math.max(0, toCents(cceInfo.solde))
        : null;
    const cceCapCents =
      cceBalanceCents === null
        ? cceRuleLimitCents
        : Math.min(cceRuleLimitCents, cceBalanceCents);
    const cceEnabled = cceCapCents > 0;
    const methods = ['cb', 'cce', 'especes'];
    const state = {
      share: false,
      strategy: 'montants',
      selected: { cb: true, cce: false, especes: false },
      parts: { cb: 1, cce: 1, especes: 1 },
      amounts: { cb: '', cce: '', especes: '' },
    };

    let computedCents = { cb: 0, cce: 0, especes: 0 };
    let popupRef = null;

    const html = `
      <div class="ticket-pay-split">
        <div class="ticket-pay-choice-total">Total à régler : <strong>${formatMoneyEuro(total)}</strong></div>
        <div class="ticket-pay-cce-limit">
          Sous-total énergie (payable CCE) : <strong>${formatMoneyEuro(fromCents(cceRuleLimitCents))}</strong>
        </div>
        ${
          cceInfo
            ? `<div class="ticket-pay-cce-balance">
                 Carte CCE scannée #${cceInfo.idCarte} — Solde : <strong>${formatMoneyEuro(cceInfo.solde)}</strong> — Plafond CCE : <strong>${formatMoneyEuro(fromCents(cceCapCents))}</strong>
               </div>`
            : ''
        }
        <div class="ticket-pay-split-top">
          <label class="ticket-pay-split-share">
            <input type="checkbox" data-pay-share>
            <span>Partager</span>
          </label>
          <select class="ticket-pay-split-mode" data-pay-strategy>
            <option value="montants" selected>Montants</option>
            <option value="equitablement">Équitablement</option>
            <option value="parts">Parts</option>
          </select>
        </div>
        <div class="ticket-pay-split-list">
          ${methods
            .map(
              (method) => `
                <div class="ticket-pay-split-row" data-pay-row="${method}">
                  <label class="ticket-pay-split-method">
                    <input type="checkbox" data-pay-check="${method}" ${state.selected[method] ? 'checked' : ''}>
                    <span>${getMethodLabel(method)}</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    class="ticket-pay-split-edit"
                    data-pay-edit="${method}"
                  />
                  <div class="ticket-pay-split-amount" data-pay-display="${method}">0,00 €</div>
                  <button type="button" class="ticket-pay-add-rest" data-pay-add-rest="${method}">
                    Ajouter reste
                  </button>
                </div>
              `,
            )
            .join('')}
        </div>
        <div class="ticket-pay-split-note" data-pay-note></div>
      </div>
    `;

    const readSelectedMethods = () =>
      methods.filter((method) => state.selected[method]);

    const compute = (strict = false) => {
      const selectedMethods = readSelectedMethods();
      if (selectedMethods.length === 0) {
        if (strict) {
          throw new Error('Sélectionnez au moins un mode de paiement.');
        }
        return { cb: 0, cce: 0, especes: 0 };
      }

      if (!state.share) {
        const method = selectedMethods[0];
        if (method === 'cce') {
          return { cb: 0, cce: 0, especes: 0, cce: Math.min(totalCents, cceCapCents) };
        }
        return { cb: 0, cce: 0, especes: 0, [method]: totalCents };
      }

      if (state.strategy === 'equitablement') {
        return distributeByWeights(
          totalCents,
          selectedMethods,
          Object.fromEntries(selectedMethods.map((method) => [method, 1])),
        );
      }

      if (state.strategy === 'parts') {
        const weights = {};
        selectedMethods.forEach((method) => {
          const parsed = Number.parseFloat(String(state.parts[method] ?? 0));
          weights[method] = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        });
        const hasPositiveWeight = Object.values(weights).some((value) => value > 0);
        if (!hasPositiveWeight) {
          if (strict) {
            throw new Error('Renseignez des parts strictement positives.');
          }
          return { cb: 0, cce: 0, especes: 0 };
        }
        return distributeByWeights(totalCents, selectedMethods, weights);
      }

      // montants
      const centsByMethod = { cb: 0, cce: 0, especes: 0 };
      let sum = 0;
      for (const method of selectedMethods) {
        const parsed = parseEuroInput(state.amounts[method]);
        if (!Number.isFinite(parsed) || parsed < 0) {
          if (strict) {
            throw new Error(`Montant invalide pour ${getMethodLabel(method)}.`);
          }
          return { cb: 0, cce: 0, especes: 0 };
        }
        const cents = toCents(parsed);
        centsByMethod[method] = cents;
        sum += cents;
      }
      if (sum !== totalCents) {
        if (strict) {
          throw new Error(`La somme des montants doit être égale à ${formatMoneyEuro(total)}.`);
        }
      }
      return centsByMethod;
    };

    const refresh = () => {
      if (!popupRef) return;
      const modeSelect = popupRef.querySelector('[data-pay-strategy]');
      const note = popupRef.querySelector('[data-pay-note]');
      modeSelect.disabled = !state.share;

      if (!cceEnabled) {
        state.selected.cce = false;
        const cceCheck = popupRef.querySelector('[data-pay-check="cce"]');
        if (cceCheck) cceCheck.checked = false;
      }

      const selectedMethods = readSelectedMethods();
      if (!state.share && selectedMethods.length > 1) {
        const first = selectedMethods[0];
        methods.forEach((method) => {
          state.selected[method] = method === first;
          const checkbox = popupRef.querySelector(`[data-pay-check="${method}"]`);
          if (checkbox) checkbox.checked = state.selected[method];
        });
      }

      computedCents = { cb: 0, cce: 0, especes: 0, ...compute(false) };

      methods.forEach((method) => {
        const row = popupRef.querySelector(`[data-pay-row="${method}"]`);
        const checkbox = popupRef.querySelector(`[data-pay-check="${method}"]`);
        const edit = popupRef.querySelector(`[data-pay-edit="${method}"]`);
        const display = popupRef.querySelector(`[data-pay-display="${method}"]`);
        const addRest = popupRef.querySelector(`[data-pay-add-rest="${method}"]`);
        const methodAllowed = !(method === 'cce' && !cceEnabled);
        const enabled = state.selected[method];
        if (row) {
          row.classList.toggle('is-disabled', !enabled);
          row.classList.toggle('is-locked', !methodAllowed);
        }
        if (checkbox) checkbox.disabled = !methodAllowed;

        if (!edit) return;
        edit.disabled = !enabled || !methodAllowed;
        edit.classList.toggle('is-hidden', !state.share || state.strategy === 'equitablement');

        if (state.share && state.strategy === 'parts') {
          edit.step = '0.1';
          edit.value = String(state.parts[method] ?? 1);
          edit.placeholder = 'Part';
        } else if (state.share && state.strategy === 'montants') {
          edit.step = '0.01';
          if (method === 'cce') {
            edit.max = fromCents(cceCapCents).toFixed(2);
          } else {
            edit.removeAttribute('max');
          }
          edit.value = String(state.amounts[method] ?? '');
          edit.placeholder = '0,00';
        }

        if (display) {
          display.textContent = formatMoneyEuro(fromCents(computedCents[method] || 0));
        }
        if (addRest) {
          const showAddRest = state.share && state.strategy === 'montants';
          addRest.classList.toggle('is-hidden', !showAddRest);
          addRest.disabled = !showAddRest || !enabled || !methodAllowed;
        }
      });

      const totalComputedCents = methods.reduce(
        (acc, method) => acc + (state.selected[method] ? Number(computedCents[method] || 0) : 0),
        0,
      );
      const cceUsedCents = Number(computedCents.cce || 0);
      if (cceUsedCents > cceCapCents) {
        note.textContent = `Le montant CCE ne peut pas dépasser ${formatMoneyEuro(fromCents(cceCapCents))}.`;
        return;
      }
      if (!state.share) {
        note.textContent =
          totalComputedCents === totalCents
            ? ''
            : `Montant restant à régler : ${formatMoneyEuro(fromCents(totalCents - totalComputedCents))}.`;
        return;
      }
      note.textContent =
        totalComputedCents === totalCents
          ? ''
          : `Reste à répartir : ${formatMoneyEuro(fromCents(Math.abs(totalCents - totalComputedCents)))}`;
    };

    const result = await Swal.fire({
      ...swalBase,
      title: 'Choix du paiement',
      html,
      customClass: {
        ...swalBase.customClass,
        popup: 'ticket-swal-popup ticket-swal-popup-split',
      },
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Valider',
      cancelButtonText: 'Annuler',
      allowOutsideClick: false,
      allowEscapeKey: true,
      backdrop: 'rgba(26, 26, 46, 0.45)',
      didOpen: (popup) => {
        popupRef = popup;

        popup.querySelector('[data-pay-share]')?.addEventListener('change', (event) => {
          state.share = Boolean(event.target?.checked);
          if (!state.share) {
            const selectedMethods = readSelectedMethods();
            const keep = selectedMethods[0] || 'cb';
            methods.forEach((method) => {
              state.selected[method] = method === keep;
              const checkbox = popup.querySelector(`[data-pay-check="${method}"]`);
              if (checkbox) checkbox.checked = state.selected[method];
            });
          }
          refresh();
        });

        popup.querySelector('[data-pay-strategy]')?.addEventListener('change', (event) => {
          state.strategy = String(event.target?.value || 'equitablement').toLowerCase();
          refresh();
        });

        methods.forEach((method) => {
          popup.querySelector(`[data-pay-check="${method}"]`)?.addEventListener('change', (event) => {
            if (method === 'cce' && !cceEnabled) {
              state.selected[method] = false;
              event.target.checked = false;
              refresh();
              return;
            }
            const checked = Boolean(event.target?.checked);
            if (!state.share && checked) {
              methods.forEach((m) => {
                state.selected[m] = m === method;
                const checkbox = popup.querySelector(`[data-pay-check="${m}"]`);
                if (checkbox) checkbox.checked = state.selected[m];
              });
              if (method === 'cce') {
                state.amounts.cce = fromCents(Math.min(totalCents, cceCapCents)).toFixed(2);
              }
            } else {
              state.selected[method] = checked;
              if (checked && method === 'cce') {
                const current = parseEuroInput(state.amounts.cce);
                const maxCce = fromCents(cceCapCents);
                if (!Number.isFinite(current) || current <= 0 || current > maxCce) {
                  state.amounts.cce = maxCce.toFixed(2);
                }
              }
            }
            refresh();
          });

          popup.querySelector(`[data-pay-edit="${method}"]`)?.addEventListener('input', (event) => {
            const value = String(event.target?.value ?? '');
            if (state.strategy === 'parts') {
              state.parts[method] = value;
            } else if (state.strategy === 'montants') {
              if (method === 'cce') {
                const parsed = parseEuroInput(value);
                const maxCce = fromCents(cceCapCents);
                if (Number.isFinite(parsed) && parsed > maxCce) {
                  state.amounts[method] = maxCce.toFixed(2);
                  event.target.value = state.amounts[method];
                } else {
                  state.amounts[method] = value;
                }
              } else {
                state.amounts[method] = value;
              }
            }
            refresh();
          });

          popup.querySelector(`[data-pay-add-rest="${method}"]`)?.addEventListener('click', () => {
            if (!(state.share && state.strategy === 'montants')) return;
            if (!state.selected[method]) return;
            if (method === 'cce' && !cceEnabled) return;

            const centsByMethod = { cb: 0, cce: 0, especes: 0, ...compute(false) };
            const sumCents = methods.reduce(
              (acc, m) => acc + (state.selected[m] ? Number(centsByMethod[m] || 0) : 0),
              0,
            );
            const remaining = totalCents - sumCents;
            if (remaining <= 0) {
              refresh();
              return;
            }

            const current = Number(centsByMethod[method] || 0);
            let target = current + remaining;
            if (method === 'cce') {
              target = Math.min(target, cceCapCents);
            }
            state.amounts[method] = fromCents(target).toFixed(2);
            refresh();
          });
        });

        refresh();
      },
      preConfirm: () => {
        try {
          const centsByMethod = { cb: 0, cce: 0, especes: 0, ...compute(true) };
          const cceCents = Number(centsByMethod.cce || 0);
          if (cceCents > cceCapCents) {
            throw new Error(`La CCE ne peut couvrir que ${formatMoneyEuro(fromCents(cceCapCents))}.`);
          }
          if (cceCents > 0 && !cceEnabled) {
            throw new Error('Aucune ligne énergie : paiement CCE indisponible.');
          }
          const sumCents = Object.values(centsByMethod).reduce((acc, value) => acc + Number(value || 0), 0);
          if (sumCents !== totalCents) {
            throw new Error(`Le total payé doit être égal à ${formatMoneyEuro(total)}.`);
          }
          const plan = methods
            .map((method) => ({
              method,
              amount: fromCents(centsByMethod[method] || 0),
            }))
            .filter((entry) => entry.amount > 0);
          if (plan.length === 0) {
            throw new Error('Aucun montant à encaisser.');
          }
          return {
            share: state.share,
            strategy: state.strategy,
            plan,
            primaryMethod: plan[0].method,
          };
        } catch (error) {
          Swal.showValidationMessage(error.message || 'Répartition invalide');
          return false;
        }
      },
    });

    if (!result.isConfirmed) return null;
    return result.value || null;
  }

  function formatCents(valueCents) {
    return `${(Math.max(0, valueCents) / 100).toFixed(2)} EUR`;
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
          <div class="ticket-cash-total">Total à régler : <strong>${formatMoney(total)}</strong></div>
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
        popup._cashKeyDownHandler = onKeyDown;
      },
      willClose: (popup) => {
        if (popup?._cashKeyDownHandler) {
          popup.removeEventListener('keydown', popup._cashKeyDownHandler);
          delete popup._cashKeyDownHandler;
        }
      },
    });

    if (!confirmed) return null;

    const givenCents = digits ? Number.parseInt(digits, 10) : 0;
    return {
      given: givenCents / 100,
      change: Math.max(0, givenCents - totalCents) / 100,
    };
  }

  async function chooseReceipt() {
    const result = await Swal.fire({
      ...swalBase,
      reverseButtons: false,
      title: 'Souhaitez-vous un reçu ?',
      html: 'Voulez-vous imprimer un reçu de paiement ?',
      showDenyButton: true,
      showCancelButton: false,
      confirmButtonText: 'Oui',
      denyButtonText: 'Non',
      allowOutsideClick: false,
      backdrop: 'rgba(26, 26, 46, 0.45)',
    });

    if (result.isConfirmed) return true;
    if (result.isDenied) return false;
    return false;
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

  async function ensureCcePaymentReady(amountToDebit) {
    const idCarte = getSelectedCceId();
    if (idCarte <= 0) {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Carte CCE non scannée',
        html: 'Scannez une carte CCE dans le panneau CCE avant de payer avec ce mode.',
        confirmButtonText: 'Fermer',
      });
      return null;
    }

    let cce = null;
    try {
      cce = await Requetes.getCCE(idCarte);
    } catch (error) {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Carte CCE indisponible',
        html: error.message || 'Impossible de charger la carte CCE scannée.',
        confirmButtonText: 'Fermer',
      });
      return null;
    }

    const solde = Number(cce?.solde_client ?? 0);
    if (!Number.isFinite(solde) || solde < Number(amountToDebit || 0)) {
      await Swal.fire({
        ...swalBase,
        icon: 'warning',
        title: 'Solde CCE insuffisant',
        html: `Solde courant : <strong>${formatMoney(solde)}</strong><br>Montant CCE : <strong>${formatMoney(amountToDebit)}</strong>`,
        confirmButtonText: 'Fermer',
      });
      return null;
    }

    return { idCarte };
  }

  async function process(items, total) {
    const energieTotal = items
      .filter((item) => String(item?.source || '').toLowerCase() === 'energie')
      .reduce((sum, item) => sum + (Number(item?.prix || 0) * Number(item?.qty || 0)), 0);
    const cceInfo = await getScannedCceInfo();

    const payment = await choosePaymentPlan(total, { cceMax: energieTotal, cceInfo });
    if (!payment) {
      return { status: 'cancel' };
    }
    const planRaw = Array.isArray(payment.plan) ? payment.plan : [];
    const paymentOrder = { cce: 1, especes: 2, cb: 3 };
    const plan = [...planRaw].sort(
      (a, b) =>
        (paymentOrder[String(a?.method || '').toLowerCase()] ?? 99) -
        (paymentOrder[String(b?.method || '').toLowerCase()] ?? 99),
    );
    const primaryMethod = String(plan[0]?.method || payment.primaryMethod || 'cb').toLowerCase();

    const amountByMethod = plan.reduce((acc, entry) => {
      const method = String(entry?.method || '').toLowerCase();
      const amount = Number(entry?.amount || 0);
      if (!method || amount <= 0) return acc;
      acc[method] = (acc[method] || 0) + amount;
      return acc;
    }, {});

    let cceContext = null;
    const cceAmount = Number(amountByMethod.cce || 0);
    if (cceAmount > 0) {
      cceContext = await ensureCcePaymentReady(cceAmount);
      if (!cceContext) {
        return { status: 'cancel' };
      }

      Swal.fire({
        ...swalBase,
        title: 'Paiement CCE en cours',
        html: 'Validation du paiement CCE...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });
      await wait(900 + Math.floor(Math.random() * 500));
    }

    let cashDetails = null;
    const cashAmount = Number(amountByMethod.especes || 0);
    if (cashAmount > 0) {
      cashDetails = await promptCashAmount(cashAmount);
      if (!cashDetails) {
        return { status: 'cancel' };
      }
    }

    const cbAmount = Number(amountByMethod.cb || 0);
    if (cbAmount > 0) {
      Swal.fire({
        ...swalBase,
        title: 'Paiement carte bleue en cours',
        html: 'Connexion au terminal CB...',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const delay = 1000 + Math.floor(Math.random() * 1000);
      await wait(delay);
    }

    try {
      const lignesProduits = items
        .filter((item) => item.source === 'produit')
        .map((item) => ({
          code_barres: item.code,
          quantite: item.qty,
        }));

      const lignesEnergie = items
        .filter((item) => item.source === 'energie')
        .map((item) => ({
          id_pompe: item.idPompe,
          id_transaction_energie: item.idTransactionEnergie,
          quantite: item.qty,
        }));

      const responses = [];
      const energieResponses = [];
      if (lignesProduits.length > 0) {
        responses.push(await Requetes.creerTransaction({
          mode_paiement: primaryMethod,
          lignes: lignesProduits,
        }));
      }

      for (const ligne of lignesEnergie) {
        if (!ligne.id_pompe || !ligne.id_transaction_energie) {
          throw new Error('Ligne énergie invalide');
        }
        const response = await Requetes.encaisserPompe(ligne.id_pompe, {
          id_transaction_energie: ligne.id_transaction_energie,
          mode_paiement: primaryMethod,
        });
        responses.push(response);
        energieResponses.push(response);
      }

      if (lignesEnergie.length > 0 && typeof window.PompesPanelRefresh === 'function') {
        window.PompesPanelRefresh();
      }

      const transactionIds = collectTransactionIds(responses);
      if (cceAmount > 0 && cceContext?.idCarte > 0) {
        const transactionIdsEnergie = collectTransactionIds(energieResponses);
        await Requetes.debiterCCE(cceContext.idCarte, cceAmount, transactionIdsEnergie);
        window.dispatchEvent(new CustomEvent('cce:updated', { detail: { id_carte_CE: cceContext.idCarte } }));
      }

      const wantsReceipt = await chooseReceipt();
      let receiptState = 'none';
      if (wantsReceipt) {
        if (transactionIds.length === 0) {
          receiptState = 'missing';
        } else {
          try {
            await Requetes.creerRecus({
              id_transactions: transactionIds,
              mode_paiement: primaryMethod,
            });
            await wait(800);
            receiptState = 'printing';
          } catch (_) {
            receiptState = 'error';
          }
        }
      }

      const receiptMessage =
        receiptState === 'printing'
          ? 'Impression en cours...'
          : receiptState === 'error' || receiptState === 'missing'
            ? 'Transaction enregistrée. Reçu indisponible pour le moment.'
            : 'Transaction enregistrée avec succès.';

      const breakdownHtml = plan
        .map(
          (entry) =>
            `<div>${getMethodLabel(entry.method)} : <strong>${formatMoney(entry.amount)}</strong></div>`,
        )
        .join('');

      await Swal.fire({
        ...swalBase,
        icon: 'success',
        title: 'Paiement accepté',
        html: `
          <div>${breakdownHtml}</div>
          ${cashAmount > 0 && cashDetails
            ? `<div>Montant reçu : <strong>${formatMoney(cashDetails.given)}</strong></div>
               ${cashDetails.change > 0 ? `<div>Trop-perçu : <strong>${formatMoney(cashDetails.change)}</strong></div>` : ''}`
            : ''}
          <div style="margin-top:${cashAmount > 0 ? '8px' : '0'};">
            ${receiptMessage}
          </div>
        `,
        confirmButtonText: cashAmount > 0 ? 'Valider' : 'Fermer',
        allowOutsideClick: false,
      });

      window.dispatchEvent(new CustomEvent('stock:changed'));
      window.dispatchEvent(new CustomEvent('caisse:payment:success'));
      return { status: 'success', responses };
    } catch (err) {
      await Swal.fire({
        ...swalBase,
        icon: 'error',
        title: 'Paiement refusé',
        html: err.message || 'Impossible d’enregistrer la transaction.',
        confirmButtonText: 'Fermer',
      });
      return { status: 'error', error: err };
    }
  }

  return { process };
})();
