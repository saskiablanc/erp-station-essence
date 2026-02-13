<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>TPE - Paiement</title>
    <link rel="stylesheet" href="assets/css/paiement.css">
    <script src="assets/js/paiement.js" defer></script>
</head>
<body>

<h1 class="page-title">TPE</h1>
<div class="status-bar">
    <span id="card-indicator" class="card-indicator"></span>
    <span class="status-text">Carte insérée</span>
</div>

<div class="tpe-layout">
    <div class="tpe">
        <div class="ecran">
            <p id="message">
                Montant à payer : <span id="montant">80</span> €
            </p>
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
        <button class="action-btn cancel" onclick="annuler()">✖</button>
        <button class="action-btn back" onclick="retour()">&lt;</button>
        <button class="action-btn validate" onclick="valider()">✔</button>
    </div>
</div>

    <aside id="actions-panel" class="actions-panel">
        <button id="actions-toggle" class="actions-toggle" type="button" aria-expanded="true" aria-controls="actions-content">
            Actions physiques
        </button>
        <div id="actions-content" class="actions-content">
            <h2>Actions physiques</h2>
            <button class="action-btn" type="button" onclick="insererCarte()">Insérer carte</button>
            <button class="action-btn danger" type="button" onclick="retirerCarte()">Retirer carte</button>
        </div>
    </aside>
</div>

</body>
</html>
