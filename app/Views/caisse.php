<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Station — Caisse</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Familjen+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/interact.js/1.10.27/interact.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
  <?php
  $baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
  if ($baseUrl === '/' || $baseUrl === '\\') {
    $baseUrl = '';
  }
  $assetsUrl = $baseUrl . '/assets';
  ?>
  <link rel="stylesheet" href="<?= $assetsUrl ?>/css/caisse.css">
  <link rel="stylesheet" href="<?= $assetsUrl ?>/css/panels/pompes.css">
  <link rel="stylesheet" href="<?= $assetsUrl ?>/css/panels/ticket.css">
  <link rel="stylesheet" href="<?= $assetsUrl ?>/css/panels/ticket_barcode.css">
  <link rel="stylesheet" href="<?= $assetsUrl ?>/css/core/caisse_dialogs.css">

  <?php
  // SESSION injectée par PHP
  // Si pas de session (mode démo), on met des valeurs par défaut
  $role      = htmlspecialchars($employe['role']        ?? 'employe',  ENT_QUOTES);
  $identifiant = htmlspecialchars($employe['identifiant'] ?? 'Démo',    ENT_QUOTES);
  $id        = (int) ($employe['id_connexion']           ?? 0);
  ?>
  <script>
    const APP_BASE_URL = '<?= $baseUrl ?>';
    const SESSION = {
      id:          <?= $id ?>,
      identifiant: '<?= $identifiant ?>',
      role:        '<?= $role ?>',
    };
    const CAISSE_MODE = 'employe';
  </script>
</head>
<body>

<!-- ═══════════════════════════════════════════════════
     TOPBAR — basé sur la maquette fil de fer
     UNICA Station | Caisse - Nom | HH:MM:SS | ◀ Gaucher Droitier ▶ | Layout | Gérant | Déconnexion
════════════════════════════════════════════════════ -->
<header id="topbar">

  <div class="tb-brand">
    <img src="<?= $assetsUrl ?>/img/logo_unica.png" alt="UNICA" class="tb-logo-img">
    <span class="tb-name">UNICA Station</span>
  </div>

  <div class="tb-session">
    Caisse — <strong><?= htmlspecialchars($_SESSION['employe']['identifiant'] ?? 'Employé') ?></strong>
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

    <?php if (($_SESSION['employe']['role'] ?? '') === 'gerant'): ?>
    <span class="tb-vsep"></span>
    <button class="tb-switch-btn" onclick="App.openGerant()" title="Basculer vers la caisse gérant">
      <img src="<?= $assetsUrl ?>/img/setting.png" alt="Gérant" class="tb-switch-icon">
      <span>Gérant</span>
    </button>
    <?php endif; ?>

    <span class="tb-vsep"></span>

    <button class="tb-icon-btn tb-icon-btn--danger"
            onclick="App.deconnexion()" title="Déconnexion">
      <img src="<?= $assetsUrl ?>/img/exit.png" alt="Déconnexion">
    </button>
  </div>

</header>

<!-- ═══════════════════════════════════════════════════
     CANVAS — la mosaïque de fenêtres
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
<script src="<?= $assetsUrl ?>/js/core/windows.js"></script>

<!-- Panels (tous "À VENIR" pour l'instant) -->
<script src="<?= $assetsUrl ?>/js/panels/ticket_cart.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/ticket_view.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/ticket_payment.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/ticket_barcode.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/ticket.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/clavier.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/paiement.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/transactions.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/carburant.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/electricite.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/pompes.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/stock.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/alertes.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/cce-creer.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/cce-consult.js"></script>

<!-- Panels gérant -->
<script src="<?= $assetsUrl ?>/js/panels/gerant/reappro.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/prix.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/incidents.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/cce_params.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/horaires.js"></script>

<script src="<?= $assetsUrl ?>/js/app.js"></script>

</body>
</html>
