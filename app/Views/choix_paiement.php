<?php
$montantValue = number_format($montant ?? 80, 2, ',', ' ');
$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
$action = ($base !== '' ? $base : '') . '/index.php?page=choix-paiement/selectionner';
$back = ($base !== '' ? $base : '') . '/index.php?page=home';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mode de paiement</title>
    <link rel="stylesheet" href="assets/css/choix_paiement.css">
</head>
<body>

<h1 class="page-title">Mode de paiement</h1>

<div class="borne">
    <div class="borne-ecran">
        <p class="borne-instructions">Veuillez choisir votre mode de paiement</p>

        <form class="borne-actions" method="POST" action="<?= htmlspecialchars($action, ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="montant" value="<?= htmlspecialchars((string) ($montant ?? 80), ENT_QUOTES, 'UTF-8') ?>">

        <button type="submit" name="type_carte" value="bancaire" class="borne-btn bancaire">
                <span class="btn-label">Carte bancaire</span>
                <span class="btn-desc">Paiement immédiat</span>
            </button>

        <button type="submit" name="type_carte" value="cce" class="borne-btn cce">
                <span class="btn-label">Carte CCE</span>
                <span class="btn-desc">Crédit énergie</span>
            </button>
        </form>

        <a href="<?= htmlspecialchars($back, ENT_QUOTES, 'UTF-8') ?>" class="borne-retour">
            <span class="arrow">←</span> Retour
        </a>
    </div>
</div>

</body>
</html>
