<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Station — Gérant</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Familjen+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/interact.js/1.10.27/interact.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.6/Sortable.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
  <?php
  $baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
  if ($baseUrl === '/' || $baseUrl === '\\') {
    $baseUrl = '';
  }
  $assetsUrl = $baseUrl . '/assets';
  $asset = static function (string $path) use ($assetsUrl): string {
    $rel = ltrim($path, '/');
    $full = __DIR__ . '/../../public/assets/' . str_replace('/', DIRECTORY_SEPARATOR, $rel);
    $ver = is_file($full) ? (string) filemtime($full) : (string) time();
    return $assetsUrl . '/' . $rel . '?v=' . rawurlencode($ver);
  };
  ?>
  <link rel="icon" type="image/png" href="<?= $asset('img/logo_unica.png') ?>">
  <link rel="stylesheet" href="<?= $asset('css/caisse.css') ?>">
  <link rel="stylesheet" href="<?= $asset('css/panels/horaires.css') ?>">
  <link rel="stylesheet" href="<?= $asset('css/core/caisse_dialogs.css') ?>">

  <?php
  $role        = htmlspecialchars($employe['role']        ?? 'gerant',  ENT_QUOTES);
  $identifiant = htmlspecialchars($employe['identifiant'] ?? 'Gérant',  ENT_QUOTES);
  $id          = (int) ($employe['id_connexion']           ?? 0);
  ?>
  <script>
    const APP_BASE_URL = '<?= $baseUrl ?>';
    const SESSION = {
      id:          <?= $id ?>,
      identifiant: '<?= $identifiant ?>',
      role:        '<?= $role ?>',
    };
    const CAISSE_MODE = 'gerant';
  </script>
</head>
<body>

<!-- ═══════════════════════════════════════════════════
     TOPBAR — Caisse Gérant
════════════════════════════════════════════════════ -->
<header id="topbar">

  <div class="tb-brand">
    <img src="<?= $assetsUrl ?>/img/logo_unica.png" alt="UNICA" class="tb-logo-img">
    <span class="tb-name">UNICA Station</span>
  </div>

  <div class="tb-session tb-session--gerant">
    <span class="tb-badge-gerant">GÉRANT</span>
    <span><?= htmlspecialchars($_SESSION['employe']['identifiant'] ?? 'Gérant') ?></span>
  </div>

  <div class="tb-spacer"></div>

  <div id="clock" class="tb-clock">00:00:00</div>

  <div class="tb-spacer"></div>  

  <div class="tb-controls">
    <span class="tb-label">Layout :</span>

    <button class="hand-btn tb-icon-btn" data-hand="left"
            onclick="App.setHand('left')" title="Main gauche">
      <img src="<?= $assetsUrl ?>/img/left.png" alt="◄">
    </button>

    <button class="hand-btn tb-icon-btn" data-hand="right"
            onclick="App.setHand('right')" title="Main droite">
      <img src="<?= $assetsUrl ?>/img/right.png" alt="►">
    </button>

    <button class="tb-icon-btn" onclick="App.saveLayout()" title="Sauvegarder">
      <img src="<?= $assetsUrl ?>/img/save.png" alt="Sauvegarder">
    </button>

    <button class="tb-icon-btn" onclick="App.resetLayout()" title="Réinitialiser">
      <img src="<?= $assetsUrl ?>/img/reset.png" alt="Réinitialiser">
    </button>

    <button class="tb-layout-mode-btn layout-mode-btn" onclick="App.toggleLayoutMode()" title="Mode Sandbox (libre)">
      Sandbox
    </button>

    <!-- Bouton switch vers caisse employé -->
    <span class="tb-vsep"></span>
    <button class="tb-switch-btn" onclick="App.switchCaisse()" title="Basculer vers la caisse employé">
      <img src="<?= $assetsUrl ?>/img/setting.png" alt="Switch" class="tb-switch-icon">
      <span>Employé</span>
    </button>

    <span class="tb-vsep"></span>

    <button class="tb-icon-btn tb-icon-btn--danger"
            onclick="App.deconnexion()" title="Déconnexion">
      <img src="<?= $assetsUrl ?>/img/exit.png" alt="Déconnexion">
    </button>
  </div>

</header>

<!-- ═══════════════════════════════════════════════════
     CANVAS — la mosaïque de fenêtres gérant
════════════════════════════════════════════════════ -->
<main id="canvas"></main>

<!-- ═══════════════════════════════════════════════════
     TASKBAR
════════════════════════════════════════════════════ -->
<footer id="taskbar">
  <span class="taskbar-label">FENÊTRES</span>
  <div id="taskbar-chips"></div>
</footer>

<!-- DIALOG DÉCONNEXION -->
<div id="confirm-overlay" class="overlay" style="display:none">
  <div class="confirm-box">
    <div class="confirm-title">Déconnexion</div>
    <div class="confirm-msg">Voulez-vous vraiment vous déconnecter ?</div>
    <div class="confirm-actions">
      <button class="btn-secondary" onclick="App.closeConfirm()">Annuler</button>
      <button class="btn-danger"    onclick="App.doDeconnexion()">Déconnecter</button>
    </div>
  </div>
</div>

<!-- TOASTS -->
<div id="toast-area"></div>

<!-- ═══════════════════════════════════════════════════
     SCRIPTS — ordre strict
════════════════════════════════════════════════════ -->
<script src="<?= $assetsUrl ?>/js/core/state.js"></script>
<script src="<?= $assetsUrl ?>/js/core/requetes.js"></script>
<script src="<?= $assetsUrl ?>/js/core/toast.js"></script>
<script src="<?= $asset('js/core/windows.js') ?>"></script>
<script src="<?= $asset('js/core/sim_popup_bridge.js') ?>"></script>

<!-- Panels gérant — 12 fenêtres maquette -->
<script src="<?= $assetsUrl ?>/js/panels/gerant/reappro.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/reappro_defauts.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/reappro_manuel.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/incidents.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/prix.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/cce_params.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/validation.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/docs_gestion.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/directives.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/fermetures.js"></script>
<script src="<?= $asset('js/panels/gerant/horaires.js') ?>"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/shared.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/schemas/catalog.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/schemas/cce.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/schemas/transactions.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/schemas/reappro.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/schemas/operations.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/schemas.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/ui.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/dialogs.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd/panel.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/bdd.js"></script>

<script src="<?= $asset('js/app.js') ?>"></script>

</body>
</html>
