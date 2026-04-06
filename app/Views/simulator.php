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
    $assetsUrl = $baseUrl . '/assets';
  ?>
  <link rel="icon" type="image/png" href="<?= $assetsUrl ?>/img/logo_unica.png">
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
    .sim-log:empty::before { content:"Aucune action pour l’instant."; color:var(--text-dim); font-style:italic; }
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
    .sim-start-reason {
      display:none;
      margin-top:8px;
      font-size:11px;
      color:var(--text-dim);
    }
    .sim-start-reason--warn { color:var(--warn); }
    .sim-start-reason--err { color:var(--danger); }
    .sim-start-reason--info { color:var(--accent); }

    .sim-start-layout {
      display:grid;
      grid-template-columns:minmax(320px, 1fr) minmax(300px, 0.9fr);
      gap:14px;
      align-items:start;
    }
    .sim-start-controls {
      min-width:0;
    }
    .sim-runtime-screen {
      border:1.5px solid var(--border);
      border-radius:12px;
      background:linear-gradient(180deg, rgba(255,255,255,.94) 0%, rgba(245,247,255,.9) 100%);
      padding:12px;
      min-height:100%;
    }
    .sim-runtime-title {
      font-family:var(--display);
      font-size:13px;
      font-weight:700;
      color:var(--text);
      margin-bottom:8px;
    }
    .sim-runtime-grid {
      display:grid;
      gap:6px;
    }
    .sim-runtime-row {
      display:grid;
      grid-template-columns:minmax(0,1fr) auto;
      align-items:center;
      gap:10px;
      padding:7px 8px;
      border:1px solid var(--border);
      border-radius:8px;
      background:rgba(255,255,255,.72);
    }
    .sim-runtime-label {
      font-size:11px;
      color:var(--text-dim);
    }
    .sim-runtime-value {
      font-size:11px;
      color:var(--text);
      font-weight:600;
      text-align:right;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
      max-width:220px;
    }
    .sim-runtime-payment {
      margin-top:10px;
      border:1px dashed var(--border);
      border-radius:10px;
      background:rgba(129,140,248,.08);
      padding:10px;
    }
    .sim-runtime-payment-title {
      font-size:11px;
      font-weight:700;
      color:var(--accent);
      margin-bottom:4px;
      text-transform:uppercase;
      letter-spacing:.04em;
    }
    .sim-runtime-payment-instr {
      font-size:11px;
      color:var(--text-mid);
      margin-bottom:8px;
      line-height:1.35;
    }

    @media (max-width: 980px) {
      .sim-start-layout {
        grid-template-columns:1fr;
      }
      .sim-runtime-value {
        max-width:none;
      }
    }

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

    /* ── Reçus ── */
    .sim-receipts-wrap {
      border:1.5px solid var(--border);
      border-radius:10px;
      overflow:hidden;
      background:rgba(255,255,255,.66);
    }
    .sim-receipts-table {
      width:100%;
      border-collapse:collapse;
      table-layout:fixed;
    }
    .sim-receipts-table th,
    .sim-receipts-table td {
      border-bottom:1px solid var(--border);
      padding:8px 10px;
      font-size:11px;
      text-align:left;
      vertical-align:middle;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .sim-receipts-table th {
      background:var(--surface2);
      color:var(--text-mid);
      text-transform:uppercase;
      letter-spacing:.03em;
      font-weight:600;
    }
    .sim-receipts-table tr:hover td { background:rgba(129,140,248,.08); }
    .sim-receipts-table tbody tr { cursor:pointer; }
    .sim-receipts-table td:last-child { text-align:right; }
    .sim-receipts-empty {
      padding:14px;
      color:var(--text-dim);
      font-style:italic;
      font-size:11px;
    }

    .sim-recu-btn {
      height:28px;
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
    .sim-recu-btn:hover {
      border-color:var(--accent);
      color:var(--accent);
    }

    .sim-recu-popup {
      border:1.5px solid #111 !important;
      border-radius:4px !important;
      background:#fff !important;
      color:#111 !important;
      box-shadow:0 10px 36px rgba(0,0,0,.22) !important;
    }
    .sim-recu-ticket {
      width:100%;
      max-width:430px;
      margin:0 auto;
      text-align:left;
      color:#111;
      font-family:var(--mono);
      font-size:12px;
      line-height:1.3;
    }
    .sim-recu-scroll {
      max-height:64vh;
      overflow-y:auto;
      padding-right:2px;
    }
    .sim-recu-center { text-align:center; }
    .sim-recu-head {
      text-align:center;
      font-family:var(--mono);
      font-size:30px;
      font-weight:700;
      letter-spacing:.02em;
      margin-bottom:2px;
    }
    .sim-recu-sub {
      text-align:center;
      font-size:12px;
      margin-bottom:8px;
    }
    .sim-recu-sep {
      white-space:nowrap;
      overflow:hidden;
      color:#111;
      margin:6px 0;
      font-size:12px;
    }
    .sim-recu-meta div {
      display:flex;
      justify-content:space-between;
      gap:10px;
      margin:2px 0;
      font-size:12px;
    }
    .sim-recu-items {
      margin-top:4px;
      border-top:1px dashed #111;
      border-bottom:1px dashed #111;
      padding:6px 0;
    }
    .sim-recu-items-head {
      display:grid;
      grid-template-columns:48px minmax(0,1fr) 96px;
      gap:8px;
      align-items:end;
      margin-bottom:6px;
      font-weight:700;
      font-size:12px;
      text-transform:uppercase;
    }
    .sim-recu-item {
      display:grid;
      grid-template-columns:48px minmax(0,1fr) 96px;
      gap:8px;
      align-items:start;
      margin:4px 0;
      font-size:12px;
    }
    .sim-recu-item-qty { text-align:right; font-weight:600; }
    .sim-recu-item-name { font-weight:500; }
    .sim-recu-item-detail {
      font-size:11px;
      color:#2a2a2a;
      margin-top:1px;
      word-break:break-word;
    }
    .sim-recu-item-amount {
      text-align:right;
      font-weight:700;
      white-space:nowrap;
    }
    .sim-recu-total {
      margin-top:8px;
      font-size:12px;
    }
    .sim-recu-total div {
      display:flex;
      justify-content:space-between;
      gap:12px;
      margin:2px 0;
    }
    .sim-recu-total strong { font-size:14px; }
    .sim-recu-foot {
      margin-top:10px;
      text-align:center;
      font-size:11px;
    }
    .sim-recu-barcode {
      height:54px;
      margin:8px 10px 4px;
      background:
        repeating-linear-gradient(
          90deg,
          #111 0px, #111 2px,
          #fff 2px, #fff 4px,
          #111 4px, #111 5px,
          #fff 5px, #fff 8px
        );
      border:1px solid #111;
    }
    .sim-recu-small {
      text-align:center;
      font-size:11px;
      margin-top:3px;
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
  <a class="sim-topbar-link" href="<?= $baseUrl ?>/gerant" target="_blank">Ouvrir le gérant</a>
</div>

<!-- BODY -->
<div class="sim-body">

  <!-- NAV -->
  <nav class="sim-nav">
    <div class="sim-nav-title">Actions</div>
    <button class="sim-nav-btn active" data-panel="cce">Carte CCE</button>
    <button class="sim-nav-btn" data-panel="pompes">Pompes et Bornes</button>
    <button class="sim-nav-btn" data-panel="recus">Reçu</button>
    <button class="sim-nav-btn" data-panel="popups">Catalogue Pop-ups</button>
  </nav>

  <!-- MAIN -->
  <div class="sim-main">

    <!-- ══════ CARTE CCE ══════ -->
    <div id="panel-cce" class="sim-panel active">
      <div class="sim-section">
        <div class="sim-section-title">Carte Crédit Énergie</div>
        <div class="sim-section-desc">
          Quand un employé clique sur "Scanner CCE" sur la caisse, la liste des cartes s'affiche ici.
          Sélectionnez une carte pour l'envoyer à la caisse.
        </div>

        <div id="cce-waiting" class="sim-waiting">
          <span class="sim-waiting-dot"></span>
          <span>La caisse attend le scan d'une carte CCE. Sélectionnez une carte ci-dessous.</span>
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> Cartes CCE disponibles</div>
          <div id="cce-grid" class="sim-cce-grid"></div>
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
          1. Sélectionnez une pompe disponible.
          2. Choisissez la quantité puis démarrez.
          3. Terminez la livraison quand le client a fini.
          L'employé pourra ensuite encaisser sur la caisse.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> État des pompes</div>
          <div id="pompes-grid" class="sim-pompes-grid"></div>
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--orange"></span> Parcours client</div>

          <div class="sim-steps" id="pompe-steps">
            <span class="sim-step current" id="step-select">1. Sélectionner</span>
            <span class="sim-step" id="step-start">2. Démarrer</span>
            <span class="sim-step" id="step-end">3. Terminer</span>
          </div>

          <div class="sim-start-layout">
            <div class="sim-start-controls">
              <!-- Étape 1: Sélection -->
              <div id="pompe-step-select">
                <div style="color:var(--text-dim);font-size:12px;margin-bottom:8px;">
                  Cliquez sur une pompe disponible (statut : active) ci-dessus.
                </div>
                <div class="sim-row">
                  <div class="sim-field">
                    <label>Pompe sélectionnée</label>
                    <select id="pompe-select" disabled><option value="">Aucune</option></select>
                  </div>
                </div>
              </div>

              <!-- Étape 2: Configuration + Démarrer -->
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
                      <input type="range" id="pompe-qty" min="5" max="60" value="25" oninput="document.getElementById('pompe-qty-val').textContent=this.value+' L'; Sim.renderSimulationScreen();">
                    </div>
                    <span class="sim-range-val" id="pompe-qty-val">25 L</span>
                  </div>
                </div>
                <div id="pompe-elec-opts" style="display:none;">
                  <div class="sim-row">
                    <div class="sim-field">
                      <label>Temps de charge (minutes)</label>
                      <input type="range" id="borne-minutes" min="5" max="120" value="30" oninput="Sim.updateBornePreview()">
                    </div>
                    <span class="sim-range-val" id="borne-minutes-val">30 min (~11.0 kWh)</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-dim);margin-top:4px;">
                    Estimation calculée selon la puissance du chargeur sélectionné.
                  </div>
                </div>
                <div id="pompe-auto-pay-opts" style="display:none;">
                  <div class="sim-row">
                    <div class="sim-field sim-field--full">
                      <label>Méthode de paiement automatique</label>
                      <div id="pompe-payment-buttons" class="sim-fuel-list"></div>
                      <div id="pompe-payment-cce-select-wrap" class="sim-field" style="display:none;margin-top:8px;">
                        <label>Carte CCE utilisée</label>
                        <select id="pompe-payment-cce-select" onchange="Sim.selectAutoPaymentCce(this.value)"></select>
                      </div>
                      <div id="pompe-payment-cce-info" class="sim-fuel-empty" style="margin-top:6px;"></div>
                    </div>
                  </div>
                </div>
                <div id="pompe-recu-opts">
                  <div class="sim-row">
                    <div class="sim-field sim-field--full">
                      <label>Reçu</label>
                      <div id="pompe-recu-buttons" class="sim-fuel-list"></div>
                      <div id="pompe-recu-info" class="sim-fuel-empty" style="margin-top:6px;"></div>
                    </div>
                  </div>
                </div>

                <button class="sim-btn sim-btn--green" id="btn-demarrer" onclick="Sim.demarrerLivraison()">Démarrer la livraison</button>
                <div id="pompe-start-reason" class="sim-start-reason"></div>
              </div>

              <!-- Étape 3: Terminer -->
              <div id="pompe-step-end" style="display:none;">
                <div id="pompe-recap" style="font-size:12px;margin-bottom:12px;color:var(--text-mid);"></div>
                <button class="sim-btn sim-btn--orange" id="btn-terminer" onclick="Sim.terminerLivraison()">Terminer la livraison</button>
              </div>

              <!-- Done -->
              <div id="pompe-step-done" style="display:none;">
                <div style="padding:12px;border-radius:8px;background:var(--green-dim);color:var(--green);font-size:12px;font-weight:500;margin-bottom:12px;">
                  Livraison terminée. L'employé peut maintenant encaisser sur la caisse.
                </div>
                <button class="sim-btn sim-btn--primary" onclick="Sim.resetPompe()">Nouvelle opération</button>
              </div>
            </div>

            <aside class="sim-runtime-screen" id="pompe-runtime-screen">
              <div class="sim-runtime-title">Écran de distribution</div>
              <div class="sim-runtime-grid">
                <div class="sim-runtime-row"><span class="sim-runtime-label">Point de distribution</span><span class="sim-runtime-value" id="runtime-point">—</span></div>
                <div class="sim-runtime-row"><span class="sim-runtime-label">Type carburant / énergie</span><span class="sim-runtime-value" id="runtime-type">—</span></div>
                <div class="sim-runtime-row"><span class="sim-runtime-label" id="runtime-tarif-label">Prix au litre actuel</span><span class="sim-runtime-value" id="runtime-tarif">—</span></div>
                <div class="sim-runtime-row"><span class="sim-runtime-label" id="runtime-wanted-label">Quantité souhaitée</span><span class="sim-runtime-value" id="runtime-wanted">—</span></div>
                <div class="sim-runtime-row"><span class="sim-runtime-label" id="runtime-done-label">Quantité délivrée</span><span class="sim-runtime-value" id="runtime-done">—</span></div>
                <div class="sim-runtime-row"><span class="sim-runtime-label">Total estimé (souhaité)</span><span class="sim-runtime-value" id="runtime-total-est">—</span></div>
                <div class="sim-runtime-row"><span class="sim-runtime-label">Total à payer (délivré)</span><span class="sim-runtime-value" id="runtime-total-due">—</span></div>
              </div>
              <div class="sim-runtime-payment" id="runtime-payment-box">
                <div class="sim-runtime-payment-title">Automate 24 — Paiement</div>
                <div class="sim-runtime-payment-instr" id="runtime-payment-instr">Insérez ou présentez la carte puis suivez les instructions de l’automate.</div>
                <div class="sim-runtime-row"><span class="sim-runtime-label">Mode de paiement</span><span class="sim-runtime-value" id="runtime-payment-mode">—</span></div>
                <div class="sim-runtime-row"><span class="sim-runtime-label">Informations paiement</span><span class="sim-runtime-value" id="runtime-payment-info">—</span></div>
              </div>
            </aside>
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

    <!-- ══════ REÇUS ══════ -->
    <div id="panel-recus" class="sim-panel">
      <div class="sim-section">
        <div class="sim-section-title">Reçus</div>
        <div class="sim-section-desc">
          Sélectionnez un reçu pour afficher un ticket de caisse simulé.
          Les reçus affichés ci-dessous proviennent de la base de données.
        </div>

        <div class="sim-card">
          <div class="sim-card-title"><span class="dot dot--green"></span> Historique des reçus</div>
          <div id="recus-wrap" class="sim-receipts-wrap"></div>
          <div id="recus-log" class="sim-log"></div>
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
  var selectedAutoPaymentMethod = 'cb';
  var selectedReceiptMode = 'sans';
  var selectedCceCard = null;
  var currentStep = 'select';
  var cces = [];
  var recus = [];
  var waitingForScan = false;
  var pompesSse = null;
  var pompesSseRetryTimer = null;
  var startRequestRunning = false;
  var endRequestRunning = false;
  var BORNE_PUISSANCE_KW = { rapide: 22, lente: 7.4 };
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
        { id: 'gerant-horaires-copy', label: 'Appliquer aux jours', kind: 'simple', opts: { title: 'Appliquer pareil pour les jours suivants ?', html: 'Choix des jours à appliquer.' } },
        { id: 'gerant-incident-cancel', label: 'Incident annulé', kind: 'simple', opts: { icon: 'info', title: 'Opération Annulée', text: 'Aucune fiche incident créée.' } },
        { id: 'gerant-incident-ok', label: 'Incident créé', kind: 'simple', opts: { icon: 'success', title: 'Fiche incident #INC-2026-001 a été créée', text: 'L’incident a bien été enregistré.' } },
        { id: 'gerant-incident-ko', label: 'Incident erreur', kind: 'simple', opts: { icon: 'error', title: 'Création impossible', text: 'Erreur pendant la création de la fiche incident.' } },
        { id: 'gerant-cce-bonus-delete', label: 'Supprimer tranche bonus CCE', kind: 'confirm', opts: { title: 'Supprimer la tranche bonus ?', text: 'Cette tranche bonus sera supprimée définitivement.' } },
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

    if (ev.data && ev.data.type === 'sim-recu-created') {
      var receiptIdsRaw = Array.isArray(ev.data.recu_ids) ? ev.data.recu_ids : [];
      var receiptIds = receiptIdsRaw
        .map(function(id) { return Number(id || 0); })
        .filter(function(id) { return id > 0; });
      if (receiptIds.length > 0) {
        refreshRecus();
        showRecuById(receiptIds[0], true).catch(function(error) {
          log('recus-log', 'err', 'Impossible d’afficher le reçu simulé : ' + (error && error.message ? error.message : 'Erreur inconnue'));
        });
      }
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
        if (btn.dataset.panel === 'recus') refreshRecus();
      });
    });
  }

  // ══════════════════════════════════════════════════════
  //  CARTE CCE
  // ══════════════════════════════════════════════════════
  function refreshCCE() {
    return api('GET', '/json/cce').then(function(data) {
      cces = data;
      if (selectedCceCard && Number(selectedCceCard.id_carte_CE || 0) > 0) {
        var refreshed = cces.find(function(x) {
          return Number(x.id_carte_CE) === Number(selectedCceCard.id_carte_CE);
        });
        if (refreshed) {
          selectedCceCard = Object.assign({}, selectedCceCard, refreshed);
        }
      }
      renderCCE();
      renderAutoPaymentButtons();
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
      selectedCceCard = carte || null;
      log('cce-log', 'ok', 'Carte #' + id + ' sélectionnée -- ' + esc(carte.prenom) + ' ' + esc(carte.nom) + ' -- Solde : ' + Number(carte.solde_client).toFixed(2) + ' EUR');
      renderAutoPaymentButtons();
      if (waitingForScan) {
        sendCCESelection(carte);
        log('cce-log', 'ok', 'Carte #' + id + ' envoyée à la caisse.');
      }
    }).catch(function(e) {
      log('cce-log', 'err', 'Échec lecture carte #' + id + ' : ' + e.message);
    });
  }

  // ══════════════════════════════════════════════════════
  //  REÇUS
  // ══════════════════════════════════════════════════════
  function formatMoney(v) {
    return Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' EUR';
  }

  function formatDateTime(raw) {
    if (!raw) return '—';
    var text = String(raw).trim();
    var d = new Date(text.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d.toLocaleString('fr-FR');
    return text;
  }

  function refreshRecus() {
    return api('GET', '/json/bdd/recu').then(function(data) {
      recus = Array.isArray(data && data.rows) ? data.rows : [];
      renderRecus();
      log('recus-log', 'ok', recus.length + ' reçu(x) chargé(s).');
    }).catch(function(e) {
      recus = [];
      renderRecus();
      log('recus-log', 'err', 'Erreur chargement reçus : ' + e.message);
    });
  }

  function renderRecus() {
    var wrap = document.getElementById('recus-wrap');
    if (!wrap) return;

    if (!recus.length) {
      wrap.innerHTML = '<div class="sim-receipts-empty">Aucun reçu enregistré.</div>';
      return;
    }

    wrap.innerHTML = '<table class="sim-receipts-table">'
      + '<thead><tr>'
      + '<th style="width:90px">Reçu</th>'
      + '<th style="width:110px">Transaction</th>'
      + '<th>Horodatage</th>'
      + '<th style="width:120px">N° carte</th>'
      + '<th style="width:90px"></th>'
      + '</tr></thead>'
      + '<tbody>'
      + recus.map(function(r) {
          var idRecu = Number(r.id_recu || 0);
          var idTx = Number(r.id_transaction || 0);
          var numCarte = Number(r.num_carte || 0);
          return '<tr onclick="Sim.showRecu(' + idRecu + ')">'
            + '<td>#' + idRecu + '</td>'
            + '<td>#' + idTx + '</td>'
            + '<td>' + esc(formatDateTime(r.horodatage)) + '</td>'
            + '<td>' + (numCarte > 0 ? ('**** ' + String(numCarte).slice(-4)) : '—') + '</td>'
            + '<td><button type="button" class="sim-recu-btn">Voir</button></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table>';
  }

  function normalizeRecuDetails(data, recuFallback) {
    var lines = Array.isArray(data && data.lines) ? data.lines : [];
    var normalizedLines = lines.map(function(line) {
      return {
        label: String(line.label || ''),
        detail: String(line.detail || ''),
        total: Number(line.montant || line.total || 0),
        qty: Number(line.quantite || line.qty || 1),
        vatRate: Number(line.vat_rate || line.vatRate || 0),
      };
    });

    var vatByRateRaw = (data && data.vatByRate && typeof data.vatByRate === 'object') ? data.vatByRate : {};
    var vatByRate = {};
    Object.keys(vatByRateRaw).forEach(function(rateKey) {
      vatByRate[Number(rateKey)] = Number(vatByRateRaw[rateKey] || 0);
    });

    return {
      recu: data && data.recu ? data.recu : (recuFallback || null),
      transaction: data && data.transaction ? data.transaction : null,
      lines: normalizedLines,
      total: Number(data && data.total || 0),
      paymentLabel: String(data && data.paymentLabel || 'Espèces'),
      totalArticles: Number(data && data.totalArticles || 0),
      vatByRate: vatByRate,
    };
  }

  function loadRecuDetails(recu) {
    var idTx = Number(recu && recu.id_transaction || 0);
    if (idTx <= 0) return Promise.reject(new Error('Reçu sans transaction associée.'));
    return api('GET', '/json/bdd/recu/' + Number(recu.id_recu || 0) + '/detail')
      .then(function(data) { return normalizeRecuDetails(data, recu); });
  }

  function loadRecuDetailsById(idRecu) {
    var rid = Number(idRecu || 0);
    if (rid <= 0) return Promise.reject(new Error('Identifiant reçu invalide.'));
    return api('GET', '/json/bdd/recu/' + rid + '/detail')
      .then(function(data) { return normalizeRecuDetails(data, null); });
  }

  function buildRecuHtml(details) {
    var recu = details && details.recu ? details.recu : {};
    var itemsHtml = details.lines.length
      ? details.lines.map(function(line) {
          return '<div class="sim-recu-item">'
            + '<div class="sim-recu-item-qty">x' + Number(line.qty || 1) + '</div>'
            + '<div>'
            + '<div class="sim-recu-item-name">' + esc(line.label) + '</div>'
            + '<div class="sim-recu-item-detail">' + esc(line.detail) + '</div>'
            + '</div>'
            + '<div class="sim-recu-item-amount">' + esc(formatMoney(line.total)) + '</div>'
            + '</div>';
        }).join('')
      : '<div class="sim-recu-item-detail">Aucun détail de ligne disponible pour ce reçu.</div>';

    var recuId = Number(recu.id_recu || 0);
    var txId = Number(recu.id_transaction || 0);
    var cardText = Number(recu.num_carte || 0) > 0 ? ('**** ' + String(recu.num_carte).slice(-4)) : '—';
    var txDateRaw = (details.transaction && details.transaction.date_heure) ? details.transaction.date_heure : recu.horodatage;
    var txDate = formatDateTime(txDateRaw);
    var barcodeValue = String(txId).padStart(12, '0');
    var vatRows = Object.keys(details.vatByRate || {})
      .map(function(rate) { return Number(rate); })
      .sort(function(a, b) { return a - b; })
      .map(function(rate) {
        var amount = Number(details.vatByRate[rate] || 0);
        return '<div><span>TVA ' + rate.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '% :</span><span>' + esc(formatMoney(amount)) + '</span></div>';
      }).join('');
    var totalVat = Object.keys(details.vatByRate || {}).reduce(function(sum, rate) {
      return sum + Number(details.vatByRate[rate] || 0);
    }, 0);
    var subtotalHt = Number(details.total || 0) - totalVat;
    if (subtotalHt < 0) subtotalHt = 0;

    return '<div class="sim-recu-ticket">'
      + '<div class="sim-recu-scroll">'
      + '<div class="sim-recu-head">UNICA</div>'
      + '<div class="sim-recu-sub">UNICA Station</div>'
      + '<div class="sim-recu-center">Adresse : 41 boulevard Napoléon III</div>'
      + '<div class="sim-recu-center">06206 Nice cedex 3</div>'
      + '<div class="sim-recu-center">Téléphone : 04 89 15 30 30</div>'
      + '<div class="sim-recu-center">Mail : iut.scolarite@univ-cotedazur.fr</div>'
      + '<div class="sim-recu-sep">----------------------------------------------</div>'
      + '<div class="sim-recu-meta">'
      + '<div><span>Reçu</span><span>#' + recuId + '</span></div>'
      + '<div><span>Transaction</span><span>#' + txId + '</span></div>'
      + '<div><span>Date</span><span>' + esc(txDate) + '</span></div>'
      + '<div><span>Qt articles</span><span>' + Number(details.totalArticles || 0) + '</span></div>'
      + '<div><span>Paiement</span><span>' + esc(details.paymentLabel) + '</span></div>'
      + '<div><span>Carte</span><span>' + esc(cardText) + '</span></div>'
      + '</div>'
      + '<div class="sim-recu-sep">----------------------------------------------</div>'
      + '<div class="sim-recu-items">'
      + '<div class="sim-recu-items-head"><span>Qté</span><span>Articles</span><span style="text-align:right">Montant</span></div>'
      + itemsHtml
      + '</div>'
      + '<div class="sim-recu-total">'
      + '<div><span>Sous-total (HT)</span><span>' + esc(formatMoney(subtotalHt)) + '</span></div>'
      + vatRows
      + '<div><strong>Total TTC</strong><strong>' + esc(formatMoney(details.total)) + '</strong></div>'
      + '</div>'
      + '<div class="sim-recu-sep">==============================================</div>'
      + '<div class="sim-recu-foot">Merci de votre visite.</div>'
      + '<div class="sim-recu-small">À bientôt chez UNICA Station</div>'
      + '<div class="sim-recu-barcode"></div>'
      + '<div class="sim-recu-small">' + esc(barcodeValue) + '</div>'
      + '<div class="sim-recu-small">' + esc(txDate) + '</div>'
      + '</div>'
      + '</div>';
  }

  function showRecuPopupFromDetails(details, withConfirmButton) {
    var recuId = Number(details && details.recu && details.recu.id_recu || 0);
    Swal.fire({
      width: 560,
      showConfirmButton: !!withConfirmButton,
      confirmButtonText: 'OK',
      showCloseButton: !withConfirmButton,
      allowOutsideClick: true,
      customClass: { popup: 'sim-recu-popup' },
      html: buildRecuHtml(details)
    });
    log('recus-log', 'info', 'Affichage du reçu #' + recuId + '.');
  }

  function showRecu(idRecu) {
    var recu = recus.find(function(r) {
      return Number(r.id_recu || 0) === Number(idRecu || 0);
    });
    if (!recu) {
      Swal.fire({ icon: 'error', title: 'Reçu introuvable', text: 'Le reçu demandé est introuvable dans la liste actuelle.' });
      return;
    }

    loadRecuDetails(recu).then(function(details) {
      showRecuPopupFromDetails(details, false);
    }).catch(function(e) {
      log('recus-log', 'err', 'Erreur ouverture reçu #' + Number(idRecu || 0) + ' : ' + e.message);
      Swal.fire({ icon: 'error', title: 'Impossible d’ouvrir le reçu', text: e.message });
    });
  }

  function showRecuById(idRecu, withConfirmButton) {
    return loadRecuDetailsById(idRecu).then(function(details) {
      showRecuPopupFromDetails(details, !!withConfirmButton);
      return details;
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
      refreshStartButtonState();
      renderSimulationScreen();
      // Garde les soldes CCE frais même si le message BroadcastChannel
      // n'est pas reçu (fallback robuste inter-onglets).
      refreshCCE();
    }).catch(function(e) {
      log('pompe-log','err','Erreur chargement pompes : ' + e.message);
      refreshStartButtonState();
      renderSimulationScreen();
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
      document.getElementById('pompe-auto-pay-opts').style.display = requiresAutoPaymentChoice(p) ? '' : 'none';
      document.getElementById('pompe-recu-opts').style.display = requiresAutoPaymentChoice(p) ? '' : 'none';
      if (p.type_pompe === 'carburant') {
        if (!carburants.length) refreshCarburants();
        else renderCarburantsButtons();
      }
      renderAutoPaymentButtons();
      renderReceiptChoiceButtons();
      setStep('start');
      renderSimulationScreen();
      log('pompe-log', 'info', 'Pompe réactivée : vous pouvez démarrer une nouvelle livraison.');
    }
  }

  function getSelectedPompe() {
    if (!selectedPompeId) return null;
    return pompes.find(function(x) { return Number(x.id_pompe) === Number(selectedPompeId); }) || null;
  }

  function getStartBlockReason(p) {
    if (!p) return 'Pompe introuvable.';
    if (p.statut === 'active') return '';
    if (p.statut === 'en_cours') {
      return 'Une livraison est déjà en cours sur cette pompe.';
    }
    if (p.statut === 'desactivee' && p.transaction && p.transaction.statut !== 'payee') {
      return 'La pompe est en attente de la livraison précédente.';
    }
    return 'La pompe est désactivée.';
  }

  function setStartReason(message, level) {
    var node = document.getElementById('pompe-start-reason');
    if (!node) return;
    if (!message) {
      node.style.display = 'none';
      node.textContent = '';
      node.className = 'sim-start-reason';
      return;
    }
    node.style.display = 'block';
    node.textContent = message;
    node.className = 'sim-start-reason';
    if (level) node.classList.add('sim-start-reason--' + level);
  }

  function refreshStartButtonState() {
    var btnStart = document.getElementById('btn-demarrer');
    var btnEnd = document.getElementById('btn-terminer');
    if (btnStart) {
      var canStart = currentStep === 'start' && !startRequestRunning && !!selectedPompeId;
      var selectedPompe = getSelectedPompe();
      btnStart.disabled = !canStart;
      if (canStart && selectedPompe && selectedPompe.statut !== 'active') {
        btnStart.disabled = false;
      }
    }
    if (btnEnd) {
      btnEnd.disabled = currentStep !== 'end' || endRequestRunning;
    }
  }

  function tryAutoReactivatePompe(idPompe) {
    return api('POST', '/json/pompes/' + idPompe + '/activer')
      .then(function() {
        return refreshPompes().then(function() {
          var refreshed = pompes.find(function(x) { return Number(x.id_pompe) === Number(idPompe); });
          return refreshed || null;
        });
      });
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

  function getBornePowerKw(pompe) {
    if (!pompe) return BORNE_PUISSANCE_KW.lente;
    var key = String(pompe.sous_type || '').toLowerCase();
    if (BORNE_PUISSANCE_KW[key]) return BORNE_PUISSANCE_KW[key];
    return BORNE_PUISSANCE_KW.lente;
  }

  function minutesToKwh(minutes, pompe) {
    var safeMinutes = Math.max(0, Number(minutes || 0));
    var power = getBornePowerKw(pompe);
    return Math.round((safeMinutes / 60) * power * 1000) / 1000;
  }

  function formatMinutesToTime(minutes) {
    var total = Math.max(0, Math.round(Number(minutes || 0) * 60));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    var hh = String(h).padStart(2, '0');
    var mm = String(m).padStart(2, '0');
    var ss = String(s).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
  }

  function formatTimeToMinutesLabel(raw) {
    if (!raw) return '—';
    var parts = String(raw).split(':');
    if (parts.length < 2) return String(raw);
    var h = Number(parts[0] || 0);
    var m = Number(parts[1] || 0);
    var totalMinutes = (h * 60) + m;
    if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return String(raw);
    return totalMinutes + ' min';
  }

  function setRuntimeField(id, value) {
    var node = document.getElementById(id);
    if (!node) return;
    node.textContent = value;
  }

  function findCarburantByLibelle(libelle) {
    var sought = String(libelle || '').trim().toLowerCase();
    if (!sought) return null;
    return carburants.find(function(c) {
      return String(c && c.libelle || '').trim().toLowerCase() === sought;
    }) || null;
  }

  function renderSimulationScreen() {
    var selectedPompe = getSelectedPompe();
    var paymentBox = document.getElementById('runtime-payment-box');

    if (!selectedPompe) {
      setRuntimeField('runtime-point', 'Aucune sélection');
      setRuntimeField('runtime-type', '—');
      setRuntimeField('runtime-tarif-label', 'Prix au litre actuel');
      setRuntimeField('runtime-tarif', '—');
      setRuntimeField('runtime-wanted-label', 'Quantité souhaitée');
      setRuntimeField('runtime-wanted', '—');
      setRuntimeField('runtime-done-label', 'Quantité délivrée');
      setRuntimeField('runtime-done', '—');
      setRuntimeField('runtime-total-est', '—');
      setRuntimeField('runtime-total-due', '—');
      setRuntimeField('runtime-payment-mode', '—');
      setRuntimeField('runtime-payment-info', '—');
      setRuntimeField('runtime-payment-instr', 'Insérez ou présentez la carte puis suivez les instructions de l’automate.');
      if (paymentBox) paymentBox.style.display = 'none';
      return;
    }

    var isCarburant = String(selectedPompe.type_pompe || '') === 'carburant';
    var isAuto24 = String(selectedPompe.mode || '').toLowerCase() === 'auto';
    var tx = selectedPompe.transaction || null;

    var pointType = isCarburant ? 'Pompe' : 'Borne';
    setRuntimeField('runtime-point', pointType + ' n' + selectedPompe.numero);

    if (isCarburant) {
      var currentCarburant = tx && tx.libelle
        ? findCarburantByLibelle(tx.libelle) || { libelle: tx.libelle, prix_litre: tx.prix_litre }
        : getSelectedCarburant();

      var fuelLabel = currentCarburant && currentCarburant.libelle
        ? String(currentCarburant.libelle)
        : 'Non défini';
      var prixLitre = Number(
        (tx && tx.prix_litre !== null && tx.prix_litre !== undefined) ? tx.prix_litre
          : (currentCarburant && currentCarburant.prix_litre !== null && currentCarburant.prix_litre !== undefined) ? currentCarburant.prix_litre
          : NaN
      );

      var wantedLitres = Number((document.getElementById('pompe-qty') || {}).value || 0);
      var deliveredLitres = tx ? Number(tx.quantite_delivree || 0) : null;

      var totalEstime = Number.isFinite(prixLitre) ? (wantedLitres * prixLitre) : NaN;
      var totalDue = tx
        ? Number(tx.prix_total || 0)
        : totalEstime;

      setRuntimeField('runtime-type', fuelLabel);
      setRuntimeField('runtime-tarif-label', 'Prix au litre actuel');
      setRuntimeField('runtime-tarif', Number.isFinite(prixLitre) ? (prixLitre.toFixed(3) + ' EUR/L') : '—');
      setRuntimeField('runtime-wanted-label', 'Quantité souhaitée');
      setRuntimeField('runtime-wanted', wantedLitres.toFixed(2) + ' L');
      setRuntimeField('runtime-done-label', 'Quantité délivrée');
      setRuntimeField('runtime-done', deliveredLitres !== null ? (deliveredLitres.toFixed(2) + ' L') : '—');
      setRuntimeField('runtime-total-est', Number.isFinite(totalEstime) ? formatMoney(totalEstime) : '—');
      setRuntimeField('runtime-total-due', Number.isFinite(totalDue) ? formatMoney(totalDue) : '—');
    } else {
      var minutesInput = document.getElementById('borne-minutes');
      var minutes = Number(minutesInput ? minutesInput.value : 0);
      var puissanceKw = getBornePowerKw(selectedPompe);
      var wantedKwh = minutesToKwh(minutes, selectedPompe);
      var doneKwh = tx ? Number(tx.quantite_delivree || 0) : null;
      var prixKwh = Number(
        (tx && tx.prix_kwh !== null && tx.prix_kwh !== undefined) ? tx.prix_kwh
          : (selectedPompe.derniere_transaction && selectedPompe.derniere_transaction.prix_kwh !== null && selectedPompe.derniere_transaction.prix_kwh !== undefined) ? selectedPompe.derniere_transaction.prix_kwh
          : NaN
      );
      var totalEstimeElec = Number.isFinite(prixKwh) ? (wantedKwh * prixKwh) : NaN;
      var totalDueElec = tx ? Number(tx.prix_total || 0) : totalEstimeElec;

      var chargeType = String((tx && tx.type_charge) || selectedPompe.sous_type || '').toLowerCase();
      var chargeLabel = chargeType ? ('Chargeur ' + chargeType) : 'Chargeur';

      setRuntimeField('runtime-type', chargeLabel);
      setRuntimeField('runtime-tarif-label', 'Modalité / type de charge');
      setRuntimeField('runtime-tarif', chargeType ? (chargeType + ' (' + puissanceKw + ' kW)') : (puissanceKw + ' kW'));
      setRuntimeField('runtime-wanted-label', 'Temps de charge souhaité');
      setRuntimeField('runtime-wanted', minutes + ' min (~' + wantedKwh.toFixed(1) + ' kWh)');
      setRuntimeField('runtime-done-label', 'Temps de charge réalisé');
      setRuntimeField(
        'runtime-done',
        tx
          ? (formatTimeToMinutesLabel(tx.temps_charge) + ' (~' + Number(doneKwh || 0).toFixed(2) + ' kWh)')
          : '—'
      );
      setRuntimeField('runtime-total-est', Number.isFinite(totalEstimeElec) ? formatMoney(totalEstimeElec) : '—');
      setRuntimeField('runtime-total-due', Number.isFinite(totalDueElec) ? formatMoney(totalDueElec) : '—');
    }

    if (paymentBox) {
      paymentBox.style.display = isAuto24 ? '' : 'none';
    }

    if (isAuto24) {
      var modeLabel = selectedAutoPaymentMethod === 'cce' ? 'Carte CCE' : 'Carte bancaire';
      var infoPaiement = selectedAutoPaymentMethod === 'cce'
        ? (
          selectedCceCard && Number(selectedCceCard.id_carte_CE || 0) > 0
            ? ('Carte #' + selectedCceCard.id_carte_CE + ' — Solde ' + Number(selectedCceCard.solde_client || 0).toFixed(2) + ' EUR')
            : 'Aucune carte CCE sélectionnée'
        )
        : 'Paiement carte bancaire automatique';
      setRuntimeField('runtime-payment-instr', 'Paiement sur automate 24 : suivez les instructions affichées sur la borne.');
      setRuntimeField('runtime-payment-mode', modeLabel);
      setRuntimeField('runtime-payment-info', infoPaiement);
    } else {
      setRuntimeField('runtime-payment-mode', 'Encaissement en caisse');
      setRuntimeField('runtime-payment-info', 'Le paiement sera réalisé à la caisse employé.');
      setRuntimeField('runtime-payment-instr', 'Pas de paiement automate pour cette pompe manuelle.');
    }
  }

  function updateBornePreview() {
    var valueNode = document.getElementById('borne-minutes-val');
    var input = document.getElementById('borne-minutes');
    if (!valueNode || !input) return;
    var minutes = Number(input.value || 0);
    var pompe = getSelectedPompe();
    var kwh = minutesToKwh(minutes, pompe);
    valueNode.textContent = minutes + ' min (~' + kwh.toFixed(1) + ' kWh)';
    renderSimulationScreen();
  }

  function requiresAutoPaymentChoice(pompe) {
    if (!pompe) return false;
    return String(pompe.mode || '').toLowerCase() === 'auto'
      || String(pompe.type_pompe || '').toLowerCase() === 'electricite';
  }

  function renderAutoPaymentButtons() {
    var wrap = document.getElementById('pompe-payment-buttons');
    var info = document.getElementById('pompe-payment-cce-info');
    var cceSelectWrap = document.getElementById('pompe-payment-cce-select-wrap');
    var cceSelect = document.getElementById('pompe-payment-cce-select');
    if (!wrap || !info || !cceSelectWrap || !cceSelect) return;

    var currentPompe = getSelectedPompe();
    if (!requiresAutoPaymentChoice(currentPompe)) {
      wrap.innerHTML = '';
      info.textContent = '';
      cceSelectWrap.style.display = 'none';
      cceSelect.innerHTML = '';
      renderSimulationScreen();
      return;
    }

    var methods = [
      { key: 'cb', label: 'Carte bancaire' },
      { key: 'cce', label: 'CCE' },
    ];

    wrap.innerHTML = methods.map(function(method) {
      var selectedClass = method.key === selectedAutoPaymentMethod ? ' selected' : '';
      return '<button type="button" class="sim-fuel-btn' + selectedClass + '"'
        + ' onclick="Sim.selectAutoPayment(\'' + method.key + '\')">'
        + esc(method.label)
        + '</button>';
    }).join('');

    if (selectedAutoPaymentMethod === 'cce') {
      cceSelectWrap.style.display = '';

      var cceList = cces.slice().sort(function(a, b) {
        return Number(a.id_carte_CE || 0) - Number(b.id_carte_CE || 0);
      });

      if ((!selectedCceCard || Number(selectedCceCard.id_carte_CE || 0) <= 0) && cceList.length > 0) {
        selectedCceCard = cceList[0];
      }

      if (cceList.length > 0) {
        cceSelect.innerHTML = cceList.map(function(c) {
          var id = Number(c.id_carte_CE || 0);
          var selected = selectedCceCard && Number(selectedCceCard.id_carte_CE || 0) === id ? ' selected' : '';
          var label = 'Carte #' + id + ' — ' + (c.prenom || '') + ' ' + (c.nom || '') + ' — ' + Number(c.solde_client || 0).toFixed(2) + ' EUR';
          return '<option value="' + id + '"' + selected + '>' + esc(label) + '</option>';
        }).join('');
      } else {
        cceSelect.innerHTML = '<option value="">Aucune carte disponible</option>';
      }

      if (selectedCceCard && Number(selectedCceCard.id_carte_CE || 0) > 0) {
        cceSelect.value = String(Number(selectedCceCard.id_carte_CE || 0));
        info.textContent = 'Carte CCE utilisée : #' + selectedCceCard.id_carte_CE
          + ' — ' + (selectedCceCard.prenom || '') + ' ' + (selectedCceCard.nom || '')
          + ' — Solde ' + Number(selectedCceCard.solde_client || 0).toFixed(2) + ' EUR';
      } else {
        info.textContent = 'Aucune carte CCE sélectionnée (choisissez-la dans l’onglet Carte CCE).';
      }
    } else {
      cceSelectWrap.style.display = 'none';
      info.textContent = 'Paiement automatique en carte bancaire.';
    }
    renderSimulationScreen();
  }

  function selectAutoPayment(method) {
    var normalized = String(method || '').toLowerCase();
    if (normalized !== 'cce') normalized = 'cb';
    selectedAutoPaymentMethod = normalized;
    renderAutoPaymentButtons();
    renderSimulationScreen();
  }

  function selectAutoPaymentCce(idCarte) {
    var id = Number(idCarte || 0);
    if (id <= 0) {
      selectedCceCard = null;
      renderAutoPaymentButtons();
      return;
    }
    var found = cces.find(function(c) { return Number(c.id_carte_CE || 0) === id; }) || null;
    if (found) {
      selectedCceCard = found;
    }
    renderAutoPaymentButtons();
    renderSimulationScreen();
  }

  function renderReceiptChoiceButtons() {
    var wrap = document.getElementById('pompe-recu-buttons');
    var info = document.getElementById('pompe-recu-info');
    if (!wrap || !info) return;

    var choices = [
      { key: 'sans', label: 'Sans reçu' },
      { key: 'avec', label: 'Avec reçu' },
    ];

    wrap.innerHTML = choices.map(function(choice) {
      var selectedClass = choice.key === selectedReceiptMode ? ' selected' : '';
      return '<button type="button" class="sim-fuel-btn' + selectedClass + '"'
        + ' onclick="Sim.selectReceiptMode(\'' + choice.key + '\')">'
        + esc(choice.label)
        + '</button>';
    }).join('');

    if (selectedReceiptMode === 'avec') {
      info.textContent = 'Un ticket sera affiché à la fin de la livraison quand la transaction sera disponible.';
    } else {
      info.textContent = 'Aucun ticket ne sera affiché.';
    }
    renderSimulationScreen();
  }

  function selectReceiptMode(mode) {
    selectedReceiptMode = (String(mode || '').toLowerCase() === 'avec') ? 'avec' : 'sans';
    renderReceiptChoiceButtons();
  }

  function renderCarburantsButtons() {
    var wrap = document.getElementById('pompe-fuel-buttons');
    if (!wrap) return;

    if (!carburants.length) {
      selectedCarburantId = null;
      wrap.innerHTML = '<span class="sim-fuel-empty">Aucun carburant disponible.</span>';
      renderSimulationScreen();
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
    renderSimulationScreen();
  }

  function selectCarburant(idEnergie) {
    selectedCarburantId = Number(idEnergie || 0);
    renderCarburantsButtons();
    renderSimulationScreen();
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
      : '<div class="sim-pompes-empty">Aucun élément dans cette catégorie.</div>';

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
      + renderPompeFamily('Électricité', countLabel(pompesElec.length, 'borne', 'bornes'), [
        renderPompeSubgroup('Super chargeurs', bornesRapides, countLabel(bornesRapides.length, 'rapide', 'rapides')),
        renderPompeSubgroup('Chargeurs', bornesLentes, countLabel(bornesLentes.length, 'lent', 'lents'))
      ])
      + '</div>';
  }

  function selectPompe(id) {
    var p = pompes.find(function(x) { return x.id_pompe == id; });
    if (!p) return;

    selectedPompeId = id;
    var typeLabel = p.type_pompe === 'carburant' ? 'Pompe' : 'Borne';
    var sel = document.getElementById('pompe-select');
    sel.innerHTML = '<option value="' + id + '">' + typeLabel + ' n' + p.numero + '</option>';

    document.getElementById('pompe-carburant-opts').style.display = p.type_pompe === 'carburant' ? '' : 'none';
    document.getElementById('pompe-elec-opts').style.display = p.type_pompe === 'electricite' ? '' : 'none';
    document.getElementById('pompe-auto-pay-opts').style.display = requiresAutoPaymentChoice(p) ? '' : 'none';
    document.getElementById('pompe-recu-opts').style.display = requiresAutoPaymentChoice(p) ? '' : 'none';
    if (p.type_pompe === 'carburant') {
      if (!carburants.length) {
        refreshCarburants();
      } else {
        renderCarburantsButtons();
      }
    } else {
      selectedCarburantId = null;
      updateBornePreview();
    }
    renderAutoPaymentButtons();
    renderReceiptChoiceButtons();
    renderSimulationScreen();

    setStep('start');
    renderPompes();
    var reason = getStartBlockReason(p);
    if (reason) {
      setStartReason(reason + ' Réactivation automatique au démarrage.', 'warn');
      log('pompe-log', 'info', typeLabel + ' n' + p.numero + ' sélectionnée. ' + reason);
    } else {
      setStartReason('');
      log('pompe-log', 'info', typeLabel + ' n' + p.numero + ' sélectionnée.');
    }
    refreshStartButtonState();
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
    if (step !== 'start') {
      setStartReason('');
    } else {
      var selectedPompe = getSelectedPompe();
      var reason = getStartBlockReason(selectedPompe);
      document.getElementById('pompe-auto-pay-opts').style.display = requiresAutoPaymentChoice(selectedPompe) ? '' : 'none';
      document.getElementById('pompe-recu-opts').style.display = requiresAutoPaymentChoice(selectedPompe) ? '' : 'none';
      renderAutoPaymentButtons();
      renderReceiptChoiceButtons();
      if (reason) {
        setStartReason(reason + ' Réactivation automatique au démarrage.', 'warn');
      }
    }
    renderSimulationScreen();
    refreshStartButtonState();
  }

  function demarrerLivraison() {
    if (startRequestRunning) return;
    if (!selectedPompeId) {
      setStartReason('Sélectionnez une pompe.', 'info');
      return;
    }
    var p = getSelectedPompe();
    if (!p) {
      setStartReason('Pompe introuvable.', 'err');
      return;
    }

    var body = {};
    var unit;
    var quantityLabel;
    if (p.type_pompe === 'carburant') {
      if (!selectedCarburantId) {
        var noFuelMessage = 'Veuillez choisir un type de carburant avant de démarrer.';
        setStartReason(noFuelMessage, 'warn');
        log('pompe-log', 'err', noFuelMessage);
        return;
      }
      body.id_energie = Number(selectedCarburantId);
      body.quantite_delivree = Number(document.getElementById('pompe-qty').value);
      unit = 'L';
      quantityLabel = body.quantite_delivree + ' ' + unit;
    } else {
      var minutes = Number(document.getElementById('borne-minutes').value || 0);
      body.quantite_delivree = minutesToKwh(minutes, p);
      body.temps_charge = formatMinutesToTime(minutes);
      unit = 'kWh';
      quantityLabel = minutes + ' min (~' + body.quantite_delivree.toFixed(1) + ' ' + unit + ')';
    }

    var btn = document.getElementById('btn-demarrer');
    if (!btn) return;
    startRequestRunning = true;
    refreshStartButtonState();

    var startPromise = Promise.resolve(p);
    if (p.statut !== 'active') {
      var reason = getStartBlockReason(p);
      var infoMessage = (reason || 'Pompe indisponible.') + ' Tentative de réactivation...';
      setStartReason(infoMessage, 'warn');
      log('pompe-log', 'info', infoMessage);
      startPromise = tryAutoReactivatePompe(selectedPompeId).then(function(refreshedPompe) {
        if (!refreshedPompe || refreshedPompe.statut !== 'active') {
          var hardReason = getStartBlockReason(refreshedPompe || p) || 'La pompe reste indisponible.';
          throw new Error(hardReason);
        }
        return refreshedPompe;
      });
    }

    startPromise
      .then(function(activePompe) {
        setStartReason('');
        return api('POST', '/json/pompes/' + selectedPompeId + '/demarrer', body).then(function() {
          var typeLabel = activePompe.type_pompe === 'carburant' ? 'pompe' : 'borne';
          var carburant = activePompe.type_pompe === 'carburant' ? getSelectedCarburant() : null;
          var carburantSuffix = carburant ? (' [' + carburant.libelle + ']') : '';
          log('pompe-log','ok','Livraison démarrée sur ' + typeLabel + ' n' + activePompe.numero + ' -- ' + quantityLabel);

          var recap = document.getElementById('pompe-recap');
          if (recap) {
            recap.innerHTML = 'En cours : <strong>' + (activePompe.type_pompe === 'carburant' ? 'Pompe' : 'Borne')
              + ' n' + activePompe.numero + '</strong>' + carburantSuffix + ' -- ' + quantityLabel;
          }

          return refreshPompes().then(function() {
            setStep('end');
          });
        });
      })
      .catch(function(e) {
        var reason = e && e.message ? e.message : 'Erreur inconnue';
        setStartReason('Impossible de démarrer : ' + reason, 'err');
        log('pompe-log','err','Échec démarrage : ' + reason);
      })
      .finally(function() {
        startRequestRunning = false;
        refreshStartButtonState();
      });
  }

  function terminerLivraison() {
    if (endRequestRunning) return;
    if (!selectedPompeId) return;
    var p = pompes.find(function(x) { return x.id_pompe == selectedPompeId; });
    if (!p) return;

    var payload = null;
    if (requiresAutoPaymentChoice(p)) {
      payload = {
        mode_paiement: selectedAutoPaymentMethod === 'cce' ? 'cce' : 'cb'
      };
      if (payload.mode_paiement === 'cce') {
        var cceId = Number(selectedCceCard && selectedCceCard.id_carte_CE ? selectedCceCard.id_carte_CE : 0);
        if (cceId <= 0) {
          var noCardMessage = 'Sélectionnez une carte CCE avant de terminer la livraison en mode CCE.';
          setStartReason(noCardMessage, 'warn');
          log('pompe-log', 'err', noCardMessage);
          return;
        }
        payload.id_carte_CE = cceId;
      }
    }

    var btn = document.getElementById('btn-terminer');
    if (!btn) return;
    endRequestRunning = true;
    btn.disabled = true;

    api('POST', '/json/pompes/' + selectedPompeId + '/terminer', payload).then(function(response) {
      var typeLabel = p.type_pompe === 'carburant' ? 'pompe' : 'borne';
      var modeLabel = payload && payload.mode_paiement === 'cce' ? 'CCE' : 'Carte bancaire';
      log('pompe-log','ok','Livraison terminée sur ' + typeLabel + ' n' + p.numero + ' -- paiement auto: ' + modeLabel + '.');
      return refreshPompes().then(function() {
        setStep('done');
        return response;
      });
    }).then(function(response) {
      if (selectedReceiptMode !== 'avec') return;

      var idTransaction = Number(response && response.id_transaction || 0);
      if (idTransaction <= 0) {
        log('pompe-log', 'info', 'Reçu non généré : transaction non finalisée (paiement en caisse requis).');
        return;
      }

      var modePaiement = payload && payload.mode_paiement === 'cce' ? 'cce' : 'cb';
      return api('POST', '/json/recus', {
        id_transactions: [idTransaction],
        mode_paiement: modePaiement
      }).then(function(created) {
        var list = Array.isArray(created && created.recus) ? created.recus : [];
        if (!list.length) {
          throw new Error('Création du reçu échouée.');
        }
        var recuId = Number(list[0].id_recu || 0);
        if (recuId <= 0) {
          throw new Error('Identifiant reçu invalide.');
        }
        refreshRecus();
        return showRecuById(recuId, true);
      }).catch(function(e) {
        log('pompe-log', 'err', 'Impossible d’afficher le reçu : ' + e.message);
      });
    }).catch(function(e) {
      log('pompe-log','err','Échec fin livraison : ' + e.message);
    }).finally(function() {
      endRequestRunning = false;
      refreshStartButtonState();
    });
  }

  function resetPompe() {
    selectedPompeId = null;
    selectedCarburantId = null;
    selectedReceiptMode = 'sans';
    startRequestRunning = false;
    endRequestRunning = false;
    document.getElementById('pompe-select').innerHTML = '<option value="">Aucune</option>';
    document.getElementById('pompe-carburant-opts').style.display = 'none';
    document.getElementById('pompe-elec-opts').style.display = 'none';
    document.getElementById('pompe-auto-pay-opts').style.display = 'none';
    document.getElementById('pompe-recu-opts').style.display = 'none';
    var borneInput = document.getElementById('borne-minutes');
    if (borneInput) borneInput.value = 30;
    updateBornePreview();
    document.getElementById('btn-demarrer').disabled = false;
    document.getElementById('btn-demarrer').textContent = 'Démarrer la livraison';
    document.getElementById('btn-terminer').disabled = false;
    document.getElementById('btn-terminer').textContent = 'Terminer la livraison';
    renderReceiptChoiceButtons();
    setStartReason('');
    setStep('select');
    renderSimulationScreen();
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
    updateBornePreview();
    renderAutoPaymentButtons();
    renderReceiptChoiceButtons();
    renderSimulationScreen();
    var recuOpts = document.getElementById('pompe-recu-opts');
    if (recuOpts) recuOpts.style.display = 'none';
    refreshCCE();
    refreshCarburants();
    refreshRecus();
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
    selectAutoPayment: selectAutoPayment,
    selectAutoPaymentCce: selectAutoPaymentCce,
    selectReceiptMode: selectReceiptMode,
    updateBornePreview: updateBornePreview,
    renderSimulationScreen: renderSimulationScreen,
    refreshCCE: refreshCCE,
    selectCCE: selectCCE,
    refreshRecus: refreshRecus,
    showRecu: showRecu,
    showRecuById: showRecuById
  };
})();
</script>

</body>
</html>
