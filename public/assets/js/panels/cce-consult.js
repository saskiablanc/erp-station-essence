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
      nom: String(cce?.nom ?? ""),
      prenom: String(cce?.prenom ?? ""),
      solde_client: Number(cce?.solde_client ?? 0) || 0,
    };
    window.CCESelection = selected;
    window.dispatchEvent(new CustomEvent("cce:selected", { detail: selected }));
  }

  function formatMoney(value) {
    return `${Number(value || 0).toFixed(2)} EUR`;
  }

  function formatConsultMoney(value) {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return "—";
    return `${amount.toFixed(2)}€`;
  }

  function formatConsultQuantity(value) {
    const quantity = Number(value ?? 0);
    if (!Number.isFinite(quantity)) return "—";
    return `${quantity.toFixed(1)}L`;
  }

  function formatConsultDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const pad = (part) => String(part).padStart(2, "0");
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
  }

  function formatConsultTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    const pad = (part) => String(part).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  function renderScannerState(root, message = "Sélectionnez une carte CCE.") {
    const body = root.querySelector(".cce-consult-body");
    if (!body) return;

    body.innerHTML = `
      <div class="cce-consult-state cce-consult-state--scanner">
        <div class="cce-consult-state-text">${escapeHtml(message)}</div>
        <button type="button" class="cce-consult-scan-btn">Scanner CCE</button>
      </div>
    `;

    body
      .querySelector(".cce-consult-scan-btn")
      ?.addEventListener("click", () => {
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

    body
      .querySelector(".cce-consult-action-btn")
      ?.addEventListener("click", () => {
        void openActionsPopup(root, cce);
      });
  }

  function resetConsultation(root) {
    root._cceCurrent = null;
    root._cceCurrentId = null;
    setSelectedCard(null);
    renderScannerState(
      root,
      'Cliquez sur "Scanner CCE" pour sélectionner une carte.',
    );
  }

  async function refresh(root, idCarte = null) {
    if (!idCarte || Number(idCarte) <= 0) {
      renderScannerState(
        root,
        'Cliquez sur "Scanner CCE" pour sélectionner une carte.',
      );
      return;
    }

    renderState(root, "Chargement...");

    try {
      const cce = await Requetes.getCCE(idCarte);
      renderOverview(root, cce);
    } catch (error) {
      renderScannerState(root, error.message || "Chargement CCE impossible");
    }
  }

  async function openScannerPopup(root) {
    // BroadcastChannel pour communiquer avec le simulateur
    const cceChan = new BroadcastChannel("unica-cce-scan");
    let receivedCarte = null;

    // Envoyer la demande de scan au simulateur
    cceChan.postMessage({ type: "cce-scan-request" });

    // Ecouter la reponse du simulateur
    const responsePromise = new Promise((resolve) => {
      function onMessage(ev) {
        if (ev.data && ev.data.type === "cce-scan-response" && ev.data.carte) {
          cceChan.removeEventListener("message", onMessage);
          resolve(ev.data.carte);
        }
      }
      cceChan.addEventListener("message", onMessage);

      // Stocker la fonction pour pouvoir la nettoyer si annule
      root._cceScanCleanup = () => {
        cceChan.removeEventListener("message", onMessage);
        resolve(null);
      };
    });

    // Afficher le popup d'attente
    const swalPromise = Swal.fire({
      title: "Scanner CCE",
      html: `
        <div style="text-align:center;padding:20px 0;">
          <div style="margin-bottom:16px;color:var(--text-mid,#4b5563);font-size:13px;">
            En attente de la selection d'une carte sur le simulateur...
          </div>
          <div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:cce-wait-pulse 1.2s ease-in-out infinite;"></div>
          <style>@keyframes cce-wait-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style>
        </div>
      `,
      customClass: {
        popup: "cce-swal-popup",
        title: "cce-swal-title",
        htmlContainer: "cce-swal-text",
        cancelButton: "cce-swal-btn",
      },
      buttonsStyling: false,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: "Annuler",
      allowOutsideClick: false,
    });

    // Attendre soit la reponse du simulateur, soit l'annulation
    const raceResult = await Promise.race([
      responsePromise.then((carte) => ({ source: "simulator", carte })),
      swalPromise.then((result) => ({ source: "swal", result })),
    ]);

    if (raceResult.source === "simulator" && raceResult.carte) {
      receivedCarte = raceResult.carte;
      Swal.close();
      cceChan.close();

      const carteId = Number(receivedCarte.id_carte_CE || 0);
      if (carteId > 0) {
        void refresh(root, carteId);
      }
    } else {
      // L'utilisateur a annule le popup
      if (root._cceScanCleanup) {
        root._cceScanCleanup();
        root._cceScanCleanup = null;
      }
      cceChan.close();
    }
  }

  function formatCents(valueCents) {
    return `${(Math.max(0, valueCents) / 100).toFixed(2)} EUR`;
  }

  async function promptRechargeAmount() {
    const maxDigits = 7;
    let digits = "";
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
        popup: "ticket-swal-popup ticket-swal-popup-barcode",
        htmlContainer: "ticket-swal-barcode-html",
      },
      didOpen: (popup) => {
        const display = popup.querySelector("[data-recharge-display]");
        const error = popup.querySelector("[data-recharge-error]");

        const refresh = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          display.textContent = formatCents(valueCents);
        };

        const close = () => Swal.close();
        const validate = () => {
          const valueCents = digits ? Number.parseInt(digits, 10) : 0;
          if (valueCents <= 0) {
            error.textContent = "Montant requis";
            return;
          }
          confirmed = true;
          close();
        };

        popup
          .querySelector("[data-recharge-close]")
          ?.addEventListener("click", close);
        popup.querySelectorAll("[data-recharge-key]").forEach((button) => {
          button.addEventListener("click", () => {
            if (digits.length >= maxDigits) {
              error.textContent = "Montant trop élevé";
              return;
            }
            digits += String(button.dataset.rechargeKey || "");
            error.textContent = "";
            refresh();
          });
        });
        popup
          .querySelector('[data-recharge-action="back"]')
          ?.addEventListener("click", () => {
            digits = digits.slice(0, -1);
            error.textContent = "";
            refresh();
          });
        popup
          .querySelector('[data-recharge-action="validate"]')
          ?.addEventListener("click", validate);

        const onKeyDown = (event) => {
          if (event.key >= "0" && event.key <= "9") {
            event.preventDefault();
            if (digits.length >= maxDigits) {
              error.textContent = "Montant trop élevé";
              return;
            }
            digits += event.key;
            error.textContent = "";
            refresh();
            return;
          }
          if (event.key === "Backspace") {
            event.preventDefault();
            digits = digits.slice(0, -1);
            error.textContent = "";
            refresh();
            return;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            validate();
          }
        };

        popup.addEventListener("keydown", onKeyDown);
        popup._rechargeKeyDownHandler = onKeyDown;
      },
      willClose: (popup) => {
        if (popup?._rechargeKeyDownHandler) {
          popup.removeEventListener("keydown", popup._rechargeKeyDownHandler);
          delete popup._rechargeKeyDownHandler;
        }
      },
    });

    if (!confirmed) return null;
    const cents = digits ? Number.parseInt(digits, 10) : 0;
    return cents / 100;
  }

  async function openRechargePopup(root, cce) {
    let cceCourante = cce;
    try {
      cceCourante = await Requetes.getCCE(Number(cce?.id_carte_CE || 0));
    } catch (_) {
      cceCourante = cce;
    }

    const montant = await promptRechargeAmount();
    if (!montant || montant <= 0) return;
    const montantMin = Number(cceCourante?.montant_min ?? 0);
    if (Number.isFinite(montantMin) && montantMin > 0 && montant < montantMin) {
      await Swal.fire({
        title: "Montant insuffisant",
        text: `Le montant minimum de rechargement est de ${formatMoney(montantMin)}.`,
        icon: "warning",
        customClass: {
          popup: "cce-swal-popup",
          title: "cce-swal-title",
          htmlContainer: "cce-swal-text",
          confirmButton: "cce-swal-btn",
        },
        buttonsStyling: false,
        confirmButtonText: "Fermer",
      });
      return;
    }

    const paymentResult =
      window.TicketPayment &&
      typeof window.TicketPayment.processCceRecharge === "function"
        ? await window.TicketPayment.processCceRecharge(montant)
        : null;
    if (!paymentResult || paymentResult.status !== "success") return;

    const cashDetails = paymentResult.cashDetails || null;
    const amountByMethod = paymentResult.amountByMethod || {};
    const usedCash = Number(amountByMethod.especes || 0) > 0;

    try {
      const rechargeResult = await Requetes.rechargerCCE(
        Number(cceCourante.id_carte_CE),
        montant,
      );
      const rechargeInfo =
        rechargeResult?.cce?.rechargement ||
        rechargeResult?.rechargement ||
        null;
      const bonusApplique = Number(rechargeInfo?.bonus_applique ?? 0);
      const montantCredite = Number(rechargeInfo?.montant_credite ?? montant);
      await refresh(root, Number(cceCourante.id_carte_CE));
      await Swal.fire({
        title: "Paiement accepté",
        html: `
          ${
            usedCash && cashDetails
              ? `<div>Montant reçu : <strong>${formatMoney(cashDetails.given)}</strong></div>
               ${cashDetails.change > 0 ? `<div>Trop-perçu : <strong>${formatMoney(cashDetails.change)}</strong></div>` : ""}`
              : ""
          }
          <div style="margin-top:${usedCash && cashDetails ? "8px" : "0"};">
            ${
              Number(amountByMethod.cb || 0) > 0
                ? `Carte bleue : <strong>${formatMoney(amountByMethod.cb)}</strong>`
                : `Espèces : <strong>${formatMoney(amountByMethod.especes || 0)}</strong>`
            }
          </div>
          ${
            bonusApplique > 0
              ? `<div style="margin-top:8px;">Bonus CCE appliqué : <strong>${formatMoney(bonusApplique)}</strong></div>
               <div>Montant crédité : <strong>${formatMoney(montantCredite)}</strong></div>`
              : ""
          }
          <div style="margin-top:8px;">
            Rechargement CCE effectué avec succès.
          </div>
        `,
        icon: "success",
        confirmButtonText: usedCash ? "Valider" : "Fermer",
        allowOutsideClick: false,
        customClass: {
          popup: "cce-swal-popup",
          title: "cce-swal-title",
          htmlContainer: "cce-swal-text",
          confirmButton: "cce-swal-btn",
        },
        buttonsStyling: false,
      });
    } catch (error) {
      await Swal.fire({
        title: "Rechargement impossible",
        text: error.message || "Une erreur est survenue.",
        icon: "error",
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
  }

  async function openActionsPopup(root, cce) {
    let cceCourante = cce;
    try {
      cceCourante = await Requetes.getCCE(Number(cce?.id_carte_CE || 0));
      root._cceCurrent = cceCourante;
      root._cceCurrentId = Number(cceCourante?.id_carte_CE || 0) || null;
    } catch (_) {
      cceCourante = cce;
    }

    let action = null;
    await Swal.fire({
      title: "Actions",
      html: `
        <div class="cce-actions-card">Carte #${escapeHtml(cceCourante.id_carte_CE)}</div>
        <div class="cce-actions-grid">
          <button type="button" class="cce-actions-btn" data-cce-action="recharge">Recharger CCE</button>
          <button type="button" class="cce-actions-btn" data-cce-action="transactions">Consulter transactions</button>
          <button type="button" class="cce-actions-btn" data-cce-action="bonus">Informations bonus</button>
          <button type="button" class="cce-actions-btn" data-cce-action="end">Fin consultation</button>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false,
      showCancelButton: false,
      showCloseButton: true,
      customClass: {
        popup: "cce-swal-popup cce-swal-popup-actions",
        title: "cce-swal-title",
        htmlContainer: "cce-swal-text",
      },
      didOpen: (popup) => {
        popup.querySelectorAll("[data-cce-action]").forEach((button) => {
          button.addEventListener("click", () => {
            action = String(button.dataset.cceAction || "").toLowerCase();
            Swal.close();
          });
        });
      },
    });

    if (action === "recharge") {
      await openRechargePopup(root, cceCourante);
      return;
    }
    if (action === "transactions") {
      await openTransactionsPopup(root, cceCourante);
      return;
    }
    if (action === "bonus") {
      const rulesRaw = Array.isArray(cceCourante?.bonus_rules)
        ? cceCourante.bonus_rules
        : [];
      const rules = rulesRaw
        .map((rule) => ({
          tranche: Number(rule?.tranche ?? 0),
          montant_bonus: Number(rule?.montant_bonus ?? 0),
        }))
        .filter(
          (rule) =>
            Number.isFinite(rule.tranche) &&
            rule.tranche > 0 &&
            Number.isFinite(rule.montant_bonus),
        )
        .sort((a, b) => a.tranche - b.tranche);

      const bonusHtml =
        rules.length > 0
          ? rules
              .map(
                (rule) => `
            <div class="cce-bonus-line">
              Bonus à partir de ${rule.tranche.toFixed(2)} EUR : <strong>${formatMoney(rule.montant_bonus)}</strong>
            </div>
          `,
              )
              .join("")
          : `
          <div class="cce-bonus-line">Bonus à partir de 100 EUR : <strong>${formatMoney(Number(cceCourante?.bonus_100 ?? 0))}</strong></div>
          <div class="cce-bonus-line">Bonus à partir de 200 EUR : <strong>${formatMoney(Number(cceCourante?.bonus_200 ?? 0))}</strong></div>
        `;

      await Swal.fire({
        title: "Informations bonus",
        html: bonusHtml,
        customClass: {
          popup: "cce-swal-popup",
          title: "cce-swal-title",
          htmlContainer: "cce-swal-text",
          confirmButton: "cce-swal-btn",
        },
        buttonsStyling: false,
        confirmButtonText: "Fermer",
      });
      return;
    }
    if (action === "end") {
      resetConsultation(root);
    }
  }

  async function openTransactionsPopup(root, cce) {
    try {
      const payload = await Requetes.getCCETransactions(
        Number(cce.id_carte_CE),
      );
      const rows = Array.isArray(payload?.rows) ? payload.rows : [];
      const bodyHtml = rows
        .map(
          (row) => `
            <tr>
              <td>${escapeHtml(row?.id_transaction ?? "—")}</td>
              <td>${escapeHtml(row?.carburant ?? "—")}</td>
              <td>${escapeHtml(formatConsultQuantity(row?.quantite))}</td>
              <td>${escapeHtml(formatConsultMoney(row?.montant_total))}</td>
              <td>${escapeHtml(formatConsultDate(row?.date_heure))}</td>
              <td>${escapeHtml(formatConsultTime(row?.date_heure))}</td>
            </tr>
          `,
        )
        .join("");

      const lastAmount = Number(cce?.montant_dernier_apport ?? 0);
      const lastDate = cce?.date_dernier_apport
        ? formatConsultDate(cce.date_dernier_apport)
        : "—";

      await Swal.fire({
        title: `Transactions CCE — carte #${escapeHtml(cce.id_carte_CE)}`,
        html: `
          <div class="cce-transactions-view">
            <div class="cce-transactions-meta">
              <div class="cce-transactions-meta-cell">
                <span class="cce-transactions-meta-label">ID CCE</span>
                <span class="cce-transactions-meta-value">${escapeHtml(cce?.id_carte_CE ?? "—")}</span>
              </div>
              <div class="cce-transactions-meta-cell">
                <span class="cce-transactions-meta-label">ID CLIENT</span>
                <span class="cce-transactions-meta-value">${escapeHtml(cce?.id_client ?? "—")}</span>
              </div>
              <div class="cce-transactions-meta-cell">
                <span class="cce-transactions-meta-label">Nom</span>
                <span class="cce-transactions-meta-value">${escapeHtml(cce?.nom ?? "—")}</span>
              </div>
              <div class="cce-transactions-meta-cell">
                <span class="cce-transactions-meta-label">Prénom</span>
                <span class="cce-transactions-meta-value">${escapeHtml(cce?.prenom ?? "—")}</span>
              </div>
              <div class="cce-transactions-meta-cell cce-transactions-meta-cell--solde">
                <span class="cce-transactions-meta-label">Solde</span>
                <span class="cce-transactions-meta-value">${escapeHtml(formatConsultMoney(cce?.solde_client))}</span>
              </div>
            </div>

            <div class="cce-transactions-subhead">
              <div class="cce-transactions-last">
                Dernier apport : ${escapeHtml(formatConsultMoney(lastAmount))} (${escapeHtml(lastDate)})
              </div>
              <button type="button" class="cce-transactions-recharge" data-cce-transactions-recharge>
                Rechargement CCE
              </button>
            </div>

            <div class="cce-transactions-title">Transactions</div>

            <div class="cce-transactions-table-wrap">
              <table class="cce-transactions-table">
                <thead>
                  <tr>
                    <th>ID Transaction</th>
                    <th>Carburants</th>
                    <th>Quantité</th>
                    <th>Montant Total</th>
                    <th>Date</th>
                    <th>Heure</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    rows.length > 0
                      ? bodyHtml
                      : '<tr><td colspan="6" class="cce-transactions-empty">Aucune transaction carburant CCE pour cette carte.</td></tr>'
                  }
                </tbody>
              </table>
            </div>
          </div>
        `,
        customClass: {
          popup: "cce-swal-popup cce-swal-popup-transactions",
          title: "cce-swal-title",
          htmlContainer: "cce-swal-text",
          confirmButton: "cce-swal-btn",
        },
        buttonsStyling: false,
        confirmButtonText: "Fermer",
        didOpen: (popup) => {
          popup
            .querySelector("[data-cce-transactions-recharge]")
            ?.addEventListener("click", async () => {
              Swal.close();
              await openRechargePopup(root, cce);
            });
        },
      });
    } catch (error) {
      await Swal.fire({
        title: "Transactions CCE",
        text: error.message || "Chargement des transactions CCE impossible.",
        icon: "error",
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
  }

  function bindRefreshListeners(id, root) {
    if (listeners.has(id)) {
      window.removeEventListener("cce:created", listeners.get(id).created);
      window.removeEventListener("cce:updated", listeners.get(id).updated);
      window.removeEventListener(
        "caisse:payment:success",
        listeners.get(id).payment,
      );
      listeners.delete(id);
    }

    const onCreated = (event) => {
      const currentRoot = document.getElementById("win-" + id);
      if (!currentRoot || !document.body.contains(currentRoot)) {
        window.removeEventListener("cce:created", onCreated);
        window.removeEventListener("cce:updated", onUpdated);
        window.removeEventListener("caisse:payment:success", onPaymentSuccess);
        listeners.delete(id);
        return;
      }

      const createdId = Number(event.detail?.id_carte_CE ?? 0);
      refresh(
        currentRoot,
        createdId > 0 ? createdId : currentRoot._cceCurrentId,
      );
    };

    const onUpdated = (event) => {
      const currentRoot = document.getElementById("win-" + id);
      if (!currentRoot || !document.body.contains(currentRoot)) {
        window.removeEventListener("cce:created", onCreated);
        window.removeEventListener("cce:updated", onUpdated);
        window.removeEventListener("caisse:payment:success", onPaymentSuccess);
        listeners.delete(id);
        return;
      }

      const updatedId = Number(event.detail?.id_carte_CE ?? 0);
      if (
        updatedId > 0 &&
        updatedId === Number(currentRoot._cceCurrentId || 0)
      ) {
        void refresh(currentRoot, updatedId);
      }
    };

    const onPaymentSuccess = () => {
      const currentRoot = document.getElementById("win-" + id);
      if (!currentRoot || !document.body.contains(currentRoot)) {
        window.removeEventListener("cce:created", onCreated);
        window.removeEventListener("cce:updated", onUpdated);
        window.removeEventListener("caisse:payment:success", onPaymentSuccess);
        listeners.delete(id);
        return;
      }

      resetConsultation(currentRoot);
    };

    window.addEventListener("cce:created", onCreated);
    window.addEventListener("cce:updated", onUpdated);
    window.addEventListener("caisse:payment:success", onPaymentSuccess);
    listeners.set(id, {
      created: onCreated,
      updated: onUpdated,
      payment: onPaymentSuccess,
    });
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
    renderScannerState(
      root,
      'Cliquez sur "Scanner CCE" pour sélectionner une carte.',
    );
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
