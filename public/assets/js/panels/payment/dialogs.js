/* panels/payment/dialogs.js - popups et saisies UI paiement */
window.TicketPaymentDialogs = (() => {
  const shared = window.TicketPaymentShared;
  if (!shared) {
    throw new Error('TicketPaymentShared est requis avant TicketPaymentDialogs.');
  }

  const {
    swalBase,
    formatMoney,
    formatMoneyEuro,
    parseEuroInput,
    toCents,
    fromCents,
    getMethodLabel,
    isEnergyItem,
  } = shared;

  async function chooseEncaissementMode(total) {
    let mode = null;
    await Swal.fire({
      ...swalBase,
      title: 'Encaissement',
      html: `
        <div class="ticket-pay-choice-total">Total à régler : <strong>${formatMoneyEuro(total)}</strong></div>
        <div class="ticket-pay-entry-grid">
          <button type="button" class="ticket-pay-choice-btn" data-pay-entry="all">Encaisser tout</button>
          <button type="button" class="ticket-pay-choice-btn" data-pay-entry="items">Encaisser par article</button>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Annuler',
      allowOutsideClick: false,
      allowEscapeKey: true,
      backdrop: 'rgba(26, 26, 46, 0.45)',
      didOpen: (popup) => {
        popup.querySelectorAll('[data-pay-entry]').forEach((button) => {
          button.addEventListener('click', () => {
            mode = String(button.dataset.payEntry || '');
            Swal.close();
          });
        });
      },
    });
    if (!mode) return null;
    return mode === 'items' ? 'items' : 'all';
  }

  async function chooseItemsToPay(remainingEntries) {
    const escapeHtml = (value) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const renderRows = (entries, isProductSection) =>
      entries
        .map(({ key, item, remainingQty }) => {
          const qtyMax = Math.max(1, Math.trunc(Number(remainingQty || item?.qty || 1)));
          const unitPrice = Number(item?.prix || 0);
          const total = unitPrice * qtyMax;
          const allowQtySelect = isProductSection && qtyMax > 1;

          return `
            <div class="ticket-pay-item-row" data-pay-item-row="${key}">
              <label class="ticket-pay-item-check">
                <input type="checkbox" data-pay-item-check="${key}">
                <span class="ticket-pay-item-lib">${escapeHtml(item?.libelle || 'Article')}</span>
              </label>
              <div class="ticket-pay-item-meta">
                <span class="ticket-pay-item-unit">${formatMoneyEuro(unitPrice)} / unité</span>
                <span class="ticket-pay-item-total">${formatMoneyEuro(total)}</span>
              </div>
              ${
                allowQtySelect
                  ? `<label class="ticket-pay-item-qty">
                       <span>Qté</span>
                       <input type="number" min="1" max="${qtyMax}" step="1" value="${qtyMax}" data-pay-item-qty="${key}" disabled>
                     </label>`
                  : `<div class="ticket-pay-item-qty-fixed">Qté ${qtyMax}</div>`
              }
            </div>
          `;
        })
        .join('');

    const produitsEntries = remainingEntries.filter(({ item }) => !isEnergyItem(item));
    const carburantEntries = remainingEntries.filter(({ item }) => isEnergyItem(item));

    const sections = [
      {
        label: 'Produits',
        entries: produitsEntries,
        isProduct: true,
      },
      {
        label: 'Carburants / Énergie',
        entries: carburantEntries,
        isProduct: false,
      },
    ]
      .filter((section) => section.entries.length > 0)
      .map(
        (section) => `
          <section class="ticket-pay-item-group">
            <header class="ticket-pay-item-group-title">
              <span>${section.label}</span>
              <span class="ticket-pay-item-group-count">${section.entries.length} ligne(s)</span>
            </header>
            <div class="ticket-pay-item-group-body">
              ${renderRows(section.entries, section.isProduct)}
            </div>
          </section>
        `,
      )
      .join('');

    const result = await Swal.fire({
      ...swalBase,
      title: 'Encaisser par article',
      html: `
        <div class="ticket-pay-item-list">${sections}</div>
        <div class="ticket-pay-item-hint">Sélectionnez les lignes à encaisser et la quantité des produits.</div>
      `,
      customClass: {
        ...swalBase.customClass,
        popup: 'ticket-swal-popup ticket-swal-popup-items',
      },
      showConfirmButton: true,
      showCancelButton: true,
      confirmButtonText: 'Valider',
      cancelButtonText: 'Annuler',
      allowOutsideClick: false,
      didOpen: (popup) => {
        const syncQtyInput = (checkbox) => {
          const key = Number(checkbox.dataset.payItemCheck || 0);
          if (!Number.isInteger(key) || key <= 0) return;
          const qtyInput = popup.querySelector(`[data-pay-item-qty="${key}"]`);
          if (qtyInput) {
            qtyInput.disabled = !checkbox.checked;
          }
        };

        popup.querySelectorAll('[data-pay-item-check]').forEach((checkbox) => {
          syncQtyInput(checkbox);
          checkbox.addEventListener('change', () => syncQtyInput(checkbox));
        });
      },
      preConfirm: () => {
        const entryMap = new Map(remainingEntries.map((entry) => [Number(entry.key), entry]));
        const checks = Array.from(document.querySelectorAll('[data-pay-item-check]:checked'));
        if (checks.length === 0) {
          Swal.showValidationMessage('Sélectionnez au moins une ligne.');
          return false;
        }

        const selected = [];
        for (const check of checks) {
          const key = Number(check.dataset.payItemCheck || 0);
          const entry = entryMap.get(key);
          if (!entry || key <= 0) continue;

          const qtyMax = Math.max(
            1,
            Math.trunc(Number(entry.remainingQty || entry.item?.qty || 1)),
          );
          const isProduit = !isEnergyItem(entry.item);
          let qty = qtyMax;

          if (isProduit && qtyMax > 1) {
            const qtyInput = document.querySelector(`[data-pay-item-qty="${key}"]`);
            const raw = Number.parseInt(String(qtyInput?.value ?? ''), 10);
            if (!Number.isInteger(raw) || raw < 1 || raw > qtyMax) {
              Swal.showValidationMessage(
                `Quantité invalide pour « ${entry.item?.libelle || 'Article'} » (1 à ${qtyMax}).`,
              );
              return false;
            }
            qty = raw;
          }

          selected.push({ key, qty });
        }

        if (selected.length === 0) {
          Swal.showValidationMessage('Sélectionnez au moins une ligne.');
          return false;
        }

        return selected;
      },
    });

    if (!result.isConfirmed) return null;
    return Array.isArray(result.value) ? result.value : null;
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
    // Pop-up principale de répartition des modes de paiement.
    const totalCents = toCents(total);
    const allowedMethods = Array.isArray(options.allowedMethods) && options.allowedMethods.length > 0
      ? options.allowedMethods.map((method) => String(method || '').toLowerCase())
      : ['cb', 'cce', 'especes'];
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
    const cceEnabled = allowedMethods.includes('cce') && cceCapCents > 0;
    const methods = ['cb', 'cce', 'especes'].filter((method) => allowedMethods.includes(method));
    const state = {
      share: false,
      strategy: 'montants',
      selected: {
        cb: methods.includes('cb'),
        cce: false,
        especes: false,
      },
      parts: { cb: 1, cce: 1, especes: 1 },
      amounts: { cb: '', cce: '', especes: '' },
    };

    let computedCents = { cb: 0, cce: 0, especes: 0 };
    let popupRef = null;
    let activeMethod = methods.find((method) => state.selected[method]) || 'cb';

    const html = `
      <div class="ticket-pay-split">
        <div class="ticket-pay-choice-total">Total à régler : <strong>${formatMoneyEuro(total)}</strong></div>
        ${
          methods.includes('cce')
            ? `<div class="ticket-pay-cce-limit">
                 Sous-total énergie (payable CCE) : <strong>${formatMoneyEuro(fromCents(cceRuleLimitCents))}</strong>
               </div>
               ${
                 cceInfo
                   ? `<div class="ticket-pay-cce-balance">
                 Carte CCE scannée #${cceInfo.idCarte} — Solde : <strong>${formatMoneyEuro(cceInfo.solde)}</strong> — Plafond CCE : <strong>${formatMoneyEuro(fromCents(cceCapCents))}</strong>
               </div>`
                   : ''
               }`
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
        <div class="ticket-pay-keypad is-hidden" data-pay-keypad>
          <div class="ticket-pay-keypad-head">
            Saisie TPE : <strong data-pay-active-label>Carte bleue</strong>
          </div>
          <div class="ticket-pay-keypad-display-wrap">
            <div class="ticket-pay-keypad-display" data-pay-keypad-display>0,00 €</div>
          </div>
          <div class="ticket-pay-keypad-grid">
            <button type="button" data-pay-key="1">1</button>
            <button type="button" data-pay-key="2">2</button>
            <button type="button" data-pay-key="3">3</button>
            <button type="button" data-pay-key="4">4</button>
            <button type="button" data-pay-key="5">5</button>
            <button type="button" data-pay-key="6">6</button>
            <button type="button" data-pay-key="7">7</button>
            <button type="button" data-pay-key="8">8</button>
            <button type="button" data-pay-key="9">9</button>
            <button type="button" data-pay-action="back">\u2039</button>
            <button type="button" data-pay-key="0">0</button>
            <button type="button" data-pay-action="clear">C</button>
          </div>
        </div>
        <div class="ticket-pay-split-note" data-pay-note></div>
      </div>
    `;

    const readSelectedMethods = () =>
      methods.filter((method) => state.selected[method]);

    const isShareEditMode = () => state.share && state.strategy !== 'equitablement';
    const isAmountTpeMode = () => state.share && state.strategy === 'montants';

    const getMaxAssignableCents = (targetMethod) => {
      const selectedMethods = readSelectedMethods();
      const othersTotal = selectedMethods
        .filter((method) => method !== targetMethod)
        .reduce((acc, method) => {
          const parsed = parseEuroInput(state.amounts[method]);
          if (!Number.isFinite(parsed) || parsed <= 0) return acc;
          return acc + toCents(parsed);
        }, 0);

      let maxCents = Math.max(0, totalCents - othersTotal);
      if (targetMethod === 'cce') {
        maxCents = Math.min(maxCents, cceCapCents);
      }
      return maxCents;
    };

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
      const keypad = popupRef.querySelector('[data-pay-keypad]');
      const activeLabel = popupRef.querySelector('[data-pay-active-label]');
      const keypadDisplay = popupRef.querySelector('[data-pay-keypad-display]');
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
      if (!selectedMethods.includes(activeMethod)) {
        activeMethod = selectedMethods[0] || 'cb';
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
          row.classList.toggle(
            'is-active-edit',
            isShareEditMode() && method === activeMethod && enabled && methodAllowed,
          );
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

      if (activeLabel) {
        activeLabel.textContent = getMethodLabel(activeMethod);
      }
      if (keypadDisplay) {
        const activeAmount = parseEuroInput(state.amounts[activeMethod]);
        keypadDisplay.textContent = formatMoneyEuro(Number.isFinite(activeAmount) ? activeAmount : 0);
      }

      if (keypad) {
        keypad.classList.toggle('is-hidden', !isAmountTpeMode());
      }

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
          popup.querySelector(`[data-pay-row="${method}"]`)?.addEventListener('click', () => {
            if (!isShareEditMode()) return;
            if (!state.selected[method]) return;
            if (method === 'cce' && !cceEnabled) return;
            activeMethod = method;
            refresh();
          });

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
              activeMethod = method;
            } else {
              state.selected[method] = checked;
              if (checked && method === 'cce') {
                const current = parseEuroInput(state.amounts.cce);
                const maxCce = fromCents(cceCapCents);
                if (!Number.isFinite(current) || current <= 0 || current > maxCce) {
                  state.amounts.cce = maxCce.toFixed(2);
                }
                activeMethod = method;
              }
            }
            refresh();
          });

          popup.querySelector(`[data-pay-edit="${method}"]`)?.addEventListener('input', (event) => {
            activeMethod = method;
            const value = String(event.target?.value ?? '');
            if (state.strategy === 'parts') {
              state.parts[method] = value;
            } else if (state.strategy === 'montants') {
              const parsed = parseEuroInput(value);
              const maxAssignable = fromCents(getMaxAssignableCents(method));
              if (Number.isFinite(parsed) && parsed > maxAssignable) {
                state.amounts[method] = maxAssignable.toFixed(2);
                event.target.value = state.amounts[method];
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

        popup.querySelector('[data-pay-keypad]')?.addEventListener('click', (event) => {
          const button = event.target.closest('button');
          if (!button || !isAmountTpeMode()) return;
          if (!state.selected[activeMethod]) return;
          if (activeMethod === 'cce' && !cceEnabled) return;

          const digit = button.dataset.payKey;
          const action = button.dataset.payAction;

          let digits = String(state.amounts[activeMethod] ?? '').replace(/\D/g, '');
          if (digit) {
            if (digits.length >= 7) return;
            digits += digit;
          } else if (action === 'back') {
            digits = digits.slice(0, -1);
          } else if (action === 'clear') {
            digits = '';
          } else {
            return;
          }

          let cents = Number.parseInt(digits || '0', 10);
          cents = Math.min(cents, getMaxAssignableCents(activeMethod));
          state.amounts[activeMethod] = fromCents(cents).toFixed(2);
          refresh();
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
        <div class="ticket-barcode-modal ticket-barcode-modal--cash">
          <button type="button" class="ticket-barcode-close" data-cash-close aria-label="Fermer">X</button>
          <div class="ticket-barcode-total">Total à régler : <strong>${formatMoney(total)}</strong></div>
          <div class="ticket-barcode-display-wrap">
            <div class="ticket-barcode-display ticket-barcode-display--cash" data-cash-display>0.00 EUR</div>
          </div>
          <div class="ticket-barcode-error" data-cash-error></div>
          <div class="ticket-barcode-keypad">
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
            <button type="button" data-cash-action="validate" data-barcode-action="validate">\u2713</button>
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

  return {
    chooseEncaissementMode,
    chooseItemsToPay,
    choosePaymentPlan,
    promptCashAmount,
    chooseReceipt,
  };
})();
