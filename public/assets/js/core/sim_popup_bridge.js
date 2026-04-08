/**
 * core/sim_popup_bridge.js
 * Déclenche sur le site officiel les popups envoyées depuis /simulator.
 * Affichage uniquement (aucune action métier).
 */
(function () {
  const CHANNEL_NAME = "unica-popup-trigger";
  const STORAGE_KEY = "unica_popup_trigger";

  function ticketBase() {
    return {
      customClass: {
        popup: "ticket-swal-popup",
        title: "ticket-swal-title",
        htmlContainer: "ticket-swal-text",
        confirmButton: "ticket-swal-btn",
        denyButton: "ticket-swal-btn",
        cancelButton: "ticket-swal-btn ticket-swal-btn-secondary",
      },
      buttonsStyling: false,
      backdrop: "rgba(26, 26, 46, 0.45)",
    };
  }

  function ticketPayBase() {
    return {
      ...ticketBase(),
      reverseButtons: true,
    };
  }

  function cceBase() {
    return {
      customClass: {
        popup: "cce-swal-popup",
        title: "cce-swal-title",
        htmlContainer: "cce-swal-text",
        confirmButton: "cce-swal-btn",
        cancelButton: "cce-swal-btn",
      },
      buttonsStyling: false,
    };
  }

  function bddBase() {
    return {
      customClass: {
        popup: "bdd-swal-popup",
        title: "bdd-swal-title",
        htmlContainer: "bdd-swal-html",
        confirmButton: "bdd-swal-btn",
        cancelButton: "bdd-swal-btn bdd-swal-btn--cancel",
      },
      buttonsStyling: false,
      reverseButtons: false,
      backdrop: "rgba(26,26,46,0.45)",
    };
  }

  function hbBase() {
    return {
      customClass: {
        popup: "hb-swal-popup",
        title: "hb-swal-title",
        htmlContainer: "hb-swal-text",
        confirmButton: "hb-swal-btn",
        cancelButton: "hb-swal-btn hb-swal-btn--secondary",
      },
      buttonsStyling: false,
      reverseButtons: false,
      backdrop: "rgba(26, 26, 46, 0.45)",
    };
  }

  function fiBase() {
    return {
      customClass: {
        popup: "fi-swal-popup",
        title: "fi-swal-title",
        htmlContainer: "fi-swal-text",
        confirmButton: "fi-swal-btn",
        cancelButton: "fi-swal-btn fi-swal-btn--secondary",
      },
      buttonsStyling: false,
      reverseButtons: false,
      backdrop: "rgba(26, 26, 46, 0.45)",
    };
  }

  function popupDefinitions() {
    return {
      // Caisse / Ticket
      "achat-erreur": { kind: "simple", options: { ...ticketBase(), icon: "error", title: "Erreur", text: "Produit invalide", confirmButtonText: "Fermer" } },
      "achat-ajoute": { kind: "timer", options: { ...ticketBase(), icon: "success", title: "Article ajouté", text: "Article ajouté au panier", timer: 1200, showConfirmButton: false } },
      "achat-liste": { kind: "simple", options: { ...ticketBase(), title: "Liste articles", html: '<div class="ticket-list-wrap"><table class="ticket-list-table"><thead><tr><th>Code-barres</th><th>Article</th><th>Action</th></tr></thead><tbody><tr><td>3760123456789</td><td>Eau 1L</td><td class="ticket-list-cell-action"><button type="button" class="ticket-list-add-btn">Ajouter aux achats</button></td></tr><tr><td>3017620425035</td><td>Chips Lay\'s Nature 45g</td><td class="ticket-list-cell-action"><button type="button" class="ticket-list-add-btn">Ajouter aux achats</button></td></tr></tbody></table></div>', customClass: { ...ticketBase().customClass, popup: "ticket-swal-popup ticket-swal-popup-list" }, confirmButtonText: "Fermer" } },
      "achat-codebarres": {
        kind: "simple",
        options: {
          html: `
            <div class="ticket-barcode-modal">
              <button type="button" class="ticket-barcode-close" aria-label="Fermer">X</button>
              <div class="ticket-barcode-display-wrap">
                <div class="ticket-barcode-display">-------------</div>
              </div>
              <div class="ticket-barcode-error"></div>
              <div class="ticket-barcode-keypad">
                <button type="button">1</button><button type="button">2</button><button type="button">3</button>
                <button type="button">4</button><button type="button">5</button><button type="button">6</button>
                <button type="button">7</button><button type="button">8</button><button type="button">9</button>
                <button type="button">\u2039</button><button type="button">0</button><button type="button">\u2713</button>
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
        },
      },
      "achat-liste-erreur": { kind: "simple", options: { ...ticketBase(), icon: "error", title: "Erreur", text: "Impossible de charger la liste des articles", confirmButtonText: "Fermer" } },
      "achat-panier-vide": { kind: "simple", options: { ...ticketBase(), icon: "warning", title: "Panier vide", text: "Ajoute au moins un produit avant encaissement.", confirmButtonText: "Fermer" } },
      "achat-retirer": { kind: "confirm", options: { ...ticketBase(), title: "Retirer ce produit ?", text: "La ligne sera supprimée du panier.", showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler" } },
      "achat-stock": { kind: "simple", options: { ...ticketBase(), icon: "warning", title: "Stock insuffisant", text: "Cet article n’est plus en stock.", confirmButtonText: "Fermer" } },

      // Paiement
      "pay-encaissement": { kind: "simple", options: { ...ticketPayBase(), title: "Encaissement", html: '<div class="ticket-pay-choice-total">Total à régler : <strong>42,80 €</strong></div><div class="ticket-pay-entry-grid"><button type="button" class="ticket-pay-choice-btn">Encaisser tout</button><button type="button" class="ticket-pay-choice-btn">Encaisser par article</button></div>', showCancelButton: true, cancelButtonText: "Annuler", showConfirmButton: false } },
      "pay-par-article": {
        kind: "simple",
        options: {
          ...ticketPayBase(),
          title: "Encaisser par article",
          html: `
            <div class="ticket-pay-item-list">
              <section class="ticket-pay-item-group">
                <header class="ticket-pay-item-group-title">
                  <span>Produits</span>
                  <span class="ticket-pay-item-group-count">2 ligne(s)</span>
                </header>
                <div class="ticket-pay-item-group-body">
                  <div class="ticket-pay-item-row">
                    <label class="ticket-pay-item-check">
                      <input type="checkbox" checked>
                      <span class="ticket-pay-item-lib">Eau 1L</span>
                    </label>
                    <div class="ticket-pay-item-meta">
                      <span class="ticket-pay-item-unit">1,20 € / unité</span>
                      <span class="ticket-pay-item-total">2,40 €</span>
                    </div>
                    <label class="ticket-pay-item-qty">
                      <span>Qté</span>
                      <input type="number" min="1" max="2" step="1" value="2">
                    </label>
                  </div>
                  <div class="ticket-pay-item-row">
                    <label class="ticket-pay-item-check">
                      <input type="checkbox" checked>
                      <span class="ticket-pay-item-lib">Sandwich Jambon-Beurre</span>
                    </label>
                    <div class="ticket-pay-item-meta">
                      <span class="ticket-pay-item-unit">3,99 € / unité</span>
                      <span class="ticket-pay-item-total">3,99 €</span>
                    </div>
                    <div class="ticket-pay-item-qty-fixed">Qté 1</div>
                  </div>
                </div>
              </section>
              <section class="ticket-pay-item-group">
                <header class="ticket-pay-item-group-title">
                  <span>Carburants / Énergie</span>
                  <span class="ticket-pay-item-group-count">1 ligne(s)</span>
                </header>
                <div class="ticket-pay-item-group-body">
                  <div class="ticket-pay-item-row">
                    <label class="ticket-pay-item-check">
                      <input type="checkbox" checked>
                      <span class="ticket-pay-item-lib">Carburant SP95 pompe 2</span>
                    </label>
                    <div class="ticket-pay-item-meta">
                      <span class="ticket-pay-item-unit">1,80 € / unité</span>
                      <span class="ticket-pay-item-total">35,60 €</span>
                    </div>
                    <div class="ticket-pay-item-qty-fixed">Qté 1</div>
                  </div>
                </div>
              </section>
            </div>
            <div class="ticket-pay-item-hint">Sélectionnez les lignes à encaisser et la quantité des produits.</div>
          `,
          customClass: {
            ...ticketPayBase().customClass,
            popup: "ticket-swal-popup ticket-swal-popup-items",
          },
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: "Valider",
          cancelButtonText: "Annuler",
          allowOutsideClick: false,
        },
      },
      "pay-choix": {
        kind: "simple",
        options: {
          ...ticketPayBase(),
          title: "Choix du paiement",
          html: `
            <div class="ticket-pay-split">
              <div class="ticket-pay-choice-total">Total à régler : <strong>42,80 €</strong></div>
              <div class="ticket-pay-cce-limit">
                Sous-total énergie (payable CCE) : <strong>15,50 €</strong>
              </div>
              <div class="ticket-pay-cce-balance">
                Carte CCE scannée #12 — Solde : <strong>60,00 €</strong> — Plafond CCE : <strong>15,50 €</strong>
              </div>
              <div class="ticket-pay-split-top">
                <label class="ticket-pay-split-share">
                  <input type="checkbox" checked>
                  <span>Partager</span>
                </label>
                <select class="ticket-pay-split-mode">
                  <option value="montants" selected>Montants</option>
                  <option value="equitablement">Équitablement</option>
                  <option value="parts">Parts</option>
                </select>
              </div>
              <div class="ticket-pay-split-list">
                <div class="ticket-pay-split-row is-active-edit" data-pay-row="cb">
                  <label class="ticket-pay-split-method">
                    <input type="checkbox" checked>
                    <span>Carte bleue</span>
                  </label>
                  <input type="number" step="0.01" min="0" class="ticket-pay-split-edit" value="27.30">
                  <div class="ticket-pay-split-amount">27,30 €</div>
                  <button type="button" class="ticket-pay-add-rest">Ajouter reste</button>
                </div>
                <div class="ticket-pay-split-row" data-pay-row="cce">
                  <label class="ticket-pay-split-method">
                    <input type="checkbox" checked>
                    <span>CCE</span>
                  </label>
                  <input type="number" step="0.01" min="0" class="ticket-pay-split-edit" value="15.50">
                  <div class="ticket-pay-split-amount">15,50 €</div>
                  <button type="button" class="ticket-pay-add-rest">Ajouter reste</button>
                </div>
                <div class="ticket-pay-split-row is-disabled" data-pay-row="especes">
                  <label class="ticket-pay-split-method">
                    <input type="checkbox">
                    <span>Espèces</span>
                  </label>
                  <input type="number" step="0.01" min="0" class="ticket-pay-split-edit" value="">
                  <div class="ticket-pay-split-amount">0,00 €</div>
                  <button type="button" class="ticket-pay-add-rest">Ajouter reste</button>
                </div>
              </div>
              <div class="ticket-pay-keypad" data-pay-keypad>
                <div class="ticket-pay-keypad-head">
                  Saisie TPE : <strong>Carte bleue</strong>
                </div>
                <div class="ticket-pay-keypad-display-wrap">
                  <div class="ticket-pay-keypad-display">27,30 €</div>
                </div>
                <div class="ticket-pay-keypad-grid">
                  <button type="button">1</button><button type="button">2</button><button type="button">3</button>
                  <button type="button">4</button><button type="button">5</button><button type="button">6</button>
                  <button type="button">7</button><button type="button">8</button><button type="button">9</button>
                  <button type="button">\u2039</button><button type="button">0</button><button type="button">C</button>
                </div>
              </div>
              <div class="ticket-pay-split-note"></div>
            </div>
          `,
          customClass: {
            ...ticketPayBase().customClass,
            popup: "ticket-swal-popup ticket-swal-popup-split",
          },
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonText: "Valider",
          cancelButtonText: "Annuler",
          allowOutsideClick: false,
          allowEscapeKey: true,
          backdrop: "rgba(26, 26, 46, 0.45)",
        },
      },
      "pay-scan-indispo": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Scan CCE indisponible", html: "Ce navigateur ne supporte pas le canal de communication du scan CCE.", confirmButtonText: "Fermer" } },
      "pay-scan-cce": { kind: "simple", options: { ...ticketPayBase(), title: "Scanner CCE", html: '<div style="text-align:center;padding:10px 0;"><div style="margin-bottom:14px;color:var(--text-mid,#4b5563);font-size:13px;">En attente de la sélection d’une carte sur le site de simulation...</div><div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:ticket-wait-pulse 1.2s ease-in-out infinite;"></div><style>@keyframes ticket-wait-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style></div>', showConfirmButton: false, showCancelButton: true, cancelButtonText: "Annuler", allowOutsideClick: false } },
      "pay-solde-ko": { kind: "simple", options: { ...ticketPayBase(), icon: "warning", title: "Solde CCE insuffisant", html: "Solde courant : <strong>5.00 EUR</strong><br>Montant CCE : <strong>18.20 EUR</strong>", confirmButtonText: "Fermer" } },
      "pay-cce-invalide": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Carte CCE invalide", html: "Aucune carte CCE valide n’a été scannée.", confirmButtonText: "Fermer" } },
      "pay-cce-indispo": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Carte CCE indisponible", html: "Impossible de charger la carte CCE scannée.", confirmButtonText: "Fermer" } },
      "pay-cce-loading": { kind: "loading", options: { ...ticketPayBase(), title: "Paiement CCE en cours", html: "Validation du paiement CCE...", allowOutsideClick: false, showConfirmButton: false } },
      "pay-cb-loading": { kind: "loading", options: { ...ticketPayBase(), title: "Paiement carte bleue en cours", html: "Connexion au terminal CB...", allowOutsideClick: false, showConfirmButton: false } },
      "pay-especes": {
        kind: "simple",
        options: {
          html: `
            <div class="ticket-barcode-modal ticket-barcode-modal--cash">
              <button type="button" class="ticket-barcode-close" aria-label="Fermer">X</button>
              <div class="ticket-barcode-total">Total à régler : <strong>42.80 EUR</strong></div>
              <div class="ticket-barcode-display-wrap">
                <div class="ticket-barcode-display ticket-barcode-display--cash">0.00 EUR</div>
              </div>
              <div class="ticket-barcode-error"></div>
              <div class="ticket-barcode-keypad">
                <button type="button">1</button><button type="button">2</button><button type="button">3</button>
                <button type="button">4</button><button type="button">5</button><button type="button">6</button>
                <button type="button">7</button><button type="button">8</button><button type="button">9</button>
                <button type="button">\u2039</button><button type="button">0</button><button type="button">\u2713</button>
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
        },
      },
      "pay-recu": { kind: "yesno", options: { ...ticketPayBase(), reverseButtons: false, title: "Souhaitez-vous un reçu ?", html: "Voulez-vous imprimer un reçu de paiement ?", showDenyButton: true, showCancelButton: false, confirmButtonText: "Oui", denyButtonText: "Non", allowOutsideClick: false } },
      "pay-ok": { kind: "simple", options: { ...ticketPayBase(), icon: "success", title: "Paiement accepté", html: '<div>CCE : <strong>12.50 EUR</strong></div><div>Espèces : <strong>10.00 EUR</strong></div><div style="margin-top:8px;">Impression en cours...</div>', confirmButtonText: "Fermer", allowOutsideClick: false } },
      "pay-ko": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Paiement refusé", html: "Impossible d’enregistrer la transaction.", confirmButtonText: "Fermer" } },

      // CCE
      "cce-scanner": { kind: "simple", options: { title: "Scanner CCE", html: '<div style="text-align:center;padding:20px 0;"><div style="margin-bottom:16px;color:var(--text-mid,#4b5563);font-size:13px;">En attente de la sélection d\'une carte sur le simulateur...</div><div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:cce-wait-pulse 1.2s ease-in-out infinite;"></div><style>@keyframes cce-wait-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style></div>', ...cceBase(), showConfirmButton: false, showCancelButton: true, cancelButtonText: "Annuler", allowOutsideClick: false } },
      "cce-actions": { kind: "simple", options: { title: "Actions", html: '<div class="cce-actions-card">Carte #12</div><div class="cce-actions-grid"><button type="button" class="cce-actions-btn">Recharger CCE</button><button type="button" class="cce-actions-btn">Consulter transactions</button><button type="button" class="cce-actions-btn">Informations bonus</button><button type="button" class="cce-actions-btn">Fin consultation</button></div>', ...cceBase(), customClass: { ...cceBase().customClass, popup: "cce-swal-popup cce-swal-popup-actions" }, showConfirmButton: false, showCancelButton: false, showCloseButton: true } },
      "cce-min": { kind: "simple", options: { ...cceBase(), icon: "warning", title: "Montant insuffisant", text: "Le montant minimum de rechargement est de 50.00 EUR.", confirmButtonText: "Fermer" } },
      "cce-bonus": { kind: "simple", options: { ...cceBase(), title: "Informations bonus", html: 'Bonus à partir de 100 EUR : <strong>10.00 EUR</strong><br>Bonus à partir de 200 EUR : <strong>25.00 EUR</strong>', confirmButtonText: "Fermer" } },
      "cce-tx": { kind: "simple", options: { ...cceBase(), title: "Transactions CCE — carte #12", html: '<div style="text-align:left">12/03/2026 — Paiement — -18.40€<br>10/03/2026 — Rechargement — +50.00€</div>', confirmButtonText: "Fermer" } },
      "cce-recharge-ko": { kind: "simple", options: { ...cceBase(), icon: "error", title: "Rechargement impossible", text: "Une erreur est survenue.", confirmButtonText: "Fermer" } },
      "cce-create-confirm": { kind: "confirm", options: { ...ticketBase(), reverseButtons: false, icon: "question", title: "Confirmer la création de la carte CCE", showCancelButton: true, confirmButtonText: "Valider", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "cce-code": { kind: "simple", options: { ...ticketBase(), reverseButtons: false, icon: "info", title: "Le client choisit son code", html: '<div style="text-align:center;padding:8px 0;"><div style="margin-bottom:12px;">Saisie en attente sur le TPE du simulateur...</div><div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:cce-create-wait 1.2s ease-in-out infinite;"></div><style>@keyframes cce-create-wait{0%,100%{opacity:.3}50%{opacity:1}}</style></div>', showConfirmButton: false, showCancelButton: true, cancelButtonText: "Annuler", allowOutsideClick: false, allowEscapeKey: false } },
      "cce-create-cancel": { kind: "simple", options: { ...ticketBase(), reverseButtons: false, icon: "error", title: "Création CCE annulée", confirmButtonText: "Fermer" } },
      "cce-create-ok": { kind: "simple", options: { ...ticketBase(), reverseButtons: false, icon: "success", title: "Création CCE terminée", html: "Carte #12 créée pour <strong>Saskia Blanc</strong>.", confirmButtonText: "Fermer" } },
      "cce-create-ko": { kind: "simple", options: { ...ticketBase(), reverseButtons: false, icon: "error", title: "Création CCE impossible", html: "Une erreur est survenue pendant la création.", confirmButtonText: "Fermer" } },
      "cce-recharge-amount": {
        kind: "simple",
        options: {
          html: `
            <div class="ticket-barcode-modal">
              <button type="button" class="ticket-barcode-close" aria-label="Fermer">X</button>
              <div class="cce-recharge-title">Montant à ajouter</div>
              <div class="ticket-barcode-display-wrap">
                <div class="ticket-barcode-display">0.00 EUR</div>
              </div>
              <div class="ticket-barcode-error"></div>
              <div class="ticket-barcode-keypad">
                <button type="button">1</button><button type="button">2</button><button type="button">3</button>
                <button type="button">4</button><button type="button">5</button><button type="button">6</button>
                <button type="button">7</button><button type="button">8</button><button type="button">9</button>
                <button type="button">\u2039</button><button type="button">0</button><button type="button">\u2713</button>
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
        },
      },
      "cce-transactions": {
        kind: "simple",
        options: {
          ...cceBase(),
          title: "Transactions CCE — carte #12",
          html: `
            <div class="cce-transactions-view">
              <div class="cce-transactions-meta">
                <div class="cce-transactions-meta-cell"><span class="cce-transactions-meta-label">ID CCE</span><span class="cce-transactions-meta-value">12</span></div>
                <div class="cce-transactions-meta-cell"><span class="cce-transactions-meta-label">ID CLIENT</span><span class="cce-transactions-meta-value">8</span></div>
                <div class="cce-transactions-meta-cell"><span class="cce-transactions-meta-label">Nom</span><span class="cce-transactions-meta-value">Bachov</span></div>
                <div class="cce-transactions-meta-cell"><span class="cce-transactions-meta-label">Prénom</span><span class="cce-transactions-meta-value">Camilia</span></div>
                <div class="cce-transactions-meta-cell cce-transactions-meta-cell--solde"><span class="cce-transactions-meta-label">Solde</span><span class="cce-transactions-meta-value">58.70 EUR</span></div>
              </div>
              <div class="cce-transactions-subhead">
                <div class="cce-transactions-last">Dernier apport : 50.00 EUR (12/03/2026)</div>
                <button type="button" class="cce-transactions-recharge">Rechargement CCE</button>
              </div>
              <div class="cce-transactions-title">Transactions</div>
              <div class="cce-transactions-table-wrap">
                <table class="cce-transactions-table">
                  <thead>
                    <tr><th>ID Transaction</th><th>Transaction Name</th><th>Quantité</th><th>Montant Total</th><th>Date</th><th>Heure</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>2036</td><td>Recharge CCE</td><td>—</td><td>+50.00 EUR</td><td>01/04/2026</td><td>09:22:49</td></tr>
                    <tr><td>2095</td><td>Paiement CCE</td><td>1</td><td>-12.50 EUR</td><td>03/04/2026</td><td>21:03:23</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          `,
          customClass: {
            ...cceBase().customClass,
            popup: "cce-swal-popup cce-swal-popup-transactions",
          },
          confirmButtonText: "Fermer",
        },
      },
      "cce-recharge-ok": {
        kind: "simple",
        options: {
          ...cceBase(),
          icon: "success",
          title: "Paiement accepté",
          html: `
            <div>Espèces : <strong>50.00 EUR</strong></div>
            <div style="margin-top:8px;">Bonus CCE appliqué : <strong>10.00 EUR</strong></div>
            <div>Montant crédité : <strong>60.00 EUR</strong></div>
            <div style="margin-top:8px;">Rechargement CCE effectué avec succès.</div>
          `,
          confirmButtonText: "Valider",
          allowOutsideClick: false,
        },
      },
      "cce-transactions-ko": { kind: "simple", options: { ...cceBase(), icon: "error", title: "Transactions CCE", text: "Chargement des transactions CCE impossible.", confirmButtonText: "Fermer" } },

      // Gérant
      "gerant-bdd-ok": { kind: "simple", options: { ...bddBase(), icon: "success", title: "Modification enregistrée", confirmButtonText: "Fermer", allowOutsideClick: false } },
      "gerant-bdd-error": { kind: "simple", options: { ...bddBase(), icon: "error", title: "Erreur", html: "Impossible de sauvegarder la ligne demandée.", confirmButtonText: "Fermer", allowOutsideClick: false } },
      "gerant-bdd-confirm": { kind: "confirm", options: { ...bddBase(), icon: "question", html: '<p class="bdd-confirm-msg">Confirmer la modification de cette ligne ?</p><p class="bdd-confirm-ref">(Référence : Id 12)</p>', showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Confirmer", allowOutsideClick: false } },
      "gerant-bdd-add-ko": { kind: "simple", options: { ...bddBase(), icon: "info", title: "Ajout non disponible", html: "Cette table se gère via son panel dédié.", showCloseButton: true, showConfirmButton: false, allowOutsideClick: false } },
      "gerant-bdd-add": { kind: "confirm", options: { ...bddBase(), title: "Ajouter une ligne", html: '<div class="bdd-form"><label class="bdd-form-row"><span class="bdd-form-label">Code-barres</span><input class="bdd-form-input" type="text" placeholder="Ex : 3700000000101"></label><label class="bdd-form-row"><span class="bdd-form-label">Libellé</span><input class="bdd-form-input" type="text" placeholder="Nom du produit"></label><label class="bdd-form-row"><span class="bdd-form-label">Prix</span><input class="bdd-form-input" type="number" placeholder="0.00"></label></div>', showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Confirmer", allowOutsideClick: false } },
      "gerant-bdd-edit": { kind: "confirm", options: { ...bddBase(), title: "Modifier la ligne", html: '<div class="bdd-form"><label class="bdd-form-row"><span class="bdd-form-label">Code-barres</span><input class="bdd-form-input" type="text" value="3245390214024" disabled></label><label class="bdd-form-row"><span class="bdd-form-label">Libellé</span><input class="bdd-form-input" type="text" value="Allumettes x40"></label><label class="bdd-form-row"><span class="bdd-form-label">Prix</span><input class="bdd-form-input" type="number" value="0.910"></label></div>', showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Confirmer", allowOutsideClick: false } },
      "gerant-bdd-delete": { kind: "confirm", options: { ...bddBase(), icon: "warning", title: "Supprimer la ligne ?", html: "Cette action peut supprimer des dépendances.", showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Supprimer" } },
      "gerant-horaires-ko": { kind: "simple", options: { ...hbBase(), icon: "error", title: "Erreur : Valeurs Incorrectes.", confirmButtonText: "Fermer" } },
      "gerant-horaires-ok": { kind: "simple", options: { ...hbBase(), icon: "success", title: "Nouveaux horaires bien enregistrés pour lundi, mardi !", confirmButtonText: "Fermer" } },
      "gerant-horaires-copy": {
        kind: "simple",
        options: {
          ...hbBase(),
          width: "74rem",
          title: "Appliquer pareil pour les jours suivants ?",
          html: `
            <div class="hb-apply-grid">
              <label class="hb-apply-item"><span>Lundi</span><input type="checkbox" class="hb-apply-check" checked disabled /></label>
              <label class="hb-apply-item"><span>Mardi</span><input type="checkbox" class="hb-apply-check" /></label>
              <label class="hb-apply-item"><span>Mercredi</span><input type="checkbox" class="hb-apply-check" /></label>
              <label class="hb-apply-item"><span>Jeudi</span><input type="checkbox" class="hb-apply-check" /></label>
              <label class="hb-apply-item"><span>Vendredi</span><input type="checkbox" class="hb-apply-check" /></label>
              <label class="hb-apply-item"><span>Samedi</span><input type="checkbox" class="hb-apply-check" /></label>
              <label class="hb-apply-item"><span>Dimanche</span><input type="checkbox" class="hb-apply-check" /></label>
              <label class="hb-apply-item hb-apply-item--all"><span>Tout</span><input type="checkbox" /></label>
            </div>
          `,
          showCloseButton: true,
          confirmButtonText: "Appliquer",
          allowOutsideClick: false,
        },
      },
      "gerant-incident-form": {
        kind: "confirm",
        options: {
          ...fiBase(),
          html: `
            <div class="fi-form">
              <label class="fi-form-row">
                <span class="fi-form-label">Référence Unique</span>
                <input id="fi-ref" class="fi-form-input fi-form-input--readonly" type="text" value="INC-2026-001" readonly />
              </label>

              <label class="fi-form-row">
                <span class="fi-form-label">Date</span>
                <input id="fi-date" class="fi-form-input" type="text" value="07/04/2026" />
              </label>

              <label class="fi-form-row">
                <span class="fi-form-label">Heure</span>
                <input id="fi-time" class="fi-form-input" type="text" value="10:30:00" />
              </label>

              <label class="fi-form-row">
                <span class="fi-form-label">Type</span>
                <input id="fi-type" class="fi-form-input" type="text" placeholder="Accident Travail" value="Pompe inactive" />
              </label>

              <label class="fi-form-row fi-form-row--textarea">
                <span class="fi-form-label">Détail Technique</span>
                <textarea id="fi-detail" class="fi-form-textarea" placeholder="Détail technique...">La pompe 2 ne démarre plus.</textarea>
              </label>

              <label class="fi-form-row fi-form-row--textarea">
                <span class="fi-form-label">Solution</span>
                <textarea id="fi-solution" class="fi-form-textarea" placeholder="Solution...">Redémarrage du module et vérification pression.</textarea>
              </label>
            </div>
          `,
          showCloseButton: true,
          showCancelButton: true,
          cancelButtonText: "Annuler",
          confirmButtonText: "Confirmer",
          allowOutsideClick: false,
          focusConfirm: false,
        },
      },
      "gerant-incident-cancel": { kind: "simple", options: { ...fiBase(), icon: "error", title: "Opération Annulée", confirmButtonText: "Fermer" } },
      "gerant-incident-ok": { kind: "simple", options: { ...fiBase(), icon: "success", title: "Fiche incident #INC-2026-001 a été créée", confirmButtonText: "Fermer" } },
      "gerant-incident-ko": { kind: "simple", options: { ...fiBase(), icon: "error", title: "Création impossible", confirmButtonText: "Fermer" } },
      "gerant-fermeture-add": { kind: "confirm", options: { icon: "question", title: "Ajouter un jour annuel ?", text: "Ce jour de fermeture sera répété chaque année.", showCancelButton: true, confirmButtonText: "Confirmer l'ajout", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "gerant-fermeture-add-exception": { kind: "confirm", options: { icon: "question", title: "Ajouter un jour exceptionnel ?", text: "Ce jour de fermeture sera ajouté une seule fois.", showCancelButton: true, confirmButtonText: "Confirmer l'ajout", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "gerant-fermeture-delete": { kind: "confirm", options: { icon: "warning", title: "Supprimer ce jour de fermeture ?", text: "Cette action est irréversible.", showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "gerant-cce-bonus-delete": { kind: "confirm", options: { ...cceBase(), icon: "warning", title: "Supprimer la tranche bonus ?", text: "Cette tranche bonus sera supprimée définitivement.", showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "gerant-cce-bonus-delete-new": { kind: "confirm", options: { ...cceBase(), icon: "warning", title: "Supprimer la tranche bonus ?", text: "Cette tranche bonus non enregistrée sera retirée.", showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "gerant-cce-popup-info": { kind: "simple", options: { ...cceBase(), icon: "success", title: "Valeurs modifiées", text: "Le montant minimum a bien été mis à jour.", confirmButtonText: "Fermer", allowOutsideClick: false } },
      "gerant-prix-popup-info": { kind: "simple", options: { icon: "success", title: "Prix modifiés", text: "Seuls les prix carburant ont été mis à jour.", confirmButtonText: "Fermer", allowOutsideClick: false } },
      "gerant-reappro-defauts-popup": { kind: "simple", options: { icon: "success", title: "Valeurs enregistrées", text: "3 articles ont été mis à jour.", confirmButtonText: "Fermer", allowOutsideClick: false } },
      "gerant-reappro-defauts-confirm": { kind: "confirm", options: { icon: "question", title: "Confirmer les nouvelles valeurs ?", text: "Les paramètres de réapprovisionnement seront mis à jour pour 3 articles.", showCancelButton: true, confirmButtonText: "Confirmer", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "gerant-reappro-arrivee": { kind: "confirm", options: { icon: "question", title: "Réapprovisionnement #42", text: "Passer le statut de « En cours » à « Arrivé » ?", showCancelButton: true, confirmButtonText: "Confirmer", cancelButtonText: "Annuler" } },
      "gerant-reappro-annuler": { kind: "confirm", options: { icon: "warning", title: "Annuler le réapprovisionnement #42 ?", text: "Le statut passera à Annulé. Cette action est irréversible.", showCancelButton: true, confirmButtonText: "Confirmer l'annulation", cancelButtonText: "Retour" } },
      "gerant-reappro-ok": {
        kind: "simple",
        options: {
          icon: "success",
          title: "Commande envoyée",
          html:
            '<div style="text-align:left;font-size:13px;">' +
            "<b>N° Ordre :</b> #42<br>" +
            "<b>Statut :</b> En cours<br>" +
            "<b>Date :</b> 07/04/2026<br><br>" +
            '<table style="width:100%;font-size:12px;">' +
            '<tr><th style="text-align:left">Article</th><th style="text-align:right">Qté</th></tr>' +
            "<tr><td>Pain au chocolat</td><td style='text-align:right;padding-left:12px'>12</td></tr>" +
            "<tr><td>Coca-Cola 50cl</td><td style='text-align:right;padding-left:12px'>8</td></tr>" +
            "</table></div>",
          confirmButtonText: "Fermer",
        },
      },
      "gerant-reappro-auto-review": {
        kind: "confirm",
        options: {
          icon: "warning",
          title: "Réappro auto #12",
          html: `
            <div class="ra-auto-dialog">
              <div class="ra-auto-dialog__intro">
                Le seuil d'alerte a déclenché un réapprovisionnement automatique. Cliquez sur « Modifier le réappro » pour ouvrir la saisie, puis sur « Valider le réappro » pour enregistrer.
              </div>
              <div class="ra-auto-dialog__table-wrap">
                <table class="ra-auto-dialog__table">
                  <thead>
                    <tr><th>Article</th><th>Stock</th><th>Seuil</th><th>Quantité</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div class="ra-auto-dialog__name">Allumettes x40</div>
                        <div class="ra-auto-dialog__meta">3245390214024</div>
                      </td>
                      <td class="ra-auto-dialog__num">59 <span class="ra-auto-dialog__unit">qte</span></td>
                      <td class="ra-auto-dialog__num">60 <span class="ra-auto-dialog__unit">qte</span></td>
                      <td>
                        <div class="ra-auto-dialog__input-wrap">
                          <input class="ra-auto-dialog__input is-editable" type="number" min="1" step="1" value="10">
                          <span class="ra-auto-dialog__unit">qte</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `,
          width: 900,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showDenyButton: true,
          showCancelButton: true,
          customClass: {
            popup: "ra-swal-auto-review",
            htmlContainer: "ra-swal-auto-review-html",
          },
          confirmButtonText: "Valider le réappro",
          denyButtonText: "Modifier le réappro",
          cancelButtonText: "Annuler le réappro",
        },
      },
      "gerant-reappro-auto-validated": {
        kind: "simple",
        options: {
          icon: "success",
          title: "Réapprovisionnement validé",
          html:
            '<div style="text-align:left;font-size:13px;">' +
            "<b>N° Ordre :</b> #42<br>" +
            "<b>Statut :</b> En cours<br>" +
            "<b>Validation :</b> validé après modification (1 ligne ajustée)</div>",
          confirmButtonText: "Fermer",
          allowOutsideClick: false,
        },
      },
      "gerant-reappro-auto-employe": {
        kind: "simple",
        options: {
          icon: "warning",
          title: "Seuil d'alerte atteint",
          html: `
            <div class="ra-auto-dialog ra-auto-dialog--employe">
              <div class="ra-auto-dialog__intro">
                Un réapprovisionnement automatique a été lancé. Prévenez le gérant pour ajuster ou confirmer la commande.
              </div>
              <div class="ra-auto-dialog__meta-line"><b>N° ordre :</b> #42</div>
              <table class="ra-auto-dialog__mini-table">
                <tr><td style="padding:4px 10px 4px 0;text-align:left;">Coca-Cola 50cl</td><td style="padding:4px 0;text-align:right;">20 qte</td></tr>
                <tr><td style="padding:4px 10px 4px 0;text-align:left;">SP95</td><td style="padding:4px 0;text-align:right;">800.000 L</td></tr>
              </table>
            </div>
          `,
          confirmButtonText: "Compris",
        },
      },
      "gerant-reappro-auto-fallback": { kind: "simple", options: { icon: "warning", title: "Seuil d'alerte atteint", text: "Le réapprovisionnement automatique a été créé, mais son détail n'a pas pu être chargé.", confirmButtonText: "Fermer" } },
      "gerant-validation": { kind: "confirm", options: { ...bddBase(), icon: "warning", title: "Confirmer la validation ?", html: '<p style="font-family:var(--mono);font-size:13px;line-height:1.6">Table <strong>transactions</strong> — 31/03/2026<br>Cette table sera définitivement verrouillée.</p>', showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Valider", allowOutsideClick: false } },

      // Carburant / Électricité
      "carb-info-none": { kind: "simple", options: { ...ticketBase(), icon: "info", title: "Pompe n°2", text: "Aucune transaction en cours ou passée.", confirmButtonText: "OK" } },
      "carb-info-detail": {
        kind: "simple",
        options: {
          ...ticketBase(),
          title: "Informations pompe n°2",
          html: `
            <div class="pompe-info-grid">
              <div class="pompe-info-row"><span class="pompe-info-label">Numéro pompe</span><span class="pompe-info-value">2</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Nature délivrée</span><span class="pompe-info-value">Carburant SP95</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Quantité délivrée</span><span class="pompe-info-value">26.53 L</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Total à payer</span><span class="pompe-info-value">47.76 €</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Date / heure</span><span class="pompe-info-value">03/04/2026 15:10:12</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Carte utilisée</span><span class="pompe-info-value">Carte CCE #12</span></div>
            </div>
          `,
          confirmButtonText: "Fermer",
        },
      },
      "elec-info-none": { kind: "simple", options: { ...ticketBase(), icon: "info", title: "Borne n°7", text: "Aucune transaction en cours ou passée.", confirmButtonText: "OK" } },
      "elec-info-detail": {
        kind: "simple",
        options: {
          ...ticketBase(),
          title: "Informations borne n°7",
          html: `
            <div class="pompe-info-grid">
              <div class="pompe-info-row"><span class="pompe-info-label">Numéro borne</span><span class="pompe-info-value">7</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Nature délivrée</span><span class="pompe-info-value">Chargeur rapide</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Quantité délivrée</span><span class="pompe-info-value">21.91 kWh</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Total à payer</span><span class="pompe-info-value">14.24 €</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Date / heure</span><span class="pompe-info-value">02/04/2026 11:58:02</span></div>
              <div class="pompe-info-row"><span class="pompe-info-label">Carte utilisée</span><span class="pompe-info-value">Carte CCE #12</span></div>
            </div>
          `,
          confirmButtonText: "Fermer",
        },
      },

      // Système
      "sys-seuil": {
        kind: "confirm",
        options: {
          icon: "warning",
          title: "Réappro auto #12",
          html: `
            <div class="ra-auto-dialog">
              <div class="ra-auto-dialog__intro">
                Le seuil d'alerte a déclenché un réapprovisionnement automatique. Cliquez sur « Modifier le réappro » pour ouvrir la saisie, puis sur « Valider le réappro » pour enregistrer.
              </div>
              <div class="ra-auto-dialog__table-wrap">
                <table class="ra-auto-dialog__table">
                  <thead>
                    <tr><th>Article</th><th>Stock</th><th>Seuil</th><th>Quantité</th></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div class="ra-auto-dialog__name">Allumettes x40</div>
                        <div class="ra-auto-dialog__meta">3245390214024</div>
                      </td>
                      <td class="ra-auto-dialog__num">59 <span class="ra-auto-dialog__unit">qte</span></td>
                      <td class="ra-auto-dialog__num">60 <span class="ra-auto-dialog__unit">qte</span></td>
                      <td>
                        <div class="ra-auto-dialog__input-wrap">
                          <input class="ra-auto-dialog__input is-editable" type="number" min="1" step="1" value="10">
                          <span class="ra-auto-dialog__unit">qte</span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `,
          width: 900,
          allowOutsideClick: false,
          allowEscapeKey: false,
          showDenyButton: true,
          showCancelButton: true,
          customClass: {
            popup: "ra-swal-auto-review",
            htmlContainer: "ra-swal-auto-review-html",
          },
          confirmButtonText: "Valider le réappro",
          denyButtonText: "Modifier le réappro",
          cancelButtonText: "Annuler le réappro",
        },
      },
      "pay-cce-pin-wait": { kind: "simple", options: { ...ticketPayBase(), title: "Le client saisit son code CCE", html: '<div style="text-align:center;padding:10px 0;"><div style="margin-bottom:14px;color:var(--text-mid,#4b5563);font-size:13px;">Saisie en attente sur le terminal du simulateur...</div><div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:ticket-wait-pulse 1.2s ease-in-out infinite;"></div><style>@keyframes ticket-wait-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style></div>', showConfirmButton: false, showCancelButton: true, cancelButtonText: "Annuler", allowOutsideClick: false, allowEscapeKey: false } },
      "pay-cce-pin-failed": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Paiement CCE annulé", html: "Code CCE incorrect après 3 tentatives.", confirmButtonText: "Fermer" } },
      "pay-cce-pin-indispo": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Saisie code CCE indisponible", html: "Ce navigateur ne supporte pas le canal de communication du code CCE.", confirmButtonText: "Fermer" } },
    };
  }

  async function showByDefinition(def) {
    const kind = String(def?.kind || "simple");
    const options = { ...(def?.options || {}) };
    if (kind === "loading") {
      Swal.fire({
        ...options,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      Swal.close();
      return;
    }

    if (kind === "timer") {
      await Swal.fire({
        ...options,
        showConfirmButton: false,
        timer: options.timer || 3000,
      });
      return;
    }

    await Swal.fire(options);
  }

  async function runPopup(payload) {
    if (typeof Swal === "undefined" || !payload) return;
    const id = String(payload.id || "");
    const defs = popupDefinitions();
    if (id && defs[id]) {
      await showByDefinition(defs[id]);
      return;
    }

    // fallback ancien format
    const kind = String(payload.kind || "simple");
    const opts = payload.opts || {};
    const def = {
      kind,
      options: {
        ...ticketBase(),
        title: opts.title || "Popup",
        text: opts.text || undefined,
        html: opts.html || undefined,
        icon: opts.icon || undefined,
        confirmButtonText: "Fermer",
      },
    };
    await showByDefinition(def);
  }

  function readPayload(message) {
    if (!message || message.type !== "popup-trigger") return null;
    return message.payload || null;
  }

  function onChannelMessage(event) {
    const payload = readPayload(event?.data);
    if (!payload) return;
    runPopup(payload);
  }

  function onStorageMessage(event) {
    if (!event || event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const data = JSON.parse(event.newValue);
      const payload = readPayload(data);
      if (!payload) return;
      runPopup(payload);
    } catch (_) {}
  }

  function init() {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.addEventListener("message", onChannelMessage);
      } catch (_) {}
    }
    window.addEventListener("storage", onStorageMessage);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
