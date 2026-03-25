<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UNICA — Simulateur Physique</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Familjen+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <?php
    $baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    if ($baseUrl === '/' || $baseUrl === '\\') $baseUrl = '';
  ?>
  <script>const API = '<?= $baseUrl ?>';</script>
  <style>
    /* ── Variables — même DA que la caisse ────────────────── */
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

    /* ── Topbar ──────────────────────────────────────────── */
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

    /* ── Layout ──────────────────────────────────────────── */
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
    }
    .sim-nav-btn:hover { background:var(--accent-dim); }
    .sim-nav-btn.active { background:var(--accent); color:#fff; font-weight:500; }
    .sim-nav-btn .icon { font-size:16px; width:22px; text-align:center; }
    .sim-nav-sep { height:1px; background:var(--border); margin:8px 4px; }

    .sim-main { flex:1; overflow-y:auto; padding:24px 32px; }

    /* ── Cards ────────────────────────────────────────────── */
    .sim-section { max-width:900px; margin:0 auto; }
    .sim-section-title { font-family:var(--display); font-size:22px; font-weight:700; margin-bottom:6px; }
    .sim-section-desc { color:var(--text-dim); font-size:12px; margin-bottom:20px; line-height:1.5; }

    .sim-card {
      background:var(--surface); border:1.5px solid var(--border);
      border-radius:12px; padding:20px; margin-bottom:16px;
      backdrop-filter:blur(12px);
    }
    .sim-card-title { font-family:var(--display); font-weight:600; font-size:14px; margin-bottom:12px; display:flex; align-items:center; gap:8px; }
    .sim-card-title .dot { width:8px; height:8px; border-radius:50%; }
    .sim-card-title .dot--green { background:var(--green); }
    .sim-card-title .dot--orange { background:var(--sim-orange); }
    .sim-card-title .dot--red { background:var(--danger); }

    /* ── Forms ────────────────────────────────────────────── */
    .sim-row { display:flex; gap:12px; align-items:end; flex-wrap:wrap; margin-bottom:12px; }
    .sim-field { display:flex; flex-direction:column; gap:4px; }
    .sim-field label { font-size:11px; color:var(--text-dim); font-weight:500; }
    .sim-field select, .sim-field input {
      height:38px; border:1.5px solid var(--border); border-radius:8px;
      padding:0 12px; font-family:var(--mono); font-size:12px; color:var(--text);
      background:#fff; min-width:140px;
    }
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

    /* ── Log ──────────────────────────────────────────────── */
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

    /* ── Pompes grid ─────────────────────────────────────── */
    .sim-pompes-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:10px; margin-bottom:14px; }
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

    /* ── Products grid ───────────────────────────────────── */
    .sim-produits-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:8px; margin-bottom:14px; }
    .sim-produit-chip {
      padding:10px 14px; border-radius:10px; border:1.5px solid var(--border);
      background:var(--surface2); font-size:11px; cursor:pointer; transition:all .12s;
      display:flex; justify-content:space-between; align-items:center;
    }
    .sim-produit-chip:hover { border-color:var(--accent); background:var(--accent-dim); }
    .sim-produit-chip .name { font-weight:500; }
    .sim-produit-chip .prix { color:var(--accent); font-weight:600; }
    .sim-produit-chip .code { color:var(--text-dim); font-size:10px; }

    /* ── CCE grid ────────────────────────────────────────── */
    .sim-cce-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:8px; margin-bottom:14px; }
    .sim-cce-chip {
      padding:10px 14px; border-radius:10px; border:1.5px solid var(--border);
      background:var(--surface2); font-size:11px; cursor:pointer; transition:all .12s;
    }
    .sim-cce-chip:hover { border-color:var(--accent); }
    .sim-cce-chip.selected { border-color:var(--accent); background:var(--accent-dim); }
    .sim-cce-chip .label { font-weight:600; }
    .sim-cce-chip .solde { color:var(--green); font-weight:600; }

    /* ── Hidden sections ─────────────────────────────────── */
    .sim-panel { display:none; }
    .sim-panel.active { display:block; }

    /* ── Range display ───────────────────────────────────── */
    .sim-range-val { font-weight:600; color:var(--accent); min-width:60px; text-align:right; }

    /* ── Reappro table ───────────────────────────────────── */
    .sim-reappro-table { width:100%; border-collapse:collapse; font-size:11px; }
    .sim-reappro-table th { text-align:left; padding:6px 10px; color:var(--text-dim); border-bottom:1.5px solid var(--border); }
    .sim-reappro-table td { padding:6px 10px; border-bottom:1px solid var(--border); }
    .sim-reappro-table .badge { padding:2px 8px; border-radius:999px; font-size:10px; font-weight:600; }
    .sim-reappro-table .badge--en_cours { background:var(--warn-dim); color:var(--warn); }
    .sim-reappro-table .badge--arrive { background:var(--green-dim); color:var(--green); }
    .sim-reappro-table .badge--annule { background:var(--danger-dim); color:var(--danger); }
    .sim-reappro-table .badge--en_retard { background:var(--sim-orange-dim); color:var(--sim-orange); }
  </style>
