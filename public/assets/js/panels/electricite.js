/**
 * panels/electricite.js
 * IIFE globale PompeElectricite
 * Rendu de la section ÉLECTRICITÉ dans le panel pompes.
 *
 * Super-chargeurs rapides : 8 bornes (2 rangées × 4)
 * Chargeurs lents         : 2 bornes (1 colonne de 2)
 * Tous en mode AUTO — pas d'encaissement caisse
 */

const PompeElectricite = (() => {
  const ASSETS_BASE =
    (typeof window !== "undefined" && window.APP_BASE_URL
      ? window.APP_BASE_URL
      : "") + "/assets/img";
  const ELEC_ICON_SRC = `${ASSETS_BASE}/mdi_electric-charger.png`;

  let _pompes = [];

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
        class="pe-info-btn"
        onclick="PompeElectricite.showInfos(${idPompe})"
        title="Informations borne"
      >i</button>
    `;
  }

  function _toggleBtnHTML(p, options = {}) {
    const disabled = Boolean(options.disabled);
    const isOn = p.statut === "active";
    const title = isOn ? "Désactiver" : "Activer";
    return `
      <button
        type="button"
        class="pe-toggle-btn ${isOn ? "is-on" : "is-off"}${disabled ? " is-disabled" : ""}"
        onclick="PompeElectricite.toggle(${p.id_pompe})"
        title="${title}"
        ${disabled ? "disabled" : ""}
      >⏻</button>
    `;
  }

  // numero affiché : rapides 1-8, lents réindexés 1-2
  function _numAff(p) {
    return p.sous_type === "lente" ? p.numero - 8 : p.numero;
  }

  function _cardHTML(p) {
    const txCurrent = p.transaction || null;
    const txLast = p.derniere_transaction || null;
    const txDisplay = txCurrent || txLast;
    const isDesact = p.statut === "desactivee";
    const isEnCours = p.statut === "en_cours";
    const isRapide = p.sous_type === "rapide";

    const kwh = txDisplay ? `${_fmt(txDisplay.quantite_delivree, 2)}` : "\u2014";
    const total = txDisplay ? `${_fmt(txDisplay.prix_total, 2)} \u20ac` : "\u2014";
    const temps = _formatTemps(txDisplay ? txDisplay.temps_charge : null);
    const date = _formatDate(
      txCurrent ? (p.date_debut || txCurrent.date_heure) : (txDisplay?.date_heure || p.date_debut),
    );
    const num = _numAff(p);
    const typeLabel = isRapide ? "Rapide" : "Lent";

    const toggleDisabled = isEnCours;
    const topInfoBtn = _infoBtnHTML(p.id_pompe);
    const topToggleBtn = _toggleBtnHTML(p, { disabled: toggleDisabled });
    const actionBtn = `<span class="pe-carte-label">${_lastCardLabel(p)}</span>`;

    const borderColor = isEnCours
      ? "var(--warn)"
      : isDesact
        ? "var(--danger)"
        : "var(--border)";

    return `
      <div class="pe-card" id="pe-card-${p.id_pompe}" style="border-color:${borderColor}">
        <div class="pe-card-top">
          <img class="pe-card-type-icon" src="${ELEC_ICON_SRC}" alt="" aria-hidden="true">
          <span class="pe-card-num">${num}</span>
          <span class="pe-card-type">${typeLabel}</span>
          <div class="pe-top-actions">
            ${topInfoBtn}
            ${topToggleBtn}
            ${_ledHTML(p.statut)}
          </div>
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
          <img class="pe-card-type-icon" src="${ELEC_ICON_SRC}" alt="" aria-hidden="true">
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
      Toast.ok(`Borne ${idPompe} réactivée`);
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
    const btn = document.querySelector(`#pe-card-${idPompe} .pe-toggle-btn`);
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
          ? `Borne ${idPompe} activée`
          : `Borne ${idPompe} désactivée`,
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
      Toast.warn("Borne introuvable.");
      return;
    }

    const tx = pompe.transaction || pompe.derniere_transaction || null;
    if (!tx) {
      await Swal.fire({
        icon: "info",
        title: `Borne n°${_numAff(pompe)}`,
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
    const natureBase = String(tx.type_charge || pompe.sous_type || "").toLowerCase();
    const nature = natureBase
      ? `Chargeur ${natureBase}`
      : "Chargeur électrique";
    const quantite = `${_fmt(tx.quantite_delivree, 2)} kWh`;
    const total = `${_fmt(tx.prix_total, 2)} €`;
    const carte = _lastCardDetailedLabel(pompe);

    await Swal.fire({
      title: `Informations borne n°${_numAff(pompe)}`,
      html: `
        <div class="pompe-info-grid">
          <div class="pompe-info-row">
            <span class="pompe-info-label">Numéro borne</span>
            <span class="pompe-info-value">${_escapeHtml(_numAff(pompe))}</span>
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
          <div class="pompe-info-row">
            <span class="pompe-info-label">Carte utilisée</span>
            <span class="pompe-info-value">${_escapeHtml(carte)}</span>
          </div>
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

  return { buildHTML, onData, activer, toggle, showInfos };
})();
