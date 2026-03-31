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
      "achat-liste": { kind: "simple", options: { ...ticketBase(), title: "Liste articles", html: '<div class="ticket-list-wrap"><table class="ticket-list-table"><thead><tr><th>Code-barres</th><th>Article</th></tr></thead><tbody><tr><td>3760123456789</td><td>Eau 1L</td></tr><tr><td>3017620425035</td><td>Chips</td></tr></tbody></table></div>', confirmButtonText: "Fermer" } },
      "achat-panier-vide": { kind: "simple", options: { ...ticketBase(), icon: "warning", title: "Panier vide", text: "Ajoute au moins un produit avant encaissement.", confirmButtonText: "Fermer" } },
      "achat-retirer": { kind: "confirm", options: { ...ticketBase(), title: "Retirer ce produit ?", text: "La ligne sera supprimée du panier.", showCancelButton: true, confirmButtonText: "Supprimer", cancelButtonText: "Annuler" } },
      "achat-stock": { kind: "simple", options: { ...ticketBase(), icon: "warning", title: "Stock insuffisant", text: "Cet article n’est plus en stock.", confirmButtonText: "Fermer" } },

      // Paiement
      "pay-encaissement": { kind: "simple", options: { ...ticketPayBase(), title: "Encaissement", html: '<div class="ticket-pay-choice-total">Total à régler : <strong>42,80 €</strong></div><div class="ticket-pay-entry-grid"><button type="button" class="ticket-pay-choice-btn">Encaisser tout</button><button type="button" class="ticket-pay-choice-btn">Encaisser par article</button></div>', showCancelButton: true, cancelButtonText: "Annuler", showConfirmButton: false } },
      "pay-par-article": { kind: "simple", options: { ...ticketPayBase(), title: "Encaisser par article", html: '<div class="ticket-pay-item-list"><section class="ticket-pay-item-group"><header class="ticket-pay-item-group-title"><span>Produits</span><span class="ticket-pay-item-group-count">1 ligne(s)</span></header><div class="ticket-pay-item-group-body"><div class="ticket-pay-item-row"><label class="ticket-pay-item-check"><input type="checkbox" checked><span class="ticket-pay-item-lib">Eau 1L</span></label></div></div></section></div><div class="ticket-pay-item-hint">Sélectionnez les lignes à encaisser et la quantité des produits.</div>', showConfirmButton: true, showCancelButton: true, confirmButtonText: "Valider", cancelButtonText: "Annuler" } },
      "pay-choix": { kind: "simple", options: { ...ticketPayBase(), title: "Choix du paiement", html: '<div class="ticket-pay-choice-total">Total à régler : <strong>42,80 €</strong></div><div class="ticket-pay-cce-limit">Sous-total énergie (payable CCE) : <strong>15,50 €</strong></div>', confirmButtonText: "Fermer" } },
      "pay-scan-indispo": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Scan CCE indisponible", html: "Ce navigateur ne supporte pas le canal de communication du scan CCE.", confirmButtonText: "Fermer" } },
      "pay-scan-cce": { kind: "simple", options: { ...ticketPayBase(), title: "Scanner CCE", html: '<div style="text-align:center;padding:10px 0;"><div style="margin-bottom:14px;color:var(--text-mid,#4b5563);font-size:13px;">En attente de la sélection d’une carte sur le site de simulation...</div><div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:ticket-wait-pulse 1.2s ease-in-out infinite;"></div><style>@keyframes ticket-wait-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style></div>', showConfirmButton: false, showCancelButton: true, cancelButtonText: "Annuler", allowOutsideClick: false } },
      "pay-solde-ko": { kind: "simple", options: { ...ticketPayBase(), icon: "warning", title: "Solde CCE insuffisant", html: "Solde courant : <strong>5.00 EUR</strong><br>Montant CCE : <strong>18.20 EUR</strong>", confirmButtonText: "Fermer" } },
      "pay-cce-invalide": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Carte CCE invalide", html: "Aucune carte CCE valide n’a été scannée.", confirmButtonText: "Fermer" } },
      "pay-cce-indispo": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Carte CCE indisponible", html: "Impossible de charger la carte CCE scannée.", confirmButtonText: "Fermer" } },
      "pay-cce-loading": { kind: "loading", options: { ...ticketPayBase(), title: "Paiement CCE en cours", html: "Validation du paiement CCE...", allowOutsideClick: false, showConfirmButton: false } },
      "pay-cb-loading": { kind: "loading", options: { ...ticketPayBase(), title: "Paiement carte bleue en cours", html: "Connexion au terminal CB...", allowOutsideClick: false, showConfirmButton: false } },
      "pay-especes": { kind: "simple", options: { ...ticketPayBase(), title: "Saisie espèces", html: '<div class="ticket-barcode-modal"><div class="ticket-barcode-display-wrap"><div class="ticket-barcode-display">0.00 EUR</div></div></div>', confirmButtonText: "Fermer" } },
      "pay-recu": { kind: "yesno", options: { ...ticketPayBase(), reverseButtons: false, title: "Souhaitez-vous un reçu ?", html: "Voulez-vous imprimer un reçu de paiement ?", showDenyButton: true, showCancelButton: false, confirmButtonText: "Oui", denyButtonText: "Non", allowOutsideClick: false } },
      "pay-ok": { kind: "simple", options: { ...ticketPayBase(), icon: "success", title: "Paiement accepté", html: '<div>CCE : <strong>12.50 EUR</strong></div><div>Espèces : <strong>10.00 EUR</strong></div><div style="margin-top:8px;">Impression en cours...</div>', confirmButtonText: "Fermer", allowOutsideClick: false } },
      "pay-ko": { kind: "simple", options: { ...ticketPayBase(), icon: "error", title: "Paiement refusé", html: "Impossible d’enregistrer la transaction.", confirmButtonText: "Fermer" } },

      // CCE
      "cce-scanner": { kind: "simple", options: { title: "Scanner CCE", html: '<div style="text-align:center;padding:20px 0;"><div style="margin-bottom:16px;color:var(--text-mid,#4b5563);font-size:13px;">En attente de la selection d\'une carte sur le simulateur...</div><div style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--accent,#6366f1);animation:cce-wait-pulse 1.2s ease-in-out infinite;"></div><style>@keyframes cce-wait-pulse{0%,100%{opacity:.3}50%{opacity:1}}</style></div>', ...cceBase(), showConfirmButton: false, showCancelButton: true, cancelButtonText: "Annuler", allowOutsideClick: false } },
      "cce-actions": { kind: "simple", options: { title: "Actions", html: '<div class="cce-actions-card">Carte #12</div><div class="cce-actions-grid"><button type="button" class="cce-actions-btn">Recharger CCE</button><button type="button" class="cce-actions-btn">Consulter transactions</button><button type="button" class="cce-actions-btn">Informations bonus</button><button type="button" class="cce-actions-btn">Fin consultation</button></div>', ...cceBase(), customClass: { ...cceBase().customClass, popup: "cce-swal-popup cce-swal-popup-actions" }, showConfirmButton: false, showCancelButton: false, showCloseButton: true } },
      "cce-min": { kind: "simple", options: { ...cceBase(), icon: "warning", title: "Montant insuffisant", text: "Le montant minimum de rechargement est de 50.00 EUR.", confirmButtonText: "Fermer" } },
      "cce-bonus": { kind: "simple", options: { ...cceBase(), title: "Informations bonus", html: 'Bonus à partir de 100 EUR : <strong>10.00 EUR</strong><br>Bonus à partir de 200 EUR : <strong>25.00 EUR</strong>', confirmButtonText: "Fermer" } },
      "cce-tx": { kind: "simple", options: { ...cceBase(), title: "Transactions CCE — carte #12", html: '<div style="text-align:left">12/03/2026 — Paiement — -18.40€<br>10/03/2026 — Rechargement — +50.00€</div>', confirmButtonText: "Fermer" } },
      "cce-recharge-ko": { kind: "simple", options: { ...cceBase(), icon: "error", title: "Rechargement impossible", text: "Une erreur est survenue.", confirmButtonText: "Fermer" } },
      "cce-create-confirm": { kind: "confirm", options: { ...ticketBase(), reverseButtons: false, icon: "question", title: "Confirmer la création de la carte CCE", showCancelButton: true, confirmButtonText: "Valider", cancelButtonText: "Annuler", allowOutsideClick: false } },
      "cce-code": { kind: "timer", options: { ...ticketBase(), reverseButtons: false, icon: "info", title: "Le client choisit son code", timer: 3000, timerProgressBar: true, showConfirmButton: false, allowOutsideClick: false, allowEscapeKey: false } },
      "cce-create-cancel": { kind: "simple", options: { ...ticketBase(), reverseButtons: false, icon: "error", title: "Création CCE annulée", confirmButtonText: "Fermer" } },
      "cce-create-ok": { kind: "simple", options: { ...ticketBase(), reverseButtons: false, icon: "success", title: "Création CCE terminée", html: "Carte #12 créée pour <strong>Saskia Blanc</strong>.", confirmButtonText: "Fermer" } },
      "cce-create-ko": { kind: "simple", options: { ...ticketBase(), reverseButtons: false, icon: "error", title: "Création CCE impossible", html: "Une erreur est survenue pendant la création.", confirmButtonText: "Fermer" } },

      // Gérant
      "gerant-bdd-add-ko": { kind: "simple", options: { ...bddBase(), icon: "error", title: "Ajout non disponible", html: "Ajout indisponible sur cette table.", showCloseButton: true, showConfirmButton: false, allowOutsideClick: false } },
      "gerant-bdd-add": { kind: "confirm", options: { ...bddBase(), title: "Ajouter une ligne", html: "Formulaire d’ajout (prévisualisation)", showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Confirmer" } },
      "gerant-bdd-edit": { kind: "confirm", options: { ...bddBase(), title: "Modifier la ligne", html: "Formulaire de modification (prévisualisation)", showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Confirmer" } },
      "gerant-horaires-ko": { kind: "simple", options: { ...hbBase(), icon: "error", title: "Erreur : Valeurs Incorrectes.", confirmButtonText: "Fermer" } },
      "gerant-horaires-ok": { kind: "simple", options: { ...hbBase(), icon: "success", title: "Nouveaux horaires bien enregistrés !", confirmButtonText: "Fermer" } },
      "gerant-horaires-copy": { kind: "confirm", options: { ...hbBase(), title: "Appliquer pareil pour les jours suivants ?", showCancelButton: true, confirmButtonText: "Appliquer", cancelButtonText: "Ignorer" } },
      "gerant-incident-cancel": { kind: "simple", options: { ...fiBase(), icon: "info", title: "Opération Annulée", confirmButtonText: "Fermer" } },
      "gerant-incident-ok": { kind: "simple", options: { ...fiBase(), icon: "success", title: "Fiche incident #INC-2026-001 a été créée", confirmButtonText: "Fermer" } },
      "gerant-incident-ko": { kind: "simple", options: { ...fiBase(), icon: "error", title: "Création impossible", confirmButtonText: "Fermer" } },
      "gerant-reappro-arrivee": { kind: "confirm", options: { icon: "question", title: "Réapprovisionnement #42", text: "Passer le statut de « En cours » à « Arrivé » ?", showCancelButton: true, confirmButtonText: "Confirmer", cancelButtonText: "Annuler" } },
      "gerant-reappro-annuler": { kind: "confirm", options: { icon: "warning", title: "Annuler le réapprovisionnement #42 ?", text: "Le statut passera à Annulé. Cette action est irréversible.", showCancelButton: true, confirmButtonText: "Confirmer l'annulation", cancelButtonText: "Retour" } },
      "gerant-reappro-ok": { kind: "simple", options: { icon: "success", title: "Commande envoyée", text: "Le réapprovisionnement manuel a été créé.", confirmButtonText: "Fermer" } },
      "gerant-validation": { kind: "confirm", options: { ...bddBase(), icon: "warning", title: "Confirmer la validation ?", html: '<p style="font-family:var(--mono);font-size:13px;line-height:1.6">Table <strong>transactions</strong> — 31/03/2026<br>Cette table sera définitivement verrouillée.</p>', showCancelButton: true, cancelButtonText: "Annuler", confirmButtonText: "Valider", allowOutsideClick: false } },

      // Système
      "sys-seuil": { kind: "simple", options: { icon: "warning", title: "Seuil d'alerte atteint", html: "<div style='text-align:left;font-size:13px;'>Réapprovisionnement automatique lancé.</div>", confirmButtonText: "Fermer" } },
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

