<?php
$appName = isset($appName) ? (string) $appName : 'Projet 4E';
?>
<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= htmlspecialchars($appName, ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <div class="shell">
        <header class="hero">
            <p class="eyebrow">MVC + Singleton</p>
            <h1><?= htmlspecialchars($appName, ENT_QUOTES, 'UTF-8') ?></h1>
            <p class="subtext">Base project ready for the 4E station system.</p>
        </header>
        <section class="card">
            <h2>Next steps</h2>
            <ul>
                <li>Create modules: energy cards, payments, pumps, chargers.</li>
                <li>Add admin area for manager settings and daily closure.</li>
                <li>Implement archive database sync for +1 year data.</li>
            </ul>
        </section>
    </div>
</body>
</html>