</head>
<body>

<!-- ═══ TOPBAR ═══ -->
<div class="sim-topbar">
  <span class="sim-topbar-brand">UNICA Station</span>
  <span class="sim-topbar-badge">Simulateur Physique</span>
  <span class="sim-topbar-sep"></span>
  <a class="sim-topbar-link" href="<?= $baseUrl ?>/caisse" target="_blank">↗ Ouvrir la caisse</a>
  <a class="sim-topbar-link" href="<?= $baseUrl ?>/gerant" target="_blank">↗ Ouvrir le gérant</a>
</div>

<!-- ═══ BODY ═══ -->
<div class="sim-body">

  <!-- ── NAV ── -->
  <nav class="sim-nav">
    <div class="sim-nav-title">Client</div>
    <button class="sim-nav-btn active" data-panel="scanner"><span class="icon">📦</span> Scanner Produit</button>
    <button class="sim-nav-btn" data-panel="pompes"><span class="icon">⛽</span> Pompes & Bornes</button>
    <button class="sim-nav-btn" data-panel="cce"><span class="icon">💳</span> Carte CCE</button>
    <div class="sim-nav-sep"></div>
    <div class="sim-nav-title">Fournisseur</div>
    <button class="sim-nav-btn" data-panel="reappro"><span class="icon">🚛</span> Livraisons</button>
    <div class="sim-nav-sep"></div>
    <div class="sim-nav-title">Environnement</div>
    <button class="sim-nav-btn" data-panel="stocks"><span class="icon">📊</span> Forcer Stocks</button>
    <button class="sim-nav-btn" data-panel="incident"><span class="icon">⚠️</span> Déclencher Incident</button>
  </nav>

  <!-- ── MAIN ── -->
  <div class="sim-main">

    <!-- ══════════ SCANNER PRODUIT ══════════ -->
    <div id="panel-scanner" class="sim-panel active">
      <div class="sim-section">
        <div class="sim-section-title">📦 Scanner un produit</div>
        <div class="sim-section-desc">
          Simule le lecteur de code-barres de la caisse. Cliquez sur un produit pour vérifier qu'il existe dans la base.
          L'ajout au panier se fait côté caisse — ici on vérifie juste que l'article est reconnu.
        </div>
        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> Produits en boutique</div>
          <div id="produits-grid" class="sim-produits-grid"></div>
          <div class="sim-row">
            <div class="sim-field">
              <label>Ou saisir un code-barres manuellement</label>
              <input type="text" id="scan-manual" placeholder="Ex: 5449000214911">
            </div>
            <button class="sim-btn sim-btn--primary" onclick="Sim.scanManual()">Scanner</button>
            <button class="sim-btn sim-btn--green" onclick="Sim.scanRandom()">🎲 Article aléatoire</button>
          </div>
          <div id="scan-log" class="sim-log"></div>
        </div>
      </div>
    </div>

    <!-- ══════════ POMPES & BORNES ══════════ -->
    <div id="panel-pompes" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">⛽ Pompes & Bornes</div>
        <div class="sim-section-desc">
          Simulez le parcours client : choisir une pompe/borne → démarrer la livraison → terminer.
          La caisse voit les changements en temps réel.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> État des pompes</div>
          <div id="pompes-grid" class="sim-pompes-grid"></div>
          <button class="sim-btn sim-btn--primary" onclick="Sim.refreshPompes()" style="margin-bottom:14px;">↻ Rafraîchir</button>
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--orange"></span> Actions client</div>
          <div class="sim-row">
            <div class="sim-field">
              <label>Pompe sélectionnée</label>
              <select id="pompe-select"><option value="">Cliquez sur une pompe ci-dessus</option></select>
            </div>
          </div>

          <div id="pompe-carburant-opts" style="display:none;">
            <div class="sim-row">
              <div class="sim-field">
                <label>Quantité (litres)</label>
                <input type="range" id="pompe-qty" min="5" max="60" value="25" oninput="document.getElementById('pompe-qty-val').textContent=this.value+' L'">
              </div>
              <span class="sim-range-val" id="pompe-qty-val">25 L</span>
            </div>
          </div>

          <div id="pompe-elec-opts" style="display:none;">
            <div class="sim-row">
              <div class="sim-field">
                <label>Énergie chargée (kWh)</label>
                <input type="range" id="borne-kwh" min="5" max="80" value="30" oninput="document.getElementById('borne-kwh-val').textContent=this.value+' kWh'">
              </div>
              <span class="sim-range-val" id="borne-kwh-val">30 kWh</span>
            </div>
          </div>

          <div class="sim-row" style="margin-top:8px;">
            <button class="sim-btn sim-btn--green" id="btn-demarrer" onclick="Sim.demarrerLivraison()" disabled>▶ Démarrer livraison</button>
            <button class="sim-btn sim-btn--orange" id="btn-terminer" onclick="Sim.terminerLivraison()" disabled>⏹ Terminer livraison</button>
            <button class="sim-btn sim-btn--primary" id="btn-activer" onclick="Sim.activerPompe()" disabled>⚡ Réactiver pompe</button>
          </div>
          <div id="pompe-log" class="sim-log"></div>
        </div>
      </div>
    </div>

    <!-- ══════════ CARTE CCE ══════════ -->
    <div id="panel-cce" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">💳 Carte Crédit Énergie</div>
        <div class="sim-section-desc">
          Simulez le passage d'une carte CCE : sélectionnez une carte, saisissez le code secret pour "scanner" la carte.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> Cartes CCE existantes</div>
          <div id="cce-grid" class="sim-cce-grid"></div>
          <button class="sim-btn sim-btn--primary" onclick="Sim.refreshCCE()">↻ Rafraîchir</button>
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--orange"></span> Scanner une carte</div>
          <div class="sim-row">
            <div class="sim-field">
              <label>Carte sélectionnée</label>
              <select id="cce-select"><option value="">Cliquez sur une carte</option></select>
            </div>
            <div class="sim-field">
              <label>Code secret (4 chiffres)</label>
              <input type="text" id="cce-code" placeholder="****" maxlength="4" style="width:100px;">
            </div>
            <button class="sim-btn sim-btn--green" onclick="Sim.scanCCE()">Scanner la carte</button>
          </div>
          <div id="cce-log" class="sim-log"></div>
        </div>
      </div>
    </div>

    <!-- ══════════ LIVRAISONS FOURNISSEUR ══════════ -->
    <div id="panel-reappro" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">🚛 Livraisons fournisseur</div>
        <div class="sim-section-desc">
          Simulez l'arrivée d'un camion de livraison : passez un réappro "En Cours" → "Arrivé" pour mettre à jour les stocks.
          Vous pouvez aussi signaler un retard.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--orange"></span> Réapprovisionnements en cours</div>
          <div id="reappro-list"></div>
          <button class="sim-btn sim-btn--primary" onclick="Sim.refreshReappros()" style="margin-top:10px;">↻ Rafraîchir</button>
          <div id="reappro-log" class="sim-log"></div>
        </div>
      </div>
    </div>

    <!-- ══════════ FORCER STOCKS ══════════ -->
    <div id="panel-stocks" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">📊 Forcer les niveaux de stock</div>
        <div class="sim-section-desc">
          Modifiez directement les quantités en stock pour tester les alertes de stock faible ou préparer une démo.
          ⚠️ Écriture directe en BDD via la route /json/bdd/.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--red"></span> Stocks actuels</div>
          <div id="stocks-list"></div>
          <button class="sim-btn sim-btn--primary" onclick="Sim.refreshStocks()" style="margin-top:10px;">↻ Rafraîchir</button>
          <div id="stocks-log" class="sim-log"></div>
        </div>
      </div>
    </div>

    <!-- ══════════ INCIDENT ══════════ -->
    <div id="panel-incident" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">⚠️ Déclencher un incident</div>
        <div class="sim-section-desc">
          Simulez un événement imprévu dans la station. L'incident apparaîtra dans le panneau incidents du gérant.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--red"></span> Créer un incident</div>
          <div class="sim-row">
            <div class="sim-field" style="flex:1;">
              <label>Type d'incident</label>
              <select id="incident-type">
                <option value="Panne pompe">Panne pompe</option>
                <option value="Fuite carburant">Fuite carburant</option>
                <option value="Coupure électrique">Coupure électrique</option>
                <option value="Borne hors service">Borne hors service</option>
                <option value="Alarme déclenchée">Alarme déclenchée</option>
                <option value="Incivilité client">Incivilité client</option>
                <option value="Problème TPE">Problème TPE</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
          </div>
          <div class="sim-row">
            <div class="sim-field" style="flex:1;">
              <label>Détail technique</label>
              <input type="text" id="incident-detail" placeholder="Ex: Pompe n°2 hors service - défaut électrique" style="width:100%;">
            </div>
          </div>
          <div class="sim-row">
            <div class="sim-field" style="flex:1;">
              <label>Solution apportée</label>
              <input type="text" id="incident-solution" placeholder="Ex: Technicien appelé" style="width:100%;">
            </div>
          </div>
          <button class="sim-btn sim-btn--danger" onclick="Sim.creerIncident()">🚨 Créer l'incident</button>
          <div id="incident-log" class="sim-log"></div>
        </div>
      </div>
    </div>

  </div><!-- /sim-main -->
