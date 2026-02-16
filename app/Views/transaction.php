<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction en cours - Station</title>
    <link rel="stylesheet" href="/assets/css/transaction.css">
    <script src="/assets/js/transaction.js" defer></script>
</head>
<body>

<div class="container">
    <header class="header">
        <h1>⛽ Transaction en cours</h1>
        <div class="status-indicator">
            <span id="status-text" class="status-text">En attente</span>
        </div>
    </header>

    <main class="main-content">
        
        <!-- US28 - Critère 1 : Affichage simultané des informations -->
        <div class="info-panel">
            
            <!-- Type d'énergie -->
            <div class="info-card energie">
                <div class="info-label">Type de carburant</div>
                <div class="info-value" id="type-energie">
                    <?= htmlspecialchars($carburant['libelle'], ENT_QUOTES, 'UTF-8') ?>
                </div>
            </div>

            <!-- Prix unitaire -->
            <div class="info-card prix">
                <div class="info-label">Prix au litre</div>
                <?php if ($prix_disponible): ?>
                    <div class="info-value" id="prix-litre">
                        <?= number_format((float)$carburant['prix_litre'], 3, ',', ' ') ?> €/L
                    </div>
                <?php else: ?>
                    <!-- US28 - Critère 6 : Message si prix indisponible -->
                    <div class="info-value error">
                        Prix indisponible
                    </div>
                <?php endif; ?>
            </div>

            <!-- Quantité délivrée (US28 - Critère 2 : mise à jour continue) -->
            <div class="info-card quantite">
                <div class="info-label">Quantité délivrée</div>
                <div class="info-value" id="quantite-delivree">
                    <span id="quantite-value">0.000</span> L
                </div>
            </div>

            <!-- Total TTC (US28 - Critère 3 : calcul automatique) -->
            <div class="info-card total">
                <div class="info-label">Total TTC</div>
                <div class="info-value large" id="total-ttc">
                    <span id="total-value">0.00</span> €
                </div>
            </div>

        </div>

        <!-- US28 - Critère 6 : Message d'erreur si données indisponibles -->
        <?php if (!$prix_disponible || !$stock_disponible): ?>
        <div class="alert alert-error">
            <strong>⚠️ Attention :</strong>
            <?php if (!$prix_disponible): ?>
                Le prix du carburant n'est pas disponible actuellement.
            <?php endif; ?>
            <?php if (!$stock_disponible): ?>
                Stock insuffisant pour ce carburant.
            <?php endif; ?>
            <br>Le paiement est désactivé jusqu'au retour des données.
        </div>
        <?php endif; ?>

        <!-- US28 - Critère 5 : Instructions pour automate type 24 -->
        <?php if ($type_automate === 24): ?>
        <div class="instructions-paiement">
            <h2>💳 Instructions de paiement</h2>
            <ol>
                <li>Attendez la fin de la délivrance</li>
                <li>Insérez votre carte bancaire ou carte CCE</li>
                <li>Suivez les instructions sur l'écran du TPE</li>
                <li>Retirez votre carte et votre reçu</li>
            </ol>
        </div>
        <?php endif; ?>

        <!-- Contrôles de simulation -->
        <div class="controls">
            <button 
                id="btn-demarrer" 
                class="btn btn-primary"
                <?= (!$prix_disponible || !$stock_disponible) ? 'disabled' : '' ?>
            >
                ▶️ Démarrer la délivrance
            </button>
            
            <button id="btn-arreter" class="btn btn-danger" style="display: none;">
                ⏸️ Arrêter la délivrance
            </button>

            <button id="btn-paiement" class="btn btn-success" style="display: none;">
                💳 Procéder au paiement
            </button>
        </div>

        <!-- US28 - Critère 7 : Affichage ID transaction et date/heure en fin -->
        <div id="info-transaction" class="transaction-info" style="display: none;">
            <h3>📋 Informations de transaction</h3>
            <div class="transaction-details">
                <div class="detail-row">
                    <span class="detail-label">ID Transaction :</span>
                    <span id="id-transaction" class="detail-value">-</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date et heure :</span>
                    <span id="date-heure" class="detail-value">-</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Stock restant :</span>
                    <span id="stock-restant" class="detail-value">
                        <?= number_format((float)$carburant['stock_litre'], 3, ',', ' ') ?> L
                    </span>
                </div>
            </div>
        </div>

    </main>

    <!-- Panneau d'actions physiques -->
    <aside id="actions-panel" class="actions-panel">
        <button id="actions-toggle" class="actions-toggle" type="button">
            Actions physiques
        </button>
        <div id="actions-content" class="actions-content">
            <h2>Actions physiques</h2>
            <button class="action-btn" type="button" onclick="simulerPompe()">
                🔧 Décrocher le pistolet
            </button>
            <button class="action-btn" type="button" onclick="simulerRaccrochage()">
                🔧 Raccrocher le pistolet
            </button>
            <button class="action-btn danger" type="button" onclick="annulerTransaction()">
                ❌ Annuler la transaction
            </button>
        </div>
    </aside>
</div>

<!-- Script inline pour passer les données PHP à JavaScript -->
<script>
    // Données du carburant depuis PHP
    window.carburantData = {
        libelle: <?= json_encode($carburant['libelle']) ?>,
        prixLitre: <?= $carburant['prix_litre'] ?>,
        stockLitre: <?= $carburant['stock_litre'] ?>,
        prixDisponible: <?= $prix_disponible ? 'true' : 'false' ?>,
        stockDisponible: <?= $stock_disponible ? 'true' : 'false' ?>
    };
</script>

</body>
</html>