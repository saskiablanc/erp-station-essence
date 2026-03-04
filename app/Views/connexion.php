<?php
/**
 * Vue : connexion.php
 * US0 — Employé / Connexion-Déconnexion
 */
declare(strict_types=1);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UNICA Station — Connexion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Familjen+Grotesk:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/connexion.css">
</head>
<body>

  <div class="circle-tl"></div>
  <div class="circle-br"></div>

  <div class="login-card">

    <!-- Logo UNICA -->
    <div class="logo-wrap">
      <img src="/assets/img/logo_unica.png" alt="UNICA Station"
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
      <div class="logo-fallback">
        <span class="logo-fallback-text">UNICA <span>Station</span></span>
      </div>
    </div>

    <div class="connexion-banner">
      <h1>Connexion</h1>
    </div>

    <form class="login-form" method="POST" action="/connexion" novalidate>

      <?php if (!empty($error)): ?>
        <div class="error-box" role="alert">
          <div class="error-icon">!</div>
          <div class="error-text">
            <?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?>
          </div>
        </div>
      <?php endif; ?>

      <div class="field-group">
        <label class="field-label" for="identifiant">Identifiant :</label>
        <input
          class="field-input<?= !empty($error) ? ' has-error' : '' ?>"
          type="text"
          id="identifiant"
          name="identifiant"
          autocomplete="username"
          autofocus
          required
        >
      </div>

      <div class="field-group">
        <label class="field-label" for="mdp">Mot de passe :</label>
        <input
          class="field-input<?= !empty($error) ? ' has-error' : '' ?>"
          type="password"
          id="mdp"
          name="mdp"
          autocomplete="current-password"
          required
        >
      </div>

      <button type="submit" class="btn-submit">SE CONNECTER</button>

    </form>

    <p class="login-footer">UNICA Station · Logiciel de caisse ERP · SAE R409</p>
  </div>

</body>
</html>