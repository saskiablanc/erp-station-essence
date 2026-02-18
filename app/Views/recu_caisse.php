<?php
$montantValue = isset($montant) ? (float) $montant : 0.0;
$montantData = number_format($montantValue, 2, '.', '');
$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
$baseAttr = htmlspecialchars($base, ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Caisse - Paiement</title>
    <link rel="stylesheet" href="assets/css/paiement.css">
    <link rel="stylesheet" href="assets/css/caisse_layout.css">
    <link rel="stylesheet" href="assets/css/caisse_screen.css">
    <script src="assets/js/caisse_state.js" defer></script>
    <script src="assets/js/caisse_screen.js" defer></script>
    <script src="assets/js/caisse_tpe.js" defer></script>
</head>
<body data-base-path="<?= $baseAttr ?>">

<h1 class="page-title">Caisse - Paiement</h1>

<div class="caisse-layout">
    <div class="tpe-column">
        <div class="status-bar tpe-status">
            <span id="card-indicator" class="card-indicator"></span>
            <span id="card-status-text" class="status-text">Carte retirée</span>
        </div>

        <div class="tpe-layout caisse-tpe-layout">
            <div class="tpe">
                <div class="ecran">
                    <p id="message">Bonjour</p>
                    <input type="hidden" id="montant" data-montant="<?= htmlspecialchars($montantData, ENT_QUOTES, 'UTF-8') ?>">
                    <input type="password" id="code" maxlength="4" placeholder="****" disabled>
                </div>

                <div class="clavier">
                    <button type="button" data-key="1">1</button>
                    <button type="button" data-key="2">2</button>
                    <button type="button" data-key="3">3</button>
                    <button type="button" data-key="4">4</button>
                    <button type="button" data-key="5">5</button>
                    <button type="button" data-key="6">6</button>
                    <button type="button" data-key="7">7</button>
                    <button type="button" data-key="8">8</button>
                    <button type="button" data-key="9">9</button>

                    <button type="button" class="special" data-action="annuler">*</button>
                    <button type="button" class="zero" data-key="0">0</button>
                    <button type="button" class="special" data-action="valider">#</button>
                </div>

                <div class="tpe-actions">
                    <button class="action-btn cancel" type="button" data-action="annuler">✖</button>
                    <button class="action-btn back" type="button" data-action="retour">&lt;</button>
                    <button class="action-btn validate" type="button" data-action="valider">✔</button>
                </div>
            </div>

            <aside id="actions-panel" class="actions-panel">
                <button id="actions-toggle" class="actions-toggle" type="button"
                        aria-expanded="true" aria-controls="actions-content">
                    Actions physiques
                </button>
                <div id="actions-content" class="actions-content">
                    <h2>Actions physiques</h2>
                    <button class="action-btn" type="button" data-action="inserer-carte">Insérer carte</button>
                    <button class="action-btn danger" type="button" data-action="retirer-carte">Retirer carte</button>
                </div>
            </aside>
        </div>
    </div>

    <div class="screen-column">
        <div class="caisse-screen">
            <div class="borne-ecran">
                <p id="caisse-montant-label" class="borne-label is-hidden">Montant à payer</p>
                <p id="caisse-montant" class="borne-montant is-hidden">
                    <?= htmlspecialchars(number_format($montantValue, 2, ',', ' '), ENT_QUOTES, 'UTF-8') ?> €
                </p>
                <p id="caisse-status" class="borne-instructions">Veuillez choisir votre mode de paiement</p>

                <div class="borne-actions" id="caisse-actions">
                    <button type="button" class="borne-btn bancaire" data-paiement="bancaire">
                        <span class="btn-label">Carte bancaire</span>
                        <span class="btn-desc">Paiement immédiat</span>
                    </button>
                    <button type="button" class="borne-btn cce" data-paiement="cce">
                        <span class="btn-label">Carte CCE</span>
                        <span class="btn-desc">Crédit énergie</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

</body>
</html>
