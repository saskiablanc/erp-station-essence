<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404</title>
    <link rel="stylesheet" href="/assets/css/main.css">
</head>
<body>
    <div class="shell">
        <section class="card">
            <h1>404 - Page not found</h1>
            <p>Path: <?= isset($safePath) ? $safePath : '' ?></p>
            <a href="/">Back to home</a>
        </section>
    </div>
</body>
</html>
