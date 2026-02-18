<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction en cours - Station</title>
    <link rel="stylesheet" href="assets/css/transaction.css">
    <script src="assets/js/transaction.js" defer></script>
</head>
<body>

<?php
$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
$selectionAction = ($base !== '' ? $base : '') . '/index.php?page=selection-pompe/selectionner';
$selectionChargeAction = ($base !== '' ? $base : '') . '/index.php?page=selection-charge/selectionner';
$energieType = $energie_type ?? 'carburant';
$isElectric = $energieType === 'electricite';
$labelType = $isElectric ? 'TYPE DE CHARGE' : 'TYPE DE CARBURANT';
$labelQuantite = $isElectric ? 'TEMPS' : 'VOLUME';
$unitQuantite = $isElectric ? 'MIN' : 'LITRES';
$labelPrixUnitaire = $isElectric ? 'PRIX DU KWH' : 'PRIX DU LITRE';
$energieAffiche = $isElectric
    ? ucfirst((string) ($electricite['type_charge'] ?? 'Aucune sélection'))
    : (string) ($carburant['libelle'] ?? 'Aucune sélection');
$selectionManquante = $isElectric ? empty($electricite_selectionne) : empty($carburant_selectionne);
$actionLabel = $isElectric ? 'Maintenir pour charger' : 'Maintenir pour délivrer';
?>