</div><!-- /sim-body -->

<script>
/**
 * Simulateur Physique — UNICA Station
 * Appelle les mêmes routes JSON que la caisse.
 */
const Sim = (() => {
  // ── API helper ────────────────────────────────────────
  async function api(method, route, body = null) {
    const opts = { method, headers: { 'Accept':'application/json', 'Content-Type':'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + route, opts);
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || `Erreur ${r.status}`);
    return d;
  }

  function ts() {
    return new Date().toLocaleTimeString('fr-FR');
  }
  function log(el, cls, msg) {
    const d = document.getElementById(el);
    d.innerHTML = `<div><span class="ts">[${ts()}]</span> <span class="${cls}">${msg}</span></div>` + d.innerHTML;
  }

  // ── State ─────────────────────────────────────────────
  let pompes = [];
  let selectedPompeId = null;
  let cces = [];
  let selectedCceId = null;

  // ── Navigation ────────────────────────────────────────
  function initNav() {
    document.querySelectorAll('.sim-nav-btn[data-panel]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sim-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.sim-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + btn.dataset.panel)?.classList.add('active');
        // Auto-refresh on panel switch
        const p = btn.dataset.panel;
        if (p === 'pompes') refreshPompes();
        if (p === 'cce') refreshCCE();
        if (p === 'reappro') refreshReappros();
        if (p === 'stocks') refreshStocks();
      });
    });
  }

  // ══════════════════════════════════════════════════════
  //  SCANNER PRODUIT
  // ══════════════════════════════════════════════════════
  async function loadProduits() {
    try {
      const articles = await api('GET', '/json/articles');
      const grid = document.getElementById('produits-grid');
      grid.innerHTML = articles.map(a => `
        <div class="sim-produit-chip" onclick="Sim.scanCode('${a.code_barres}')">
          <div>
            <div class="name">${esc(a.libelle_produit)}</div>
            <div class="code">${a.code_barres}</div>
          </div>
          <div class="prix">${Number(a.prix).toFixed(2)} €</div>
        </div>
      `).join('');
    } catch(e) {
      log('scan-log','err','Erreur chargement produits : ' + e.message);
    }
  }

  async function scanCode(code) {
    try {
      const a = await api('GET', `/json/articles/${code}`);
      log('scan-log','ok',`✓ Article reconnu : <strong>${esc(a.libelle_produit)}</strong> — ${Number(a.prix).toFixed(2)} € (code: ${code})`);
    } catch(e) {
      log('scan-log','err',`✗ Article non reconnu (code: ${code}) — ${e.message}`);
    }
  }

  function scanManual() {
    const input = document.getElementById('scan-manual');
    const code = input.value.trim();
    if (!code) return;
    scanCode(code);
    input.value = '';
  }

  async function scanRandom() {
    try {
      const a = await api('GET', '/json/articles/random');
      log('scan-log','ok',`🎲 Article aléatoire : <strong>${esc(a.libelle_produit)}</strong> — ${Number(a.prix).toFixed(2)} € (code: ${a.code_barres})`);
    } catch(e) {
      log('scan-log','err','Erreur article aléatoire : ' + e.message);
    }
  }

  // ══════════════════════════════════════════════════════
  //  POMPES & BORNES
  // ══════════════════════════════════════════════════════
  async function refreshPompes() {
    try {
      pompes = await api('GET', '/json/pompes');
      renderPompes();
    } catch(e) {
      log('pompe-log','err','Erreur chargement pompes : ' + e.message);
    }
  }

  function renderPompes() {
    const grid = document.getElementById('pompes-grid');
    grid.innerHTML = pompes.map(p => {
      const type = p.type_pompe === 'carburant' ? '⛽' : '🔌';
      const sousType = p.sous_type ? ` (${p.sous_type})` : '';
      const mode = p.mode === 'auto' ? 'Auto 24' : 'Manuel';
      const sel = p.id_pompe == selectedPompeId ? 'selected' : '';
      return `
        <div class="sim-pompe-chip ${sel}" onclick="Sim.selectPompe(${p.id_pompe})">
          <div class="label">${type} ${p.type_pompe === 'carburant' ? 'Pompe' : 'Borne'} n°${p.numero}${sousType}</div>
          <div class="meta">${mode}</div>
          <span class="status status--${p.statut}">${p.statut}</span>
          ${p.transaction ? `<div class="meta" style="margin-top:4px;">${esc(p.transaction.libelle || p.transaction.type_charge || '')} · ${Number(p.transaction.quantite_delivree || 0).toFixed(1)} ${p.type_pompe==='carburant'?'L':'kWh'} · ${Number(p.transaction.prix_total || 0).toFixed(2)} €</div>` : ''}
        </div>
      `;
    }).join('');
    updatePompeButtons();
  }

  function selectPompe(id) {
    selectedPompeId = id;
    const p = pompes.find(x => x.id_pompe == id);
    // Update select
    const sel = document.getElementById('pompe-select');
    sel.innerHTML = `<option value="${id}">${p.type_pompe === 'carburant' ? 'Pompe' : 'Borne'} n°${p.numero} (${p.statut})</option>`;
    // Show/hide carburant/elec options
    document.getElementById('pompe-carburant-opts').style.display = p.type_pompe === 'carburant' ? '' : 'none';
    document.getElementById('pompe-elec-opts').style.display = p.type_pompe === 'electricite' ? '' : 'none';
    renderPompes();
  }

  function updatePompeButtons() {
    const p = pompes.find(x => x.id_pompe == selectedPompeId);
    document.getElementById('btn-demarrer').disabled = !p || p.statut !== 'active';
    document.getElementById('btn-terminer').disabled = !p || p.statut !== 'en_cours';
    document.getElementById('btn-activer').disabled  = !p || p.statut !== 'desactivee' || !!p.transaction;
  }

  async function demarrerLivraison() {
    if (!selectedPompeId) return;
    const p = pompes.find(x => x.id_pompe == selectedPompeId);
    const body = {};
    if (p.type_pompe === 'carburant') {
      body.quantite_delivree = Number(document.getElementById('pompe-qty').value);
    } else {
      body.quantite_delivree = Number(document.getElementById('borne-kwh').value);
    }
    try {
      const r = await api('POST', `/json/pompes/${selectedPompeId}/demarrer`, body);
      log('pompe-log','ok',`▶ Livraison démarrée sur ${p.type_pompe === 'carburant' ? 'pompe' : 'borne'} n°${p.numero} — ${body.quantite_delivree} ${p.type_pompe==='carburant'?'L':'kWh'}`);
      await refreshPompes();
    } catch(e) {
      log('pompe-log','err','Échec démarrage : ' + e.message);
    }
  }

  async function terminerLivraison() {
    if (!selectedPompeId) return;
    const p = pompes.find(x => x.id_pompe == selectedPompeId);
    try {
      await api('POST', `/json/pompes/${selectedPompeId}/terminer`);
      log('pompe-log','ok',`⏹ Livraison terminée sur ${p.type_pompe === 'carburant' ? 'pompe' : 'borne'} n°${p.numero} — prête à encaisser`);
      await refreshPompes();
    } catch(e) {
      log('pompe-log','err','Échec fin livraison : ' + e.message);
    }
  }

  async function activerPompe() {
    if (!selectedPompeId) return;
    const p = pompes.find(x => x.id_pompe == selectedPompeId);
    try {
      await api('POST', `/json/pompes/${selectedPompeId}/activer`);
      log('pompe-log','ok',`⚡ ${p.type_pompe === 'carburant' ? 'Pompe' : 'Borne'} n°${p.numero} réactivée`);
      await refreshPompes();
    } catch(e) {
      log('pompe-log','err','Échec activation : ' + e.message);
    }
  }

  // ══════════════════════════════════════════════════════
  //  CARTE CCE
  // ══════════════════════════════════════════════════════
  async function refreshCCE() {
    try {
      cces = await api('GET', '/json/cce');
      renderCCE();
    } catch(e) {
      log('cce-log','err','Erreur chargement CCE : ' + e.message);
    }
  }

  function renderCCE() {
    const grid = document.getElementById('cce-grid');
    grid.innerHTML = cces.map(c => {
      const sel = c.id_carte_CE == selectedCceId ? 'selected' : '';
      return `
        <div class="sim-cce-chip ${sel}" onclick="Sim.selectCCE(${c.id_carte_CE})">
          <div class="label">Carte #${c.id_carte_CE} — ${esc(c.prenom)} ${esc(c.nom)}</div>
          <div class="solde">Solde : ${Number(c.solde_client).toFixed(2)} €</div>
        </div>
      `;
    }).join('');
  }

  function selectCCE(id) {
    selectedCceId = id;
    const c = cces.find(x => x.id_carte_CE == id);
    const sel = document.getElementById('cce-select');
    sel.innerHTML = `<option value="${id}">Carte #${id} — ${c.prenom} ${c.nom}</option>`;
    document.getElementById('cce-code').value = '';
    renderCCE();
  }

  async function scanCCE() {
    if (!selectedCceId) { log('cce-log','err','Sélectionnez une carte d\'abord.'); return; }
    const code = document.getElementById('cce-code').value.trim();
    const c = cces.find(x => x.id_carte_CE == selectedCceId);
    try {
      // On vérifie la carte via l'API
      const carte = await api('GET', `/json/cce/${selectedCceId}`);
      // Vérification du code secret côté client (simulation)
      if (code && String(carte.code_secret) !== code) {
        log('cce-log','err',`✗ Code secret incorrect pour la carte #${selectedCceId}. Code refusé.`);
        return;
      }
      log('cce-log','ok',`✓ Carte #${selectedCceId} scannée — <strong>${esc(carte.prenom)} ${esc(carte.nom)}</strong> — Solde : ${Number(carte.solde_client).toFixed(2)} €`);
    } catch(e) {
      log('cce-log','err','Échec scan CCE : ' + e.message);
    }
  }

  // ══════════════════════════════════════════════════════
  //  LIVRAISONS FOURNISSEUR
  // ══════════════════════════════════════════════════════
  async function refreshReappros() {
    try {
      const all = await api('GET', '/json/reappros');
      renderReappros(all);
    } catch(e) {
      log('reappro-log','err','Erreur chargement réappros : ' + e.message);
    }
  }

  function renderReappros(list) {
    const el = document.getElementById('reappro-list');
    if (!list.length) {
      el.innerHTML = '<div style="color:var(--text-dim);font-style:italic;padding:10px;">Aucun réapprovisionnement trouvé.</div>';
      return;
    }
    el.innerHTML = `
      <table class="sim-reappro-table">
        <thead><tr><th>#</th><th>Article</th><th>Type</th><th>Statut</th><th>Volume</th><th>Actions</th></tr></thead>
        <tbody>
          ${list.map(r => `
            <tr>
              <td>${r.id_reappro}</td>
              <td>${esc(r.libelle || r.libelle_produit || r.id_article || '?')}</td>
              <td>${r.type_reappro || '?'}</td>
              <td><span class="badge badge--${(r.statut||'').replace(/ /g,'_').toLowerCase()}">${r.statut}</span></td>
              <td>${r.volume || '?'}</td>
              <td>
                ${r.statut === 'En Cours' ? `
                  <button class="sim-btn sim-btn--green" style="height:28px;font-size:11px;" onclick="Sim.reapproAction(${r.id_reappro},'Arrivé')">📦 Arrivé</button>
                  <button class="sim-btn sim-btn--orange" style="height:28px;font-size:11px;" onclick="Sim.reapproAction(${r.id_reappro},'En Retard')">⏰ En retard</button>
                ` : '—'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async function reapproAction(id, statut) {
    try {
      await api('POST', `/json/reappros/${id}/statut`, { statut });
      log('reappro-log','ok',`Réappro #${id} → <strong>${statut}</strong>`);
      await refreshReappros();
    } catch(e) {
      log('reappro-log','err',`Échec mise à jour réappro #${id} : ${e.message}`);
    }
  }

  // ══════════════════════════════════════════════════════
  //  FORCER STOCKS
  // ══════════════════════════════════════════════════════
  async function refreshStocks() {
    try {
      const stocks = await api('GET', '/json/bdd/Stock');
      renderStocks(stocks);
    } catch(e) {
      log('stocks-log','err','Erreur chargement stocks : ' + e.message);
    }
  }

  function renderStocks(list) {
    const el = document.getElementById('stocks-list');
    const rows = (list.data || list).map ? (list.data || list) : [];
    el.innerHTML = `
      <table class="sim-reappro-table">
        <thead><tr><th>#</th><th>id_article</th><th>Quantité</th><th>Type</th><th>Nouvelle qté</th><th></th></tr></thead>
        <tbody>
          ${rows.map(s => `
            <tr>
              <td>${s.id_stock}</td>
              <td>${s.id_article}</td>
              <td><strong>${Number(s.quantite_stock).toFixed(1)}</strong></td>
              <td>${s.type_quantite}</td>
              <td><input type="number" id="stock-val-${s.id_stock}" value="${Number(s.quantite_stock).toFixed(1)}" style="width:100px;height:30px;border:1.5px solid var(--border);border-radius:6px;padding:0 8px;font-family:var(--mono);font-size:11px;"></td>
              <td><button class="sim-btn sim-btn--orange" style="height:28px;font-size:11px;" onclick="Sim.updateStock(${s.id_stock})">Appliquer</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  async function updateStock(idStock) {
    const input = document.getElementById(`stock-val-${idStock}`);
    const newVal = Number(input.value);
    try {
      await api('POST', `/json/bdd/Stock/${idStock}`, { quantite_stock: newVal });
      log('stocks-log','ok',`Stock #${idStock} mis à jour → <strong>${newVal}</strong>`);
      await refreshStocks();
    } catch(e) {
      log('stocks-log','err',`Échec mise à jour stock #${idStock} : ${e.message}`);
    }
  }

  // ══════════════════════════════════════════════════════
  //  INCIDENTS
  // ══════════════════════════════════════════════════════
  async function creerIncident() {
    const type = document.getElementById('incident-type').value;
    const detail = document.getElementById('incident-detail').value.trim();
    const solution = document.getElementById('incident-solution').value.trim();
    if (!detail) { log('incident-log','err','Le détail technique est requis.'); return; }
    try {
      await api('POST', '/json/incidents', {
        type_incident: type,
        detail_technique: detail,
        solution_apportee: solution || 'En attente'
      });
      log('incident-log','ok',`🚨 Incident créé : <strong>${esc(type)}</strong> — ${esc(detail)}`);
      document.getElementById('incident-detail').value = '';
      document.getElementById('incident-solution').value = '';
    } catch(e) {
      log('incident-log','err','Échec création incident : ' + e.message);
    }
  }

  // ── Helpers ───────────────────────────────────────────
  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  // ── Init ──────────────────────────────────────────────
  function init() {
    initNav();
    loadProduits();
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    scanCode, scanManual, scanRandom,
    refreshPompes, selectPompe, demarrerLivraison, terminerLivraison, activerPompe,
    refreshCCE, selectCCE, scanCCE,
    refreshReappros, reapproAction,
    refreshStocks, updateStock,
    creerIncident,
  };
})();
</script>

</body>
</html>