<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Station — Caisse</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Familjen+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/interact.js/1.10.27/interact.min.js"></script>
  <?php
  $baseUrl = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
  if ($baseUrl === '/' || $baseUrl === '\\') {
    $baseUrl = '';
  }
  $assetsUrl = $baseUrl . '/assets';
  ?>
  <link rel="stylesheet" href="<?= $assetsUrl ?>/css/caisse.css">

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
  </script>
</head>
<body>

<!-- ═══════════════════════════════════════════════════
     TOPBAR — basé sur la maquette fil de fer
     UNICA Station | Caisse - Nom | HH:MM:SS | ◀ Gaucher Droitier ▶ | Layout | Gérant | Déconnexion
════════════════════════════════════════════════════ -->
<header id="topbar">
  <div class="tb-brand">
    <span class="tb-logo"></span>
    <span class="tb-name">UNICA Station</span>
  </div>

  <div class="tb-sep"></div>

  <div class="tb-session">
    <span class="live-dot"></span>
    <span>Caisse — <strong id="tb-nom"><?= $identifiant ?></strong></span>
    <span class="tb-role" id="tb-role"><?= $role === 'gerant' ? 'Gérant' : 'Employé' ?></span>
  </div>

  <div class="tb-clock" id="clock">--:--:--</div>

  <div class="tb-spacer"></div>

  <div class="tb-controls">
    <div class="hand-toggle">
      <button class="hand-btn" data-hand="left"  onclick="App.setHand('left')">◀ Gaucher</button>
      <button class="hand-btn active" data-hand="right" onclick="App.setHand('right')">Droitier ▶</button>
    </div>

    <button class="tb-btn save" onclick="App.saveLayout()" title="Sauvegarder la disposition">
      Layout
    </button>

    <button class="tb-btn gerant" id="btn-gerant"
            style="<?= $role === 'gerant' ? '' : 'display:none' ?>"
            onclick="App.openGerant()">
      Gérant
    </button>

    <button class="tb-btn deconnexion" onclick="App.deconnexion()" title="Déconnexion">
      Déconnexion
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
  <div class="taskbar-right">
    <button id="btn-reset-layout" onclick="App.resetLayout()" title="Réinitialiser">↺</button>
  </div>
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
<script src="<?= $assetsUrl ?>/js/panels/ticket.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/clavier.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/paiement.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/transactions.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/pompes.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/stock.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/alertes.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/cce.js"></script>

<!-- Panels gérant -->
<script src="<?= $assetsUrl ?>/js/panels/gerant/reappro.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/prix.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/incidents.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/cce_params.js"></script>
<script src="<?= $assetsUrl ?>/js/panels/gerant/horaires.js"></script>

<script src="<?= $assetsUrl ?>/js/app.js"></script>

</body>
</html>
