<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UNICA — Simulateur Physique</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Familjen+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
  <?php
    $baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    if ($baseUrl === '/' || $baseUrl === '\\') $baseUrl = '';
  ?>
  <script>const API = '<?= $baseUrl ?>';</script>
  <style>
    :root {
      --bg: #f4f2fe;
      --surface: rgba(255,255,255,0.82);
      --surface2: rgba(255,255,255,0.65);
      --border: #ddd6fe;
      --accent: #6366f1;
      --accent-2: #818cf8;
      --accent-dim: rgba(129,140,248,0.2);
      --green: #10b981;
      --green-dim: rgba(110,231,183,0.25);
      --warn: #f59e0b;
      --warn-dim: rgba(245,158,11,0.18);
      --danger: #ef4444;
      --danger-dim: rgba(239,68,68,0.16);
      --text: #1f2937;
      --text-mid: #4b5563;
      --text-dim: #6b7280;
      --bg-grad: linear-gradient(135deg,#cfe3ff 0%,#f4f2fe 50.48%,#d1fae5 100%),#fff;
      --shadow-soft: 0 4px 4px rgba(0,0,0,0.25);
      --mono: "DM Mono", monospace;
      --display: "Familjen Grotesk", sans-serif;
      --sim-orange: #f97316;
      --sim-orange-dim: rgba(249,115,22,0.15);
    }

    *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
    html,body { height:100%; font-family:var(--mono); font-size:13px; color:var(--text); background:var(--bg-grad); }

    /* ── Topbar ── */
    .sim-topbar {
      height:50px; display:flex; align-items:center; gap:12px;
      padding:0 20px;
      background:var(--surface); border-bottom:1.5px solid var(--border);
      backdrop-filter:blur(16px);
    }
    .sim-topbar-brand { font-family:var(--display); font-weight:700; font-size:16px; color:var(--accent); }
    .sim-topbar-badge {
      background:var(--sim-orange); color:#fff; font-size:10px; font-weight:600;
      padding:3px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:0.5px;
    }
    .sim-topbar-sep { flex:1; }
    .sim-topbar-link {
      font-size:12px; color:var(--accent); text-decoration:none;
      padding:6px 14px; border-radius:999px; border:1.5px solid var(--accent);
      transition:all .15s;
    }
    .sim-topbar-link:hover { background:var(--accent); color:#fff; }

    /* ── Layout ── */
    .sim-body { display:flex; height:calc(100vh - 50px); overflow:hidden; }
    .sim-nav {
      width:220px; min-width:220px; padding:16px 12px;
      background:var(--surface); border-right:1.5px solid var(--border);
      display:flex; flex-direction:column; gap:4px; overflow-y:auto;
      backdrop-filter:blur(12px);
    }
    .sim-nav-title { font-family:var(--display); font-size:11px; font-weight:600; color:var(--text-dim); text-transform:uppercase; letter-spacing:1px; padding:8px 8px 4px; }
    .sim-nav-btn {
      display:flex; align-items:center; gap:8px;
      padding:10px 12px; border:none; border-radius:8px;
      background:transparent; color:var(--text); font-size:12px;
      cursor:pointer; transition:all .12s; text-align:left; width:100%;
      font-family:var(--mono);
    }
    .sim-nav-btn:hover { background:var(--accent-dim); }
    .sim-nav-btn.active { background:var(--accent); color:#fff; font-weight:500; }

    .sim-main { flex:1; overflow-y:auto; padding:24px 32px; }

    /* ── Cards ── */
    .sim-section { max-width:900px; margin:0 auto; }
    .sim-section-title { font-family:var(--display); font-size:22px; font-weight:700; margin-bottom:6px; }
    .sim-section-desc { color:var(--text-dim); font-size:12px; margin-bottom:20px; line-height:1.5; }

    .sim-card {
      background:var(--surface); border:1.5px solid var(--border);
      border-radius:12px; padding:20px; margin-bottom:16px;
      backdrop-filter:blur(12px);
    }
    .sim-card-title {
      font-family:var(--display); font-weight:600; font-size:14px; margin-bottom:12px;
      display:flex; align-items:center; gap:8px;
    }
    .sim-card-title .dot { width:8px; height:8px; border-radius:50%; }
    .sim-card-title .dot--green { background:var(--green); }
    .sim-card-title .dot--orange { background:var(--sim-orange); }

    /* ── Forms ── */
    .sim-row { display:flex; gap:12px; align-items:end; flex-wrap:wrap; margin-bottom:12px; }
    .sim-field { display:flex; flex-direction:column; gap:4px; }
    .sim-field label { font-size:11px; color:var(--text-dim); font-weight:500; }
    .sim-field select, .sim-field input {
      height:38px; border:1.5px solid var(--border); border-radius:8px;
      padding:0 12px; font-family:var(--mono); font-size:12px; color:var(--text);
      background:#fff; min-width:140px;
    }
    .sim-field--full { width:100%; }
    .sim-field select { cursor:pointer; }
    .sim-field input[type=range] { padding:0; min-width:180px; }

    .sim-btn {
      height:38px; padding:0 20px; border:none; border-radius:8px;
      font-family:var(--mono); font-size:12px; font-weight:500;
      cursor:pointer; transition:all .12s; display:inline-flex; align-items:center; gap:6px;
    }
    .sim-btn--primary { background:var(--accent); color:#fff; }
    .sim-btn--primary:hover { background:var(--accent-2); }
    .sim-btn--green { background:var(--green); color:#fff; }
    .sim-btn--green:hover { opacity:.85; }
    .sim-btn--orange { background:var(--sim-orange); color:#fff; }
    .sim-btn--orange:hover { opacity:.85; }
    .sim-btn--danger { background:var(--danger); color:#fff; }
    .sim-btn--danger:hover { opacity:.85; }
    .sim-btn:disabled { opacity:.4; cursor:not-allowed; }

    /* ── Log ── */
    .sim-log {
      background:rgba(0,0,0,0.03); border:1px solid var(--border); border-radius:8px;
      padding:10px 14px; margin-top:10px; max-height:150px; overflow-y:auto;
      font-size:11px; line-height:1.7;
    }
    .sim-log:empty::before { content:"Aucune action pour l'instant."; color:var(--text-dim); font-style:italic; }
    .sim-log .ok { color:var(--green); }
    .sim-log .err { color:var(--danger); }
    .sim-log .info { color:var(--accent); }
    .sim-log .ts { color:var(--text-dim); margin-right:6px; }

    /* ── Pompes layout ── */
    .sim-pompes-layout {
      display:flex;
      flex-direction:column;
      gap:18px;
      margin-bottom:14px;
    }
    .sim-pompes-family {
      border:1.5px solid var(--border);
      border-radius:14px;
      background:linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(244,248,255,.96) 100%);
      overflow:hidden;
    }
    .sim-pompes-family-head {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:10px 14px;
      border-bottom:1px solid var(--border);
      background:var(--surface2);
    }
    .sim-pompes-family-title {
      font-size:12px;
      font-weight:700;
      letter-spacing:.08em;
      text-transform:uppercase;
      color:var(--text-mid);
    }
    .sim-pompes-family-meta {
      font-size:10px;
      color:var(--text-dim);
      text-transform:uppercase;
      letter-spacing:.06em;
    }
    .sim-pompes-family-body {
      padding:12px;
      display:grid;
      grid-template-columns:repeat(2, minmax(0, 1fr));
      align-items:start;
      gap:12px;
    }
    .sim-pompes-subgroup {
      display:flex;
      flex-direction:column;
      gap:8px;
      min-width:0;
      padding:10px;
      border:1px dashed var(--border);
      border-radius:12px;
      background:rgba(255,255,255,.58);
    }
    .sim-pompes-subhead {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
    }
    .sim-pompes-subtitle {
      font-size:11px;
      font-weight:700;
      letter-spacing:.04em;
      text-transform:uppercase;
      color:var(--accent);
    }
    .sim-pompes-submeta {
      font-size:10px;
      color:var(--text-dim);
    }
    .sim-pompes-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:10px; }
    .sim-pompes-empty {
      padding:10px 12px;
      border:1px dashed var(--border);
      border-radius:10px;
      background:var(--surface2);
      color:var(--text-dim);
      font-size:11px;
      font-style:italic;
    }
    @media (max-width: 900px) {
      .sim-pompes-family-body { grid-template-columns:1fr; }
    }
    .sim-pompe-chip {
      padding:10px 14px; border-radius:10px; border:1.5px solid var(--border);
      background:var(--surface2); font-size:11px; cursor:pointer; transition:all .12s;
    }
    .sim-pompe-chip:hover { border-color:var(--accent); }
    .sim-pompe-chip.selected { border-color:var(--accent); background:var(--accent-dim); }
    .sim-pompe-chip .label { font-weight:600; font-size:12px; margin-bottom:4px; }
    .sim-pompe-chip .meta { color:var(--text-dim); }
    .sim-pompe-chip .status { display:inline-block; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:600; margin-top:4px; }
    .sim-pompe-chip .status--active { background:var(--green-dim); color:var(--green); }
    .sim-pompe-chip .status--desactivee { background:var(--danger-dim); color:var(--danger); }
    .sim-pompe-chip .status--en_cours { background:var(--warn-dim); color:var(--warn); }

    /* ── CCE grid ── */
    .sim-cce-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; margin-bottom:14px; }
    .sim-cce-chip {
      padding:10px 14px; border-radius:10px; border:1.5px solid var(--border);
      background:var(--surface2); font-size:11px; cursor:pointer; transition:all .12s;
    }
    .sim-cce-chip:hover { border-color:var(--accent); }
    .sim-cce-chip .label { font-weight:600; }
    .sim-cce-chip .solde { color:var(--green); font-weight:600; }

    /* ── Hidden sections ── */
    .sim-panel { display:none; }
    .sim-panel.active { display:block; }

    /* ── Range display ── */
    .sim-range-val { font-weight:600; color:var(--accent); min-width:60px; text-align:right; }

    /* ── Carburants selector ── */
    .sim-fuel-list { display:flex; flex-wrap:wrap; gap:8px; }
    .sim-fuel-btn {
      height:34px; padding:0 14px; border-radius:999px;
      border:1.5px solid var(--border); background:#fff;
      color:var(--text-mid); font-family:var(--mono); font-size:12px;
      cursor:pointer; transition:all .12s;
    }
    .sim-fuel-btn:hover { border-color:var(--accent); color:var(--accent); }
    .sim-fuel-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
    .sim-fuel-empty { color:var(--text-dim); font-size:11px; }

    /* ── Waiting banner ── */
    .sim-waiting {
      display:none;
      background:var(--accent-dim); border:1.5px solid var(--accent);
      border-radius:10px; padding:14px 20px; margin-bottom:16px;
      font-size:12px; color:var(--accent); font-weight:500;
      align-items:center; gap:10px;
    }
    .sim-waiting.visible { display:flex; }
    .sim-waiting-dot {
      width:8px; height:8px; border-radius:50%; background:var(--accent);
      animation:sim-pulse 1.2s ease-in-out infinite;
    }
    @keyframes sim-pulse {
      0%,100% { opacity:.3; }
      50% { opacity:1; }
    }

    /* ── Steps indicator ── */
    .sim-steps { display:flex; gap:6px; margin-bottom:14px; }
    .sim-step {
      padding:6px 14px; border-radius:999px; font-size:11px; font-weight:500;
      background:var(--surface2); border:1.5px solid var(--border); color:var(--text-dim);
    }
    .sim-step.current { background:var(--accent); color:#fff; border-color:var(--accent); }
    .sim-step.done { background:var(--green-dim); color:var(--green); border-color:var(--green); }

    /* ── Popups catalog ── */
    .sim-popup-grid {
      display:grid;
      grid-template-columns:repeat(auto-fill,minmax(280px,1fr));
      gap:12px;
    }
    .sim-popup-cat {
      border:1.5px solid var(--border);
      border-radius:12px;
      background:var(--surface2);
      padding:12px;
    }
    .sim-popup-cat-title {
      font-family:var(--display);
      font-size:14px;
      font-weight:600;
      margin-bottom:8px;
    }
    .sim-popup-list {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
    }
    .sim-popup-btn {
      height:32px;
      padding:0 10px;
      border:1.5px solid var(--border);
      border-radius:999px;
      background:#fff;
      color:var(--text-mid);
      font-family:var(--mono);
      font-size:11px;
      cursor:pointer;
      transition:all .12s;
    }
    .sim-popup-btn:hover {
      border-color:var(--accent);
      color:var(--accent);
    }
  </style>
</head>
<body>

<!-- TOPBAR -->
<div class="sim-topbar">
  <span class="sim-topbar-brand">UNICA Station</span>
  <span class="sim-topbar-badge">Simulateur Physique</span>
  <span class="sim-topbar-sep"></span>
  <a class="sim-topbar-link" href="<?= $baseUrl ?>/caisse" target="_blank">Ouvrir la caisse</a>
  <a class="sim-topbar-link" href="<?= $baseUrl ?>/gerant" target="_blank">Ouvrir le gerant</a>
</div>

<!-- BODY -->
<div class="sim-body">

  <!-- NAV -->
  <nav class="sim-nav">
    <div class="sim-nav-title">Actions</div>
    <button class="sim-nav-btn active" data-panel="cce">Carte CCE</button>
    <button class="sim-nav-btn" data-panel="pompes">Pompes et Bornes</button>
    <button class="sim-nav-btn" data-panel="popups">Catalogue Pop-ups</button>
  </nav>

  <!-- MAIN -->
  <div class="sim-main">

    <!-- ══════ CARTE CCE ══════ -->
    <div id="panel-cce" class="sim-panel active">
      <div class="sim-section">
        <div class="sim-section-title">Carte Credit Energie</div>
        <div class="sim-section-desc">
          Quand un employe clique sur "Scanner CCE" sur la caisse, la liste des cartes s'affiche ici.
          Selectionnez une carte pour l'envoyer a la caisse.
        </div>

        <div id="cce-waiting" class="sim-waiting">
          <span class="sim-waiting-dot"></span>
          <span>La caisse attend le scan d'une carte CCE. Selectionnez une carte ci-dessous.</span>
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> Cartes CCE disponibles</div>
          <div id="cce-grid" class="sim-cce-grid"></div>
          <button class="sim-btn sim-btn--primary" onclick="Sim.refreshCCE()">Rafraichir</button>
          <div id="cce-log" class="sim-log"></div>
        </div>
      </div>
    </div>

    <!-- ══════ POMPES & BORNES ══════ -->
    <div id="panel-pompes" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">Pompes et Bornes</div>
        <div class="sim-section-desc">
          Simulez le parcours client complet :
          1. Selectionnez une pompe disponible.
          2. Choisissez la quantite puis demarrez.
          3. Terminez la livraison quand le client a fini.
          L'employe pourra ensuite encaisser sur la caisse.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> Etat des pompes</div>
          <div id="pompes-grid" class="sim-pompes-grid"></div>
          <button class="sim-btn sim-btn--primary" onclick="Sim.refreshPompes()">Rafraichir</button>
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--orange"></span> Parcours client</div>

          <div class="sim-steps" id="pompe-steps">
            <span class="sim-step current" id="step-select">1. Selectionner</span>
            <span class="sim-step" id="step-start">2. Demarrer</span>
            <span class="sim-step" id="step-end">3. Terminer</span>
          </div>

          <!-- Step 1: Selection -->
          <div id="pompe-step-select">
            <div style="color:var(--text-dim);font-size:12px;margin-bottom:8px;">
              Cliquez sur une pompe disponible (statut : active) ci-dessus.
            </div>
            <div class="sim-row">
              <div class="sim-field">
                <label>Pompe selectionnee</label>
                <select id="pompe-select" disabled><option value="">Aucune</option></select>
              </div>
            </div>
          </div>

          <!-- Step 2: Configuration + Demarrer -->
          <div id="pompe-step-start" style="display:none;">
            <div id="pompe-carburant-opts" style="display:none;">
              <div class="sim-row">
                <div class="sim-field sim-field--full">
                  <label>Type de carburant</label>
                  <div id="pompe-fuel-buttons" class="sim-fuel-list"></div>
                </div>
              </div>
              <div class="sim-row">
                <div class="sim-field">
                  <label>Quantite (litres)</label>
                  <input type="range" id="pompe-qty" min="5" max="60" value="25" oninput="document.getElementById('pompe-qty-val').textContent=this.value+' L'">
                </div>
                <span class="sim-range-val" id="pompe-qty-val">25 L</span>
              </div>
            </div>
            <div id="pompe-elec-opts" style="display:none;">
              <div class="sim-row">
                <div class="sim-field">
                  <label>Energie chargee (kWh)</label>
                  <input type="range" id="borne-kwh" min="5" max="80" value="30" oninput="document.getElementById('borne-kwh-val').textContent=this.value+' kWh'">
                </div>
                <span class="sim-range-val" id="borne-kwh-val">30 kWh</span>
              </div>
            </div>
            <button class="sim-btn sim-btn--green" id="btn-demarrer" onclick="Sim.demarrerLivraison()">Demarrer la livraison</button>
          </div>

          <!-- Step 3: Terminer -->
          <div id="pompe-step-end" style="display:none;">
            <div id="pompe-recap" style="font-size:12px;margin-bottom:12px;color:var(--text-mid);"></div>
            <button class="sim-btn sim-btn--orange" id="btn-terminer" onclick="Sim.terminerLivraison()">Terminer la livraison</button>
          </div>

          <!-- Done -->
          <div id="pompe-step-done" style="display:none;">
            <div style="padding:12px;border-radius:8px;background:var(--green-dim);color:var(--green);font-size:12px;font-weight:500;margin-bottom:12px;">
              Livraison terminee. L'employe peut maintenant encaisser sur la caisse.
            </div>
            <button class="sim-btn sim-btn--primary" onclick="Sim.resetPompe()">Nouvelle operation</button>
          </div>

          <div id="pompe-log" class="sim-log"></div>
        </div>
      </div>
    </div>

    <!-- ══════ CATALOGUE POPUPS ══════ -->
    <div id="panel-popups" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">Catalogue Pop-ups</div>
        <div class="sim-section-desc">
          Déclenche toutes les pop-ups disponibles sur le site officiel, classées par catégorie.
          Mode démonstration : affichage uniquement, sans exécuter les actions métier.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--orange"></span> Démonstrateur SweetAlert</div>
          <div id="popup-catalog" class="sim-popup-grid"></div>
        </div>
      </div>
    </div>

  </div>
</div>

<script>
var Sim = (function() {
  // ── API helper ──
  function api(method, route, body, timeoutMs) {
    var timeout = Number(timeoutMs || 10000);
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var opts = { method: method, headers: { 'Accept':'application/json', 'Content-Type':'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    if (controller) opts.signal = controller.signal;

    var timeoutId = null;
    if (controller && timeout > 0) {
      timeoutId = setTimeout(function() {
        controller.abort();
      }, timeout);
    }

    return fetch(API + route, opts).then(function(r) {
      return r.json().then(function(d) {
        if (!r.ok) throw new Error(d.message || 'Erreur ' + r.status);
        return d;
      });
    }).catch(function(err) {
      if (err && err.name === 'AbortError') {
        throw new Error('Le serveur met trop de temps à répondre');
      }
      throw err;
    }).finally(function() {
      if (timeoutId) clearTimeout(timeoutId);
    });
  }

  function ts() { return new Date().toLocaleTimeString('fr-FR'); }
  function log(el, cls, msg) {
    var d = document.getElementById(el);
    d.innerHTML = '<div><span class="ts">[' + ts() + ']</span> <span class="' + cls + '">' + msg + '</span></div>' + d.innerHTML;
  }
  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  // ── State ──
  var pompes = [];
  var carburants = [];
  var selectedPompeId = null;
  var selectedCarburantId = null;
  var currentStep = 'select';
  var cces = [];
  var waitingForScan = false;
  var pompesSse = null;
  var pompesSseRetryTimer = null;
  var startRequestRunning = false;
  var endRequestRunning = false;
  var popupTriggerChannelName = 'unica-popup-trigger';
  var popupTriggerStorageKey = 'unica_popup_trigger';

  // ══════════════════════════════════════════════════════
  //  CATALOGUE POPUPS (démo uniquement)
  // ══════════════════════════════════════════════════════
  var POPUP_CATALOG = [
    {
      category: 'Caisse — Achats',
      items: [
        { id: 'achat-erreur', label: 'Erreur produit', kind: 'simple', opts: { icon: 'error', title: 'Erreur', text: 'Produit invalide.' } },
        { id: 'achat-ajoute', label: 'Article ajouté', kind: 'simple', opts: { icon: 'success', title: 'Article ajouté', text: 'L’article a été ajouté au panier.' } },
        { id: 'achat-liste', label: 'Liste articles', kind: 'simple', opts: { title: 'Liste articles', html: '<div style="text-align:left">• 3760123456789 — Eau 1L<br>• 3017620425035 — Chips</div>' } },
        { id: 'achat-panier-vide', label: 'Panier vide', kind: 'simple', opts: { icon: 'warning', title: 'Panier vide', text: 'Ajoutez au moins un produit avant encaissement.' } },
        { id: 'achat-retirer', label: 'Retirer produit', kind: 'confirm', opts: { title: 'Retirer ce produit ?', text: 'La ligne sera supprimée du panier.' } },
        { id: 'achat-stock', label: 'Stock insuffisant', kind: 'simple', opts: { icon: 'warning', title: 'Stock insuffisant', text: 'Cet article n’est plus en stock.' } }
      ]
    },
    {
      category: 'Paiement',
      items: [
        { id: 'pay-encaissement', label: 'Encaissement', kind: 'simple', opts: { title: 'Encaissement', html: '<div>Encaisser tout / Encaisser par article</div>' } },
        { id: 'pay-par-article', label: 'Encaisser par article', kind: 'simple', opts: { title: 'Encaisser par article', html: '<div style="text-align:left">☑ Eau 1L (Qté 2)<br>☑ Carburant SP95 pompe 2</div>' } },
        { id: 'pay-choix', label: 'Choix du paiement', kind: 'simple', opts: { title: 'Choix du paiement', html: '<div>Total à régler : <strong>42,80 €</strong><br><br>Modes : CB / CCE / Espèces</div>' } },
        { id: 'pay-scan-indispo', label: 'Scan CCE indisponible', kind: 'simple', opts: { icon: 'error', title: 'Scan CCE indisponible', text: 'Ce navigateur ne supporte pas le canal de communication du scan CCE.' } },
        { id: 'pay-scan-cce', label: 'Scanner CCE', kind: 'simple', opts: { title: 'Scanner CCE', html: '<div>En attente de la sélection d’une carte sur le site de simulation...</div>' } },
        { id: 'pay-solde-ko', label: 'Solde CCE insuffisant', kind: 'simple', opts: { icon: 'warning', title: 'Solde CCE insuffisant', html: 'Solde courant : <strong>5.00 EUR</strong><br>Montant CCE : <strong>18.20 EUR</strong>' } },
        { id: 'pay-cce-invalide', label: 'Carte CCE invalide', kind: 'simple', opts: { icon: 'error', title: 'Carte CCE invalide', text: 'Aucune carte CCE valide n’a été scannée.' } },
        { id: 'pay-cce-indispo', label: 'Carte CCE indisponible', kind: 'simple', opts: { icon: 'error', title: 'Carte CCE indisponible', text: 'Impossible de charger la carte CCE scannée.' } },
        { id: 'pay-cce-loading', label: 'Paiement CCE en cours', kind: 'loading', opts: { title: 'Paiement CCE en cours', html: 'Validation du paiement CCE...' } },
        { id: 'pay-cb-loading', label: 'Paiement CB en cours', kind: 'loading', opts: { title: 'Paiement carte bleue en cours', html: 'Connexion au terminal CB...' } },
        { id: 'pay-especes', label: 'Saisie espèces', kind: 'simple', opts: { title: 'Saisie espèces', html: '<div style="font-size:24px;letter-spacing:1px;margin-bottom:10px">0.00 EUR</div><div>Clavier numérique TPE</div>' } },
        { id: 'pay-recu', label: 'Demande de reçu', kind: 'yesno', opts: { title: 'Souhaitez-vous un reçu ?', html: 'Voulez-vous imprimer un reçu de paiement ?' } },
        { id: 'pay-ok', label: 'Paiement accepté', kind: 'simple', opts: { icon: 'success', title: 'Paiement accepté', html: 'CCE : <strong>12.50 EUR</strong><br>Espèces : <strong>10.00 EUR</strong><br>Impression en cours...' } },
        { id: 'pay-ko', label: 'Paiement refusé', kind: 'simple', opts: { icon: 'error', title: 'Paiement refusé', text: 'Impossible d’enregistrer la transaction.' } }
      ]
    },
    {
      category: 'CCE',
      items: [
        { id: 'cce-scanner', label: 'Scanner CCE', kind: 'simple', opts: { title: 'Scanner CCE', html: 'En attente de la sélection d’une carte sur le simulateur...' } },
        { id: 'cce-actions', label: 'Actions', kind: 'simple', opts: { title: 'Actions', html: '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="sim-popup-btn">Recharger CCE</button><button class="sim-popup-btn">Consulter transactions</button><button class="sim-popup-btn">Informations bonus</button><button class="sim-popup-btn">Fin consultation</button></div>' } },
        { id: 'cce-min', label: 'Montant insuffisant', kind: 'simple', opts: { icon: 'warning', title: 'Montant insuffisant', text: 'Le montant minimum de rechargement est de 50.00 EUR.' } },
        { id: 'cce-bonus', label: 'Informations bonus', kind: 'simple', opts: { title: 'Informations bonus', html: 'Bonus à partir de 100 EUR : <strong>10.00 EUR</strong><br>Bonus à partir de 200 EUR : <strong>25.00 EUR</strong>' } },
        { id: 'cce-tx', label: 'Transactions CCE', kind: 'simple', opts: { title: 'Transactions CCE', html: '<div style="text-align:left">12/03/2026 — Paiement — -18.40€<br>10/03/2026 — Rechargement — +50.00€</div>' } },
        { id: 'cce-recharge-ko', label: 'Rechargement impossible', kind: 'simple', opts: { icon: 'error', title: 'Rechargement impossible', text: 'Une erreur est survenue.' } },
        { id: 'cce-create-confirm', label: 'Confirmer création', kind: 'confirm', opts: { title: 'Confirmer la création de la carte CCE', text: 'Valider la création de cette carte ?' } },
        { id: 'cce-code', label: 'Client choisit son code', kind: 'timer', opts: { title: 'Le client choisit son code', html: 'Veuillez patienter...', icon: 'info' } },
        { id: 'cce-create-cancel', label: 'Création annulée', kind: 'simple', opts: { icon: 'info', title: 'Création CCE annulée', text: 'La création de la carte a été annulée.' } },
        { id: 'cce-create-ok', label: 'Création terminée', kind: 'simple', opts: { icon: 'success', title: 'Création CCE terminée', text: 'La carte CCE a bien été créée.' } },
        { id: 'cce-create-ko', label: 'Création impossible', kind: 'simple', opts: { icon: 'error', title: 'Création CCE impossible', text: 'Une erreur est survenue pendant la création.' } }
      ]
    },
    {
      category: 'Gérant',
      items: [
        { id: 'gerant-bdd-add-ko', label: 'Ajout non disponible', kind: 'simple', opts: { icon: 'warning', title: 'Ajout non disponible', text: 'Ajout indisponible sur cette table.' } },
        { id: 'gerant-bdd-add', label: 'Ajouter une ligne', kind: 'simple', opts: { title: 'Ajouter une ligne', html: '<div>Formulaire d’ajout (prévisualisation)</div>' } },
        { id: 'gerant-bdd-edit', label: 'Modifier la ligne', kind: 'simple', opts: { title: 'Modifier la ligne', html: '<div>Formulaire de modification (prévisualisation)</div>' } },
        { id: 'gerant-horaires-ko', label: 'Horaires erreur', kind: 'simple', opts: { icon: 'error', title: 'Erreur : Valeurs Incorrectes.', text: 'Format des horaires invalide.' } },
        { id: 'gerant-horaires-ok', label: 'Horaires succès', kind: 'simple', opts: { icon: 'success', title: 'Nouveaux horaires bien enregistrés !', text: 'Les horaires ont été mis à jour.' } },
        { id: 'gerant-horaires-copy', label: 'Appliquer aux jours', kind: 'yesno', opts: { title: 'Appliquer pareil pour les jours suivants ?', html: 'Voulez-vous dupliquer cet horaire sur les jours suivants ?' } },
        { id: 'gerant-incident-cancel', label: 'Incident annulé', kind: 'simple', opts: { icon: 'info', title: 'Opération Annulée', text: 'Aucune fiche incident créée.' } },
        { id: 'gerant-incident-ok', label: 'Incident créé', kind: 'simple', opts: { icon: 'success', title: 'Fiche incident #INC-2026-001 a été créée', text: 'L’incident a bien été enregistré.' } },
        { id: 'gerant-incident-ko', label: 'Incident erreur', kind: 'simple', opts: { icon: 'error', title: 'Création impossible', text: 'Erreur pendant la création de la fiche incident.' } },
        { id: 'gerant-reappro-arrivee', label: 'Réappro arrivée', kind: 'confirm', opts: { title: 'Réapprovisionnement #42', text: 'Confirmer la réception de la livraison ?' } },
        { id: 'gerant-reappro-annuler', label: 'Annuler réappro', kind: 'confirm', opts: { title: 'Annuler le réapprovisionnement #42', text: 'Cette action est irréversible.' } },
        { id: 'gerant-reappro-ok', label: 'Commande envoyée', kind: 'simple', opts: { icon: 'success', title: 'Commande envoyée', text: 'Le réapprovisionnement manuel a été créé.' } },
        { id: 'gerant-validation', label: 'Validation journée', kind: 'confirm', opts: { title: 'Confirmer la validation ?', text: 'Les tables du jour seront verrouillées.' } }
      ]
    },
    {
      category: 'Système',
      items: [
        { id: 'sys-seuil', label: 'Seuil d’alerte', kind: 'simple', opts: { icon: 'warning', title: 'Seuil d’alerte atteint', text: 'Un produit est passé sous le seuil d’alerte.' } }
      ]
    }
  ];

  // ══════════════════════════════════════════════════════
  //  BROADCAST CHANNEL — CCE
  // ══════════════════════════════════════════════════════
  var cceChan = new BroadcastChannel('unica-cce-scan');

  cceChan.onmessage = function(ev) {
    if (ev.data && ev.data.type === 'cce-scan-request') {
      waitingForScan = true;
      document.querySelectorAll('.sim-nav-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelector('.sim-nav-btn[data-panel="cce"]').classList.add('active');
      document.querySelectorAll('.sim-panel').forEach(function(p) { p.classList.remove('active'); });
      document.getElementById('panel-cce').classList.add('active');
      document.getElementById('cce-waiting').classList.add('visible');
      refreshCCE();
      log('cce-log', 'info', 'La caisse demande le scan d\'une carte CCE.');
      return;
    }

    if (ev.data && ev.data.type === 'cce-balance-updated') {
      refreshCCE();
      log('cce-log', 'info', 'Solde CCE mis à jour après paiement.');
    }
  };

  function sendCCESelection(carte) {
    cceChan.postMessage({ type: 'cce-scan-response', carte: carte });
    waitingForScan = false;
    document.getElementById('cce-waiting').classList.remove('visible');
  }

  // ══════════════════════════════════════════════════════
  //  NAVIGATION
  // ══════════════════════════════════════════════════════
  function initNav() {
    document.querySelectorAll('.sim-nav-btn[data-panel]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.sim-nav-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.sim-panel').forEach(function(p) { p.classList.remove('active'); });
        var panel = document.getElementById('panel-' + btn.dataset.panel);
        if (panel) panel.classList.add('active');
        if (btn.dataset.panel === 'pompes') refreshPompes();
        if (btn.dataset.panel === 'cce') refreshCCE();
      });
    });
  }

  // ══════════════════════════════════════════════════════
  //  CARTE CCE
  // ══════════════════════════════════════════════════════
  function refreshCCE() {
    return api('GET', '/json/cce').then(function(data) {
      cces = data;
      renderCCE();
    }).catch(function(e) {
      log('cce-log','err','Erreur chargement CCE : ' + e.message);
    });
  }

  function renderCCE() {
    var grid = document.getElementById('cce-grid');
    grid.innerHTML = cces.map(function(c) {
      return '<div class="sim-cce-chip" onclick="Sim.selectCCE(' + c.id_carte_CE + ')">'
        + '<div class="label">Carte #' + c.id_carte_CE + ' -- ' + esc(c.prenom) + ' ' + esc(c.nom) + '</div>'
        + '<div class="solde">Solde : ' + Number(c.solde_client).toFixed(2) + ' EUR</div>'
        + '</div>';
    }).join('');
  }

  function selectCCE(id) {
    var c = cces.find(function(x) { return x.id_carte_CE == id; });
    if (!c) return;
    api('GET', '/json/cce/' + id).then(function(carte) {
      log('cce-log', 'ok', 'Carte #' + id + ' selectionnee -- ' + esc(carte.prenom) + ' ' + esc(carte.nom) + ' -- Solde : ' + Number(carte.solde_client).toFixed(2) + ' EUR');
      if (waitingForScan) {
        sendCCESelection(carte);
        log('cce-log', 'ok', 'Carte #' + id + ' envoyee a la caisse.');
      }
    }).catch(function(e) {
      log('cce-log', 'err', 'Echec lecture carte #' + id + ' : ' + e.message);
    });
  }

  // ══════════════════════════════════════════════════════
  //  POMPES & BORNES
  // ══════════════════════════════════════════════════════
  function refreshPompes() {
    return api('GET', '/json/pompes').then(function(data) {
      pompes = data;
      renderPompes();
      syncParcoursAfterPompeUpdate();
      // Garde les soldes CCE frais même si le message BroadcastChannel
      // n'est pas reçu (fallback robuste inter-onglets).
      refreshCCE();
    }).catch(function(e) {
      log('pompe-log','err','Erreur chargement pompes : ' + e.message);
    });
  }

  function renderPopupCatalog() {
    var root = document.getElementById('popup-catalog');
    if (!root) return;
    root.innerHTML = POPUP_CATALOG.map(function(cat) {
      var buttons = (cat.items || []).map(function(item) {
        return '<button type="button" class="sim-popup-btn" onclick="Sim.showPopup(\'' + item.id + '\')">'
          + esc(item.label) + '</button>';
      }).join('');
      return '<section class="sim-popup-cat">'
        + '<div class="sim-popup-cat-title">' + esc(cat.category) + '</div>'
        + '<div class="sim-popup-list">' + buttons + '</div>'
        + '</section>';
    }).join('');
  }

  function getPopupItemById(id) {
    for (var i = 0; i < POPUP_CATALOG.length; i += 1) {
      var items = POPUP_CATALOG[i].items || [];
      for (var j = 0; j < items.length; j += 1) {
        if (items[j].id === id) return items[j];
      }
    }
    return null;
  }

  function triggerOfficialPopup(item) {
    if (!item) return;
    var message = {
      type: 'popup-trigger',
      payload: {
        id: item.id,
        kind: item.kind,
        opts: item.opts || {}
      }
    };

    if (typeof BroadcastChannel !== 'undefined') {
      try {
        var channel = new BroadcastChannel(popupTriggerChannelName);
        channel.postMessage(message);
        channel.close();
      } catch (_) {}
    }

    try {
      localStorage.setItem(
        popupTriggerStorageKey,
        JSON.stringify({
          ts: Date.now(),
          type: message.type,
          payload: message.payload
        })
      );
    } catch (_) {}
  }

  async function showPopup(id) {
    var item = getPopupItemById(String(id || ''));
    if (!item) return;
    triggerOfficialPopup(item);
    console.info('[Simulator] Popup envoyée au site officiel :', item.id);
  }

  function syncParcoursAfterPompeUpdate() {
    if (!selectedPompeId) return;
    if (currentStep !== 'done' && currentStep !== 'end') return;

    var p = pompes.find(function(x) { return Number(x.id_pompe) === Number(selectedPompeId); });
    if (!p) return;

    if (p.statut === 'active') {
      document.getElementById('pompe-carburant-opts').style.display = p.type_pompe === 'carburant' ? '' : 'none';
      document.getElementById('pompe-elec-opts').style.display = p.type_pompe === 'electricite' ? '' : 'none';
      if (p.type_pompe === 'carburant') {
        if (!carburants.length) refreshCarburants();
        else renderCarburantsButtons();
      }
      setStep('start');
      log('pompe-log', 'info', 'Pompe réactivée : vous pouvez démarrer une nouvelle livraison.');
    }
  }

  function refreshCarburants() {
    return api('GET', '/json/pompes/carburants').then(function(data) {
      carburants = Array.isArray(data) ? data : [];
      renderCarburantsButtons();
    }).catch(function(e) {
      carburants = [];
      renderCarburantsButtons();
      log('pompe-log', 'err', 'Erreur chargement carburants : ' + e.message);
    });
  }

  function getSelectedCarburant() {
    return carburants.find(function(c) {
      return Number(c.id_energie) === Number(selectedCarburantId);
    }) || null;
  }

  function renderCarburantsButtons() {
    var wrap = document.getElementById('pompe-fuel-buttons');
    if (!wrap) return;

    if (!carburants.length) {
      selectedCarburantId = null;
      wrap.innerHTML = '<span class="sim-fuel-empty">Aucun carburant disponible.</span>';
      return;
    }

    var stillExists = carburants.some(function(c) {
      return Number(c.id_energie) === Number(selectedCarburantId);
    });
    if (!stillExists) {
      selectedCarburantId = Number(carburants[0].id_energie || 0);
    }

    wrap.innerHTML = carburants.map(function(c) {
      var idEnergie = Number(c.id_energie || 0);
      var selectedClass = idEnergie === Number(selectedCarburantId) ? ' selected' : '';
      return '<button type="button" class="sim-fuel-btn' + selectedClass + '"'
        + ' onclick="Sim.selectCarburant(' + idEnergie + ')">'
        + esc(c.libelle || ('Carburant #' + idEnergie))
        + '</button>';
    }).join('');
  }

  function selectCarburant(idEnergie) {
    selectedCarburantId = Number(idEnergie || 0);
    renderCarburantsButtons();
  }

  function startPompesSSE() {
    if (typeof EventSource === 'undefined') return;
    if (pompesSse) return;

    try {
      pompesSse = new EventSource(API + '/events/pompes');
    } catch (_) {
      planPompesSSEReconnect();
      return;
    }

    pompesSse.addEventListener('pompes-update', function() {
      refreshPompes();
    });

    pompesSse.onopen = function() {
      if (pompesSseRetryTimer) {
        clearTimeout(pompesSseRetryTimer);
        pompesSseRetryTimer = null;
      }
    };

    pompesSse.onerror = function() {
      if (pompesSse) {
        pompesSse.close();
        pompesSse = null;
      }
      planPompesSSEReconnect();
    };
  }

  function planPompesSSEReconnect() {
    if (pompesSseRetryTimer) return;
    pompesSseRetryTimer = setTimeout(function() {
      pompesSseRetryTimer = null;
      startPompesSSE();
    }, 3000);
  }

  function renderPompeChip(p) {
    var typeLabel = p.type_pompe === 'carburant' ? 'Pompe' : 'Borne';
    var sousType = p.sous_type ? ' (' + p.sous_type + ')' : '';
    var mode = p.mode === 'auto' ? 'Auto 24' : 'Manuel';
    var sel = p.id_pompe == selectedPompeId ? 'selected' : '';
    var html = '<div class="sim-pompe-chip ' + sel + '" onclick="Sim.selectPompe(' + p.id_pompe + ')">'
      + '<div class="label">' + typeLabel + ' n' + p.numero + sousType + '</div>'
      + '<div class="meta">' + mode + '</div>'
      + '<span class="status status--' + p.statut + '">' + p.statut + '</span>';
    if (p.transaction) {
      html += '<div class="meta" style="margin-top:4px;">'
        + esc(p.transaction.libelle || p.transaction.type_charge || '')
        + ' - ' + Number(p.transaction.quantite_delivree || 0).toFixed(1)
        + ' ' + (p.type_pompe === 'carburant' ? 'L' : 'kWh')
        + ' - ' + Number(p.transaction.prix_total || 0).toFixed(2) + ' EUR</div>';
    }
    html += '</div>';
    return html;
  }

  function renderPompeSubgroup(title, items, meta) {
    var cards = items.length
      ? '<div class="sim-pompes-grid">' + items.map(renderPompeChip).join('') + '</div>'
      : '<div class="sim-pompes-empty">Aucun element dans cette categorie.</div>';

    return '<div class="sim-pompes-subgroup">'
      + '<div class="sim-pompes-subhead">'
      + '<div class="sim-pompes-subtitle">' + esc(title) + '</div>'
      + '<div class="sim-pompes-submeta">' + esc(meta) + '</div>'
      + '</div>'
      + cards
      + '</div>';
  }

  function renderPompeFamily(title, meta, subgroups) {
    return '<section class="sim-pompes-family">'
      + '<div class="sim-pompes-family-head">'
      + '<div class="sim-pompes-family-title">' + esc(title) + '</div>'
      + '<div class="sim-pompes-family-meta">' + esc(meta) + '</div>'
      + '</div>'
      + '<div class="sim-pompes-family-body">' + subgroups.join('') + '</div>'
      + '</section>';
  }

  function countLabel(count, singular, plural) {
    return count + ' ' + (count > 1 ? plural : singular);
  }

  function renderPompes() {
    var grid = document.getElementById('pompes-grid');
    var pompesCarburant = pompes.filter(function(p) { return p.type_pompe === 'carburant'; });
    var pompesElec = pompes.filter(function(p) { return p.type_pompe === 'electricite'; });
    var carburantsManuels = pompesCarburant.filter(function(p) { return p.mode === 'manuel'; });
    var carburantsAuto = pompesCarburant.filter(function(p) { return p.mode === 'auto'; });
    var bornesRapides = pompesElec.filter(function(p) { return p.sous_type === 'rapide'; });
    var bornesLentes = pompesElec.filter(function(p) { return p.sous_type === 'lente'; });

    grid.innerHTML = '<div class="sim-pompes-layout">'
      + renderPompeFamily('Carburants', countLabel(pompesCarburant.length, 'pompe', 'pompes'), [
        renderPompeSubgroup('Pompes manuelles', carburantsManuels, countLabel(carburantsManuels.length, 'pompe', 'pompes')),
        renderPompeSubgroup('Pompes automatiques', carburantsAuto, countLabel(carburantsAuto.length, 'pompe', 'pompes'))
      ])
      + renderPompeFamily('Electricite', countLabel(pompesElec.length, 'borne', 'bornes'), [
        renderPompeSubgroup('Super chargeurs', bornesRapides, countLabel(bornesRapides.length, 'rapide', 'rapides')),
        renderPompeSubgroup('Chargeurs', bornesLentes, countLabel(bornesLentes.length, 'lent', 'lents'))
      ])
      + '</div>';
  }

  function selectPompe(id) {
    var p = pompes.find(function(x) { return x.id_pompe == id; });
    if (!p) return;

    if (p.statut !== 'active') {
      log('pompe-log', 'err', 'Cette pompe n\'est pas disponible (statut : ' + p.statut + ').');
      return;
    }

    selectedPompeId = id;
    var typeLabel = p.type_pompe === 'carburant' ? 'Pompe' : 'Borne';
    var sel = document.getElementById('pompe-select');
    sel.innerHTML = '<option value="' + id + '">' + typeLabel + ' n' + p.numero + '</option>';

    document.getElementById('pompe-carburant-opts').style.display = p.type_pompe === 'carburant' ? '' : 'none';
    document.getElementById('pompe-elec-opts').style.display = p.type_pompe === 'electricite' ? '' : 'none';
    if (p.type_pompe === 'carburant') {
      if (!carburants.length) {
        refreshCarburants();
      } else {
        renderCarburantsButtons();
      }
    } else {
      selectedCarburantId = null;
    }

    setStep('start');
    renderPompes();
    log('pompe-log', 'info', typeLabel + ' n' + p.numero + ' selectionnee.');
  }

  function setStep(step) {
    currentStep = step;
    var steps = ['select', 'start', 'end'];
    steps.forEach(function(s) {
      var el = document.getElementById('step-' + s);
      if (!el) return;
      el.className = 'sim-step';
      if (s === step) el.classList.add('current');
      else if (steps.indexOf(s) < steps.indexOf(step)) el.classList.add('done');
    });
    if (step === 'done') {
      ['select','start','end'].forEach(function(s) {
        var el = document.getElementById('step-' + s);
        if (el) el.className = 'sim-step done';
      });
    }

    document.getElementById('pompe-step-select').style.display = step === 'select' ? '' : 'none';
    document.getElementById('pompe-step-start').style.display  = step === 'start'  ? '' : 'none';
    document.getElementById('pompe-step-end').style.display    = step === 'end'    ? '' : 'none';
    document.getElementById('pompe-step-done').style.display   = step === 'done'   ? '' : 'none';
  }

  function demarrerLivraison() {
    if (startRequestRunning) return;
    if (!selectedPompeId) return;
    var p = pompes.find(function(x) { return x.id_pompe == selectedPompeId; });
    if (!p) return;

    var body = {};
    var unit;
    if (p.type_pompe === 'carburant') {
      if (!selectedCarburantId) {
        log('pompe-log', 'err', 'Veuillez choisir un type de carburant avant de démarrer.');
        return;
      }
      body.id_energie = Number(selectedCarburantId);
      body.quantite_delivree = Number(document.getElementById('pompe-qty').value);
      unit = 'L';
    } else {
      body.quantite_delivree = Number(document.getElementById('borne-kwh').value);
      unit = 'kWh';
    }

    var btn = document.getElementById('btn-demarrer');
    if (!btn) return;
    startRequestRunning = true;
    btn.disabled = true;

    api('POST', '/json/pompes/' + selectedPompeId + '/demarrer', body).then(function() {
      var typeLabel = p.type_pompe === 'carburant' ? 'pompe' : 'borne';
      var carburant = p.type_pompe === 'carburant' ? getSelectedCarburant() : null;
      var carburantSuffix = carburant ? (' [' + carburant.libelle + ']') : '';
      log('pompe-log','ok','Livraison demarree sur ' + typeLabel + ' n' + p.numero + ' -- ' + body.quantite_delivree + ' ' + unit);

      var recap = document.getElementById('pompe-recap');
      if (recap) {
        recap.innerHTML = 'En cours : <strong>' + (p.type_pompe === 'carburant' ? 'Pompe' : 'Borne')
          + ' n' + p.numero + '</strong>' + carburantSuffix + ' -- ' + body.quantite_delivree + ' ' + unit;
      }

      return refreshPompes().then(function() {
        setStep('end');
      });
    }).catch(function(e) {
      log('pompe-log','err','Echec demarrage : ' + e.message);
    }).finally(function() {
      startRequestRunning = false;
      if (currentStep === 'start') {
        btn.disabled = false;
      }
    });
  }

  function terminerLivraison() {
    if (endRequestRunning) return;
    if (!selectedPompeId) return;
    var p = pompes.find(function(x) { return x.id_pompe == selectedPompeId; });
    if (!p) return;

    var btn = document.getElementById('btn-terminer');
    if (!btn) return;
    endRequestRunning = true;
    btn.disabled = true;

    api('POST', '/json/pompes/' + selectedPompeId + '/terminer').then(function() {
      var typeLabel = p.type_pompe === 'carburant' ? 'pompe' : 'borne';
      log('pompe-log','ok','Livraison terminee sur ' + typeLabel + ' n' + p.numero + ' -- prete a encaisser sur la caisse.');
      return refreshPompes().then(function() {
        setStep('done');
      });
    }).catch(function(e) {
      log('pompe-log','err','Echec fin livraison : ' + e.message);
    }).finally(function() {
      endRequestRunning = false;
      if (currentStep === 'end') {
        btn.disabled = false;
      }
    });
  }

  function resetPompe() {
    selectedPompeId = null;
    selectedCarburantId = null;
    startRequestRunning = false;
    endRequestRunning = false;
    document.getElementById('pompe-select').innerHTML = '<option value="">Aucune</option>';
    document.getElementById('pompe-carburant-opts').style.display = 'none';
    document.getElementById('pompe-elec-opts').style.display = 'none';
    document.getElementById('btn-demarrer').disabled = false;
    document.getElementById('btn-demarrer').textContent = 'Demarrer la livraison';
    document.getElementById('btn-terminer').disabled = false;
    document.getElementById('btn-terminer').textContent = 'Terminer la livraison';
    setStep('select');
    refreshPompes();
  }

  // ── Init ──
  function onStoragePing(event) {
    if (!event || event.key !== 'unica_cce_balance_ping') return;
    refreshCCE();
  }

  function init() {
    initNav();
    renderPopupCatalog();
    refreshCCE();
    refreshCarburants();
    startPompesSSE();
    window.addEventListener('storage', onStoragePing);
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    refreshPompes: refreshPompes,
    selectPompe: selectPompe,
    showPopup: showPopup,
    demarrerLivraison: demarrerLivraison,
    terminerLivraison: terminerLivraison,
    resetPompe: resetPompe,
    selectCarburant: selectCarburant,
    refreshCCE: refreshCCE,
    selectCCE: selectCCE
  };
})();
</script>

</body>
</html>