<div class="container">
    <header class="header">
        <h1>Transaction en cours</h1>
        <div class="header-meta">
            <div class="mode-switch">
                <span class="mode-label">Essence</span>
                <label class="switch">
                    <input type="checkbox" id="energie-toggle" <?= $isElectric ? 'checked' : '' ?>>
                    <span class="slider"></span>
                </label>
                <span class="mode-label">Électricité</span>
            </div>
            <div class="mode-switch">
                <span class="mode-label">Caisse</span>
                <label class="switch">
                    <input type="checkbox" id="mode-toggle" <?= ($type_automate ?? 24) === 24 ? 'checked' : '' ?>>
                    <span class="slider"></span>
                </label>
                <span class="mode-label">Automate 24</span>
            </div>
            <div class="status-indicator">
                <span id="status-text" class="status-text">En attente</span>
            </div>
            <div class="pistolet-indicator">
                <span id="pistolet-dot" class="indicator-dot"></span>
                <span id="pistolet-text" class="indicator-text">Pistolet raccroché</span>
            </div>
        </div>
    </header>

    <main class="main-content">
        
        <?php $automate24 = ($type_automate ?? 24) === 24; ?>

        <div class="transaction-layout">
            <div class="layout-column left-column">
                <div id="tpe-automate" class="tpe-embed" style="display: <?= $automate24 ? 'flex' : 'none' ?>;">
                    <div class="status-bar tpe-status">
                        <span id="card-indicator" class="card-indicator"></span>
                        <span id="card-status-text" class="status-text">Carte retirée</span>
                    </div>
                    <div class="tpe-layout">
                        <div class="tpe">
                            <div class="ecran">
                                <p id="message">Bonjour</p>
                                <input type="password" id="code" maxlength="4" placeholder="****" disabled>
                            </div>

                            <div class="clavier">
                                <button onclick="ajouterChiffre(1)">1</button>
                                <button onclick="ajouterChiffre(2)">2</button>
                                <button onclick="ajouterChiffre(3)">3</button>
                                <button onclick="ajouterChiffre(4)">4</button>
                                <button onclick="ajouterChiffre(5)">5</button>
                                <button onclick="ajouterChiffre(6)">6</button>
                                <button onclick="ajouterChiffre(7)">7</button>
                                <button onclick="ajouterChiffre(8)">8</button>
                                <button onclick="ajouterChiffre(9)">9</button>

                                <button class="special" onclick="annuler()">*</button>
                                <button class="zero" onclick="ajouterChiffre(0)">0</button>
                                <button class="special" onclick="valider()">#</button>
                            </div>

                            <div class="tpe-actions">
                                <button class="action-btn cancel" onclick="annuler()">X</button>
                                <button class="action-btn back" onclick="retour()">&lt;</button>
                                <button class="action-btn validate" onclick="valider()">✔</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- US28 - Critère 7 : Affichage ID transaction et date/heure en fin -->
                <div id="info-transaction" class="transaction-info" style="display: none;">
                    <h3>Informations de transaction</h3>
                    <div class="transaction-details">
                        <div class="detail-row">
                            <span class="detail-label">ID Transaction :</span>
                            <span id="id-transaction" class="detail-value">-</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Date et heure :</span>
                            <span id="date-heure" class="detail-value">-</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="layout-column right-column">
                <!--Affichage simultané des informations -->
                <div class="station-screen">
                <div class="screen-top">
                    <div class="screen-label"><?= $labelType ?></div>
                    <div class="screen-fuel" id="type-energie">
                        <?= htmlspecialchars($energieAffiche, ENT_QUOTES, 'UTF-8') ?>
                    </div>
                </div>

                <div class="screen-row">
                    <div class="screen-label">PRIX</div>
                    <div class="screen-value">
                        <span id="total-value" class="screen-digits">0.00</span>
                    </div>
                    <div class="screen-unit">€</div>
                </div>

                <div class="screen-row">
                    <div class="screen-label"><?= $labelQuantite ?></div>
                    <div class="screen-value">
                        <span id="quantite-value" class="screen-digits">
                            <?= $isElectric ? '00:00' : '0.000' ?>
                        </span>
                    </div>
                    <div class="screen-unit"><?= $unitQuantite ?></div>
                </div>

                <div class="screen-row small price-row">
                    <div class="screen-label"><?= $labelPrixUnitaire ?></div>
                    <div class="screen-value small" id="prix-litre">
                        <?php if ($prix_disponible): ?>
                            <span class="screen-digits small">
                                <?= number_format((float)($carburant['prix_litre'] ?? 0), 3, ',', ' ') ?>
                            </span>
                        <?php else: ?>
                            <span class="error">Indisponible</span>
                        <?php endif; ?>
                    </div>
                    <div class="screen-unit">€</div>
                </div>
                </div>

                <div id="choix-paiement" class="borne-embed" style="display: <?= $automate24 ? 'block' : 'none' ?>;">
                    <div class="borne-ecran">
                        <p id="choix-status" class="borne-instructions">Bonjour</p>

                        <div id="choix-start" class="borne-start">
                            <button type="button" class="borne-start-btn" id="btn-commencer">Commencer</button>
                        </div>

                        <div class="borne-actions" id="choix-actions" style="display: none;">
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

        <?php if (!empty($_SESSION['erreur_selection'])): ?>
        <div class="alert alert-error">
            <?= htmlspecialchars($_SESSION['erreur_selection'], ENT_QUOTES, 'UTF-8') ?>
        </div>
        <?php unset($_SESSION['erreur_selection']); ?>
        <?php endif; ?>

        

    </main>

    <!-- Panneau d'actions physiques -->
    <aside id="actions-panel" class="actions-panel">
        <button id="actions-toggle" class="actions-toggle" type="button">
            Actions physiques
        </button>
        <div id="actions-content" class="actions-content">
            <div id="actions-essence">
                <form id="form-selection" class="action-select" method="POST" action="<?= htmlspecialchars($selectionAction, ENT_QUOTES, 'UTF-8') ?>" style="display: <?= $isElectric ? 'none' : 'flex' ?>;">
                    <label for="carburant-select">Sélectionner une pompe</label>
                <select id="carburant-select" name="id_carburant" required>
                    <option value="">Choisir un carburant</option>
                    <?php foreach ($carburants as $item): ?>
                        <option
                            value="<?= (int)$item['id_carburant'] ?>"
                            data-libelle="<?= htmlspecialchars($item['libelle'], ENT_QUOTES, 'UTF-8') ?>"
                            data-prix="<?= htmlspecialchars((string) $item['prix_litre'], ENT_QUOTES, 'UTF-8') ?>"
                            data-stock="<?= htmlspecialchars((string) $item['stock_litre'], ENT_QUOTES, 'UTF-8') ?>"
                            <?= ($carburant_selectionne && (int)$item['id_carburant'] === (int)$carburant_selectionne) ? 'selected' : '' ?>
                        >
                            <?= htmlspecialchars($item['libelle'], ENT_QUOTES, 'UTF-8') ?> (<?= number_format((float)$item['prix_litre'], 3, ',', ' ') ?> €/L)
                        </option>
                    <?php endforeach; ?>
                </select>
            </form>
                <form id="form-selection-charge" class="action-select" method="POST" action="<?= htmlspecialchars($selectionChargeAction, ENT_QUOTES, 'UTF-8') ?>" style="display: <?= $isElectric ? 'flex' : 'none' ?>;">
                    <label for="charge-select">Sélectionner un type de charge</label>
                    <select id="charge-select" name="id_electricite" required>
                        <option value="">Choisir une charge</option>
                        <?php foreach ($electricites as $item): ?>
                            <option
                                value="<?= (int)$item['id_electricite'] ?>"
                                data-type="<?= htmlspecialchars($item['type_charge'], ENT_QUOTES, 'UTF-8') ?>"
                                data-prix="<?= htmlspecialchars((string) $item['prix_kwh'], ENT_QUOTES, 'UTF-8') ?>"
                                <?= ($electricite_selectionne && (int)$item['id_electricite'] === (int)$electricite_selectionne) ? 'selected' : '' ?>
                            >
                                <?= htmlspecialchars(ucfirst($item['type_charge']), ENT_QUOTES, 'UTF-8') ?> (<?= number_format((float)$item['prix_kwh'], 3, ',', ' ') ?> €/kWh)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </form>
                <button
                    id="btn-delivrance"
                    class="action-btn hold"
                    type="button"
                    <?= (!$prix_disponible || !$stock_disponible || $selectionManquante) ? 'disabled' : '' ?>
                >
                    <?= $actionLabel ?>
                </button>
                <button id="btn-decrocher" class="action-btn" type="button">
                    Décrocher le pistolet
                </button>
                <button class="action-btn" type="button" onclick="simulerRaccrochage()">
                    Raccrocher le pistolet
                </button>
                <button class="action-btn danger" type="button" onclick="annulerTransaction()">
                    Annuler la transaction
                </button>
                <button id="btn-paiement" class="action-btn success" type="button" style="display: none;">
                    Se rendre à la caisse
                </button>
            </div>

            <div id="actions-carte" class="actions-carte" style="display: none;">
                <button id="btn-inserer-carte" class="action-btn" type="button">
                    Insérer carte
                </button>
                <button id="btn-retirer-carte" class="action-btn danger" type="button">
                    Retirer carte
                </button>
            </div>
        </div>
    </aside>
</div>

<!-- Script inline pour passer les données PHP à JavaScript -->
<script>
    // Données du carburant depuis PHP
    window.carburantData = {
        libelle: <?= json_encode($carburant['libelle']) ?>,
        prixLitre: <?= (float) $carburant['prix_litre'] ?>,
        stockLitre: <?= (float) $carburant['stock_litre'] ?>,
        prixDisponible: <?= $prix_disponible ? 'true' : 'false' ?>,
        stockDisponible: <?= $stock_disponible ? 'true' : 'false' ?>
    };
    window.electriciteData = {
        typeCharge: <?= json_encode($electricite['type_charge'] ?? null) ?>,
        prixKwh: <?= isset($electricite['prix_kwh']) ? (float) $electricite['prix_kwh'] : 0 ?>,
        idEnergie: <?= isset($electricite['id_energie']) ? (int) $electricite['id_energie'] : 0 ?>
    };
    window.basePath = <?= json_encode($base) ?>;
    window.typeAutomate = <?= ($type_automate ?? 24) === 24 ? '24' : '0' ?>;
    window.pistoletDecroche = <?= !empty($pistolet_decroche) ? 'true' : 'false' ?>;
    window.energieType = <?= json_encode($energieType) ?>;
</script>

</body>
</html>
