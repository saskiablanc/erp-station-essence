/**
 * panels/carburant.js
 * IIFE globale PompeCarburant
 * Rendu de la section CARBURANTS dans le panel pompes.
 *
 * Pompes 1 & 2 : MANUEL  — bouton Encaisser, envoie au panier
 * Pompes 3 & 4 : AUTO    — affichage + bouton Activer si désactivée
 */

const PompeCarburant = (() => {
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

  function _fmt(n, dec) {
    if (n == null) return "\u2014";
    return parseFloat(n).toFixed(dec);
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

  function _cardHTML(p) {
    const tx = p.transaction || null;
    const carb = tx ? tx.libelle : null;
    const colors = carb ? CARBURANT_COLORS[carb] || {} : {};
    const isManuel = p.mode === "manuel";
    const isDesact = p.statut === "desactivee";
    const isEnCours = p.statut === "en_cours";
    const isActive = p.statut === "active";

    const carbBadge = carb
      ? `<span class="pc-carb-badge" style="background:${colors.bg};border-color:${colors.border};color:${colors.text};">${carb}</span>`
      : `<span class="pc-carb-badge pc-carb-badge--vide">\u2014</span>`;

    const modeBadge = isManuel
      ? `<span class="pc-mode-badge">MANUEL</span>`
      : `<span class="pc-mode-badge pc-mode-badge--auto">CARTES</span>`;

    const qte = tx ? `${_fmt(tx.quantite_delivree, 2)} L` : "\u2014";
    const prix = tx ? `${_fmt(tx.prix_litre, 3)} \u20ac/L` : "\u2014";
    const total = tx ? `${_fmt(tx.prix_total, 2)} \u20ac` : "\u2014";
    const date = _formatDate(p.date_debut);

    let actionBtn = "";
    if (isManuel && isDesact && tx) {
      actionBtn = `<button class="pc-btn pc-btn--encaisser" onclick="PompeCarburant.encaisser(${p.id_pompe})">Encaisser</button>`;
    } else if (isDesact) {
      actionBtn = `<button class="pc-btn pc-btn--activer" onclick="PompeCarburant.activer(${p.id_pompe})">Activer</button>`;
    } else if (isManuel) {
      actionBtn = `<button class="pc-btn pc-btn--encaisser" disabled style="opacity:.35;cursor:default;">Encaisser</button>`;
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
            <span class="pc-card-num">${p.numero}</span>
            <span class="pc-card-mode-label${!isManuel ? " auto" : ""}">${isManuel ? "MANUEL" : "AUTO"}</span>
          </div>
          ${_ledHTML(p.statut)}
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
    _pompes = pompesCarburant;
    const grid = document.getElementById("pc-grid-carburant");
    if (!grid) return;
    grid.innerHTML = pompesCarburant.map(_cardHTML).join("");
  }

  function encaisser(idPompe) {
    const p = _pompes.find((x) => x.id_pompe == idPompe);
    const tx = p && p.transaction;
    if (!p || !tx) {
      Toast.warn("Donnees de pompe introuvables");
      return;
    }

    State.addLigne({
      code_barres: `POMPE-${idPompe}`,
      libelle: `Carburant ${tx.libelle || "?"} - Pompe ${p.numero} (${_fmt(tx.quantite_delivree, 2)} L)`,
      prix_unitaire: parseFloat(tx.prix_total) || 0,
      id_pompe: idPompe,
      type: "energie",
    });

    Toast.ok(`Pompe ${p.numero} → Panier (${_fmt(tx.prix_total, 2)} €)`);
    WM.open("ticket");

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
      Toast.ok(`Pompe ${idPompe} reactivee`);
      if (typeof PompesPanelRefresh === "function") PompesPanelRefresh();
    } catch (e) {
      Toast.err(`Echec activation : ${e.message}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Activer";
      }
    }
  }

  return { buildHTML, onData, encaisser, activer };
})();
