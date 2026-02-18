<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reçu - Caisse</title>
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>

<?php
$base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
$imprimerAction = ($base !== '' ? $base : '') . '/index.php?page=recu/imprimer';
$montantAffiche = number_format((float) ($montant ?? 0), 2, ',', ' ');
?>

<div class="container">
    <header class="header">
        <h1>Paiement accepté</h1>
    </header>

    <main>
        <div class="recap-transaction">
            <p class="recap-label">Transaction n°<?= (int) ($id_transaction ?? 0) ?></p>
            <p class="recap-montant"><?= $montantAffiche ?> €</p>
            <p class="recap-statut">Paiement validé ✓</p>
        </div>

        <div id="recu-actions">
            <p class="recu-question">Le client souhaite-t-il un reçu ?</p>

            <div class="recu-btns">
                <button id="btn-imprimer" class="btn btn-primary" type="button">
                    Imprimer le reçu
                </button>
                <button id="btn-sans-recu" class="btn btn-secondary" type="button"
                        onclick="window.location.href='<?= htmlspecialchars(($base !== '' ? $base : '') . '/index.php?page=home', ENT_QUOTES, 'UTF-8') ?>'">
                    Sans reçu
                </button>
            </div>

            <p id="recu-message" class="recu-message" style="display: none;"></p>
        </div>
    </main>
</div>

<script>
document.getElementById('btn-imprimer').addEventListener('click', function () {
    const btn = this;
    btn.disabled = true;

    fetch('<?= htmlspecialchars($imprimerAction, ENT_QUOTES, 'UTF-8') ?>', {
        method: 'POST',
    })
    .then(r => r.json())
    .then(data => {
        const msg = document.getElementById('recu-message');
        msg.style.display = 'block';

        if (data.status === 'ok') {
            msg.textContent = 'Impression du reçu en cours... (reçu n°' + data.id_recu + ')';
            msg.className = 'recu-message success';

            document.getElementById('recu-actions').querySelector('.recu-btns').style.display = 'none';

            // Retour accueil après 2s
            setTimeout(() => {
                window.location.href = '<?= htmlspecialchars(($base !== '' ? $base : '') . '/index.php?page=home', ENT_QUOTES, 'UTF-8') ?>';
            }, 2000);
        } else {
            msg.textContent = 'Erreur : ' + (data.message ?? 'Impossible d\'imprimer le reçu');
            msg.className = 'recu-message error';
            btn.disabled = false;
        }
    })
    .catch(() => {
        const msg = document.getElementById('recu-message');
        msg.style.display = 'block';
        msg.textContent = 'Erreur réseau, veuillez réessayer.';
        msg.className = 'recu-message error';
        btn.disabled = false;
    });
});
</script>

</body>
</html>