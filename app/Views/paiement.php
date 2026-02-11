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

<div class="tpe">

    <div class="ecran">
        <p id="message">
            Montant à payer : <span id="montant">80</span> €
        </p>
        <input type="password" id="code" maxlength="4" placeholder="****" disabled>
    </div>

    <div class="insert">
        <button class="insert-btn" onclick="insererCarte()">Insérer Carte</button>
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

        <button class="annuler" onclick="annuler()">✖</button>
        <button class="zero" onclick="ajouterChiffre(0)">0</button>
        <button class="valider" onclick="valider()">✔</button>
    </div>

</div>

</body>
</html>
