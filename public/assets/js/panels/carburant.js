/**
 * panels/carburant.js
 * IIFE globale PompeCarburant
 * Rendu de la section CARBURANTS dans le panel pompes.
 *
 * Pompes 1 & 2 : MANUEL  — simulation démarrage/fin + encaissement en caisse
 * Pompes 3 & 4 : AUTO    — affichage + bouton Activer si désactivée
 */

const PompeCarburant = (() => {
  const ASSETS_BASE =
    (typeof window !== "undefined" && window.APP_BASE_URL
      ? window.APP_BASE_URL
      : "") + "/assets/img";
  const GAS_ICON_SRC = `${ASSETS_BASE}/tabler_gas-station-filled.png`;

  const CARBURANT_COLORS = {
    SP95: {
      bg: "rgba(99,102,241,0.10)",
      border: "rgba(99,102,241,0.30)",
      text: "#4f46e5",
    },
    SP98: {
      bg: "rgba(239,68,68,0.10)",
      border: "rgba(239,68,68,0.30)",
      text: "#dc2626",
    },
    GAZOLE: {
      bg: "rgba(245,158,11,0.10)",
      border: "rgba(245,158,11,0.30)",
      text: "#b45309",
    },
    E10: {
      bg: "rgba(16,185,129,0.10)",
      border: "rgba(16,185,129,0.30)",
      text: "#059669",
    },
    E85: {
      bg: "rgba(168,85,247,0.10)",
      border: "rgba(168,85,247,0.30)",
      text: "#7c3aed",
    },
  };

  let _pompes = [];

  function _isTxInCaisse(idTransactionEnergie) {
    const idTe = Number(idTransactionEnergie || 0);
    if (idTe <= 0) return false;

    const cart = window.__ticketCartShared;
    if (!cart || typeof cart.getItems !== "function") return false;

    const items = cart.getItems() || [];
    return items.some((item) => {
      const source = String(item?.source || "").toLowerCase();
      const isEnergy = source === "energie" || source === "carburant" || source === "electricite";
      return (
        isEnergy &&
        Number(item?.idTransactionEnergie || item?.id_transaction_energie || 0) === idTe
      );
    });
  }

  function _fmt(n, dec) {
    if (n == null) return "\u2014";
    return parseFloat(n).toFixed(dec);
  }

  function _escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function _formatDate(d) {
    if (!d) return "\u2014";
    const dt = new Date(d);
    const p = (v) => String(v).padStart(2, "0");
    return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${String(dt.getFullYear()).slice(2)} - ${p(dt.getHours())}:${p(dt.getMinutes())}`;
  }

  function _ledHTML(statut) {
    const color =
      statut === "active"
        ? "var(--green)"
        : statut === "en_cours"
          ? "var(--warn)"
          : "var(--danger)";
    const anim = statut === "en_cours" ? "animation:pulse 1.2s infinite;" : "";
    return `<span class="pc-led" style="background:${color};box-shadow:0 0 5px ${color};${anim}"></span>`;
  }

  function _lastCardLabel(p) {
    const mode = String(p?.derniere_carte || "").toUpperCase();
    return mode === "CCE" ? "CCE" : "Carte bancaire";
  }

  function _lastCardDetailedLabel(p) {
    const mode = String(p?.derniere_carte || "").toUpperCase();
    if (mode === "CCE") return "Carte CCE";
    if (mode === "CB") return "Carte bancaire";
    return "Non renseignée";
  }

  function _infoBtnHTML(idPompe) {
    return `
      <button
        type="button"
        class="pc-info-btn"
        onclick="PompeCarburant.showInfos(${idPompe})"
        title="Informations pompe"
      >i</button>
    `;
  }

  function _toggleBtnHTML(p, options = {}) {
    const disabled = Boolean(options.disabled);
    const isOn = p.statut === "active";
    const title =
      isOn ? "Désactiver" : "Activer";
    return `
      <button
        type="button"
        class="pc-toggle-btn ${isOn ? "is-on" : "is-off"}${disabled ? " is-disabled" : ""}"
        onclick="PompeCarburant.toggle(${p.id_pompe})"
        title="${title}"
        ${disabled ? "disabled" : ""}
      >⏻</button>
    `;
  }

  function _cardHTML(p) {
    const txCurrent = p.transaction || null;
    const txLast = p.derniere_transaction || null;
    const txDisplay = txCurrent || txLast;
    const carb = txDisplay ? txDisplay.libelle : null;
    const colors = carb ? CARBURANT_COLORS[carb] || {} : {};
    const isManuel = p.mode === "manuel";
    const isAuto = !isManuel;
    const isDesact = p.statut === "desactivee";
    const isEnCours = p.statut === "en_cours";
    const isActive = p.statut === "active";

    const carbBadge = carb
      ? `<span class="pc-carb-badge" style="background:${colors.bg};border-color:${colors.border};color:${colors.text};">${carb}</span>`
      : `\u2014`;

    const modeBadge = isManuel
      ? `<span class="pc-mode-badge">MANUEL</span>`
      : `<span class="pc-mode-badge pc-mode-badge--auto">${_lastCardLabel(p)}</span>`;

    const qte = txDisplay ? `${_fmt(txDisplay.quantite_delivree, 2)} L` : "\u2014";
    const total = txDisplay ? `${_fmt(txDisplay.prix_total, 2)} \u20ac` : "\u2014";
    const date = _formatDate(
      txCurrent ? (p.date_debut || txCurrent.date_heure) : (txDisplay?.date_heure || p.date_debut),
    );

    const toggleDisabled = isEnCours || (isDesact && txCurrent && !isAuto);
    const topInfoBtn = _infoBtnHTML(p.id_pompe);
    const topToggleBtn = _toggleBtnHTML(p, { disabled: toggleDisabled });

    let actionBtn = "";
    const inCaisse = txCurrent && _isTxInCaisse(txCurrent.id_transaction_energie);

    if (isManuel && isDesact && txCurrent) {
      actionBtn = inCaisse
        ? `<button class="pc-btn pc-btn--encaisser pc-btn--disabled" disabled>En caisse...</button>`
        : `<button class="pc-btn pc-btn--encaisser" onclick="PompeCarburant.encaisser(${p.id_pompe})">Encaisser</button>`;
    } else if (isManuel && isEnCours) {
      actionBtn = `<span class="pc-mode-badge" style="background:var(--warn-dim);color:var(--warn);border-color:var(--warn);">EN COURS</span>`;
    } else if (isManuel && isActive) {
      actionBtn = `<span class="pc-mode-badge">DISPONIBLE</span>`;
    } else {
      actionBtn = `${modeBadge}`;
    }

    const borderColor = isEnCours
      ? "var(--warn)"
      : isDesact
        ? "var(--danger)"
        : "var(--border)";

    return `
      <div class="pc-card" id="pc-card-${p.id_pompe}" style="border-color:${borderColor}">
        <div class="pc-card-top">
          <div class="pc-card-num-wrap">
            <img class="pc-card-type-icon" src="${GAS_ICON_SRC}" alt="" aria-hidden="true">
            <span class="pc-card-num">${p.numero}</span>
            <span class="pc-card-mode-label${!isManuel ? " auto" : ""}">${isManuel ? "MANUEL" : "AUTO"}</span>
          </div>
          <div class="pc-top-actions">
            ${topInfoBtn}
            ${topToggleBtn}
            ${_ledHTML(p.statut)}
          </div>
        </div>
        <div class="pc-card-date">${date}</div>
        <div class="pc-card-row"><span class="pc-row-label">Type</span><span class="pc-row-val">${carbBadge}</span></div>
        <div class="pc-card-row"><span class="pc-row-label">Quantité (L)</span><span class="pc-row-val">${qte}</span></div>
        <div class="pc-card-row pc-row-total"><span class="pc-row-label">Total (€)</span><span class="pc-row-val pc-row-val--total">${total}</span></div>
        <div class="pc-card-action">${actionBtn}</div>
      </div>
    `;
  }

  function _placeholderCard(n) {
    return `
      <div class="pc-card" id="pc-card-ph-${n}">
        <div class="pc-card-top">
          <div class="pc-card-num-wrap">
            <img class="pc-card-type-icon" src="${GAS_ICON_SRC}" alt="" aria-hidden="true">
            <span class="pc-card-num">${n}</span>
            <span class="pc-card-mode-label">${n <= 2 ? "MANUEL" : "AUTO"}</span>
          </div>
          <span class="pc-led" style="background:var(--border);"></span>
        </div>
        <div class="pc-card-date" style="opacity:.4;">Chargement...</div>
        <div class="pc-card-row"><span class="pc-row-label">Type</span><span class="pc-row-val">\u2014</span></div>
        <div class="pc-card-row"><span class="pc-row-label">Quantité (L)</span><span class="pc-row-val">\u2014</span></div>
        <div class="pc-card-row"><span class="pc-row-label">Total (€)</span><span class="pc-row-val">\u2014</span></div>
        <div class="pc-card-action"><button class="pc-btn" disabled style="opacity:.3;">\u2014</button></div>
      </div>
    `;
  }

  function buildHTML() {
    return `
      <div class="pc-grid" id="pc-grid-carburant">
        ${[1, 2, 3, 4].map(_placeholderCard).join("")}
      </div>
    `;
  }

  function onData(pompesCarburant) {
    const pompesOrdonnees = [...pompesCarburant].sort(
      (a, b) => Number(a.numero) - Number(b.numero),
    );
    _pompes = pompesOrdonnees;
    const grid = document.getElementById("pc-grid-carburant");
    if (!grid) return;
    grid.innerHTML = pompesOrdonnees.map(_cardHTML).join("");
  }

  function encaisser(idPompe) {
    const p = _pompes.find((x) => x.id_pompe == idPompe);
    const tx = p && p.transaction;
    if (!p || !tx) {
      Toast.warn("Données de pompe introuvables");
      return;
    }

    if (!window.Achats || typeof window.Achats.ajouterArticle !== "function") {
      Toast.err("Le panel Achats n'est pas disponible");
      return;
    }

    window.Achats.ajouterArticle({
      code_barres: `TE-${tx.id_transaction_energie}`,
      code_affiche: "-",
      libelle: `Carburant ${tx.libelle || "?"} - Pompe ${p.numero} (${_fmt(tx.quantite_delivree, 2)} L)`,
      prix: parseFloat(tx.prix_total) || 0,
      qty: 1,
      source: "energie",
      id_pompe: idPompe,
      id_transaction_energie: tx.id_transaction_energie,
      type_article: "carburant",
    });

    Toast.ok(`Pompe ${p.numero} -> Achats (${_fmt(tx.prix_total, 2)} €)`);

    const card = document.getElementById(`pc-card-${idPompe}`);
    if (card) {
      const btn = card.querySelector(".pc-btn--encaisser");
      if (btn) {
        btn.disabled = true;
        btn.textContent = "En caisse...";
        btn.classList.add("pc-btn--disabled");
      }
    }
  }

  async function activer(idPompe) {
    const btn = document.querySelector(`#pc-card-${idPompe} .pc-btn--activer`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = "...";
    }
    try {
      await Requetes.activerPompe(idPompe);
      Toast.ok(`Pompe ${idPompe} réactivée`);
      if (typeof PompesPanelRefresh === "function") PompesPanelRefresh();
    } catch (e) {
      Toast.err(`Échec activation : ${e.message}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Activer";
      }
    }
  }

  async function toggle(idPompe) {
    const btn = document.querySelector(`#pc-card-${idPompe} .pc-toggle-btn`);
    const previous = btn ? btn.textContent : "";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "...";
    }
    try {
      const result = await Requetes.togglePompe(idPompe);
      const statut = String(result?.statut || "");
      Toast.ok(
        statut === "active"
          ? `Pompe ${idPompe} activée`
          : `Pompe ${idPompe} désactivée`,
      );
      if (typeof PompesPanelRefresh === "function") PompesPanelRefresh();
    } catch (e) {
      Toast.err(`Échec bascule : ${e.message}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = previous || "⏻";
      }
    }
  }

  async function showInfos(idPompe) {
    const pompe = _pompes.find((x) => Number(x.id_pompe) === Number(idPompe));
    if (!pompe) {
      Toast.warn("Pompe introuvable.");
      return;
    }

    const tx = pompe.transaction || pompe.derniere_transaction || null;
    if (!tx) {
      await Swal.fire({
        icon: "info",
        title: `Pompe n°${pompe.numero}`,
        text: "Aucune transaction en cours ou passée.",
        confirmButtonText: "OK",
        customClass: {
          popup: "ticket-swal-popup",
          title: "ticket-swal-title",
          htmlContainer: "ticket-swal-text",
          confirmButton: "ticket-swal-btn",
        },
        buttonsStyling: false,
      });
      return;
    }

    const date = _formatDate(tx.date_heure || pompe.date_debut);
    const nature = tx.libelle ? `Carburant ${tx.libelle}` : "Carburant";
    const quantite = `${_fmt(tx.quantite_delivree, 2)} L`;
    const total = `${_fmt(tx.prix_total, 2)} €`;
    const carte = _lastCardDetailedLabel(pompe);
    const carteRow = pompe.mode === "auto"
      ? `
          <div class="pompe-info-row">
            <span class="pompe-info-label">Carte utilisée</span>
            <span class="pompe-info-value">${_escapeHtml(carte)}</span>
          </div>
        `
      : "";

    await Swal.fire({
      title: `Informations pompe n°${pompe.numero}`,
      html: `
        <div class="pompe-info-grid">
          <div class="pompe-info-row">
            <span class="pompe-info-label">Numéro pompe</span>
            <span class="pompe-info-value">${_escapeHtml(pompe.numero)}</span>
          </div>
          <div class="pompe-info-row">
            <span class="pompe-info-label">Nature délivrée</span>
            <span class="pompe-info-value">${_escapeHtml(nature)}</span>
          </div>
          <div class="pompe-info-row">
            <span class="pompe-info-label">Quantité délivrée</span>
            <span class="pompe-info-value">${_escapeHtml(quantite)}</span>
          </div>
          <div class="pompe-info-row">
            <span class="pompe-info-label">Total à payer</span>
            <span class="pompe-info-value">${_escapeHtml(total)}</span>
          </div>
          <div class="pompe-info-row">
            <span class="pompe-info-label">Date / heure</span>
            <span class="pompe-info-value">${_escapeHtml(date)}</span>
          </div>
          ${carteRow}
        </div>
      `,
      confirmButtonText: "Fermer",
      customClass: {
        popup: "ticket-swal-popup",
        title: "ticket-swal-title",
        htmlContainer: "ticket-swal-text",
        confirmButton: "ticket-swal-btn",
      },
      buttonsStyling: false,
    });
  }

  return { buildHTML, onData, encaisser, activer, toggle, showInfos };
})();
