/**
 * panels/electricite.js
 * IIFE globale PompeElectricite
 * Rendu de la section ELECTRICITE dans le panel pompes.
 *
 * Super-chargeurs rapides : 8 bornes (2 rangees × 4)
 * Chargeurs lents         : 2 bornes (1 colonne de 2)
 * Tous en mode AUTO — pas d'encaissement caisse
 */

const PompeElectricite = (() => {
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

  function _formatTemps(t) {
    if (!t) return "\u2014";
    if (typeof t === "string" && t.includes(":")) {
      const [h, m] = t.split(":").map(Number);
      if (h > 0) return `${h}h${m > 0 ? m + "min" : ""}`;
      return `${m}min`;
    }
    return String(t);
  }

  function _ledHTML(statut) {
    const color =
      statut === "active"
        ? "var(--green)"
        : statut === "en_cours"
          ? "var(--warn)"
          : "var(--danger)";
    const anim = statut === "en_cours" ? "animation:pulse 1.2s infinite;" : "";
    return `<span class="pe-led" style="background:${color};box-shadow:0 0 5px ${color};${anim}"></span>`;
  }

  // numero affiché : rapides 1-8, lents réindexés 1-2
  function _numAff(p) {
    return p.sous_type === "lente" ? p.numero - 8 : p.numero;
  }

  function _cardHTML(p) {
    const tx = p.transaction || null;
    const isDesact = p.statut === "desactivee";
    const isEnCours = p.statut === "en_cours";
    const isRapide = p.sous_type === "rapide";

    const kwh = tx ? `${_fmt(tx.quantite_delivree, 2)}` : "\u2014";
    const total = tx ? `${_fmt(tx.prix_total, 2)} \u20ac` : "\u2014";
    const temps = _formatTemps(tx ? tx.temps_charge : null);
    const date = _formatDate(p.date_debut);
    const num = _numAff(p);
    const typeLabel = isRapide ? "Rapide" : "Lent";

    let actionBtn = "";
    if (isDesact) {
      actionBtn = `<button class="pe-btn pe-btn--activer" onclick="PompeElectricite.activer(${p.id_pompe})">Activer</button>`;
    } else {
      actionBtn = `<span class="pe-carte-label">CARTES</span>`;
    }

    const borderColor = isEnCours
      ? "var(--warn)"
      : isDesact
        ? "var(--danger)"
        : "var(--border)";

    return `
      <div class="pe-card" id="pe-card-${p.id_pompe}" style="border-color:${borderColor}">
        <div class="pe-card-top">
          <span class="pe-card-num">${num}</span>
          <span class="pe-card-type">${typeLabel}</span>
          ${_ledHTML(p.statut)}
        </div>
        <div class="pe-card-date">${date}</div>
        <div class="pe-card-row"><span class="pe-row-label">Quantité (H)</span><span class="pe-row-val">${kwh}</span></div>
        <div class="pe-card-row pe-row-total"><span class="pe-row-label">Total (€)</span><span class="pe-row-val pe-row-val--total">${total}</span></div>
        <div class="pe-card-action">${actionBtn}</div>
      </div>
    `;
  }

  function _placeholderCard(n, typeLabel) {
    return `
      <div class="pe-card">
        <div class="pe-card-top">
          <span class="pe-card-num">${n}</span>
          <span class="pe-card-type">${typeLabel}</span>
          <span class="pe-led" style="background:var(--border);"></span>
        </div>
        <div class="pe-card-date" style="opacity:.4;">Chargement...</div>
        <div class="pe-card-row"><span class="pe-row-label">Quantité (H)</span><span class="pe-row-val">\u2014</span></div>
        <div class="pe-card-row"><span class="pe-row-label">Total (€)</span><span class="pe-row-val">\u2014</span></div>
        <div class="pe-card-action"><span class="pe-carte-label">CARTES</span></div>
      </div>
    `;
  }

  function buildHTML() {
    const rapides = [1, 2, 3, 4, 5, 6, 7, 8]
      .map((n) => _placeholderCard(n, "Rapide"))
      .join("");
    const lents = [1, 2].map((n) => _placeholderCard(n, "Lent")).join("");
    return `
      <div class="pe-wrap" id="pe-wrap">
        <div class="pe-col-rapides">
          <div class="pe-subsection-label">SUPER-CHARGEURS :</div>
          <div class="pe-grid-rapides" id="pe-grid-rapides">${rapides}</div>
        </div>
        <div class="pe-col-sep"></div>
        <div class="pe-col-lents">
          <div class="pe-subsection-label">CHARGEURS :</div>
          <div class="pe-grid-lents" id="pe-grid-lents">${lents}</div>
        </div>
      </div>
    `;
  }

  function onData(pompesElec) {
    _pompes = pompesElec;

    const rapides = pompesElec.filter((p) => p.sous_type === "rapide");
    const lents = pompesElec.filter((p) => p.sous_type === "lente");

    const gr = document.getElementById("pe-grid-rapides");
    const gl = document.getElementById("pe-grid-lents");
    if (gr) gr.innerHTML = rapides.map(_cardHTML).join("");
    if (gl) gl.innerHTML = lents.map(_cardHTML).join("");
  }

  async function activer(idPompe) {
    const btn = document.querySelector(`#pe-card-${idPompe} .pe-btn--activer`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = "...";
    }
    try {
      await Requetes.activerPompe(idPompe);
      Toast.ok(`Borne ${idPompe} reactivee`);
      if (typeof PompesPanelRefresh === "function") PompesPanelRefresh();
    } catch (e) {
      Toast.err(`Echec activation : ${e.message}`);
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Activer";
      }
    }
  }

  return { buildHTML, onData, activer };
})();
