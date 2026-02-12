<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Choix du mode de paiement</title>
    <link rel="stylesheet" href="/assets/css/choix_paiement.css">
</head>
<body>

<h1 class="page-title">Choix du mode de paiement</h1>

<div class="choix-paiement-container">
    
    <!-- Affichage du montant -->
    <div class="montant-section">
        <p class="montant-label">Montant à payer</p>
        <p class="montant-valeur"><?= number_format($montant ?? 80, 2, ',', ' ') ?> €</p>
    </div>

    <!-- Instructions -->
    <div class="instructions">
        <p>Veuillez choisir votre mode de paiement</p>
    </div>

    <!-- Boutons de choix -->
    <form method="POST" action="/choix-paiement/selectionner">
        <input type="hidden" name="montant" value="<?= $montant ?? 80 ?>">
        
        <div class="choix-buttons">
            <!-- Bouton Carte Bancaire -->
            <button type="submit" name="type_carte" value="bancaire" class="choix-btn">
                <div class="carte-label">Carte</div>
                <div class="carte-type">BANCAIRE</div>
            </button>

            <!-- Bouton Carte CCE -->
            <button type="submit" name="type_carte" value="cce" class="choix-btn">
                <div class="carte-label">Carte</div>
                <div class="carte-type">CCE</div>
            </button>
        </div>
    </form>

    <!-- Bouton Retour -->
    <div class="retour-section">
        <a href="/home" class="btn-retour">
            <span class="arrow">←</span> Retour
        </a>
    </div>

</div>

</body>
</html>