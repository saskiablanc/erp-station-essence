<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sélection Carburant - Station</title>
</head>
<body>

<div class="container">
    <h1>Sélectionnez votre carburant</h1>

    <?php if (isset($_SESSION['erreur'])): ?>
        <div class="error">
            <?= htmlspecialchars($_SESSION['erreur'], ENT_QUOTES, 'UTF-8') ?>
        </div>
        <?php unset($_SESSION['erreur']); ?>
    <?php endif; ?>

    <form action="/selection-pompe/selectionner" method="POST" id="form-selection">
        <div class="carburants-grid">
            <?php foreach ($carburants as $carburant): ?>
                <div class="carburant-card">
                    <input 
                        type="radio" 
                        name="id_carburant" 
                        value="<?= $carburant['id_carburant'] ?>" 
                        id="carburant-<?= $carburant['id_carburant'] ?>"
                        required
                    >
                    <label class="carburant-label" for="carburant-<?= $carburant['id_carburant'] ?>">
                        <div class="carburant-name">
                            <?= htmlspecialchars($carburant['libelle'], ENT_QUOTES, 'UTF-8') ?>
                        </div>
                        <div class="carburant-prix">
                            <?= number_format((float)$carburant['prix_litre'], 3, ',', ' ') ?> €/L
                        </div>
                        <div class="carburant-stock">
                            Stock : <?= number_format((float)$carburant['stock_litre'], 0, ',', ' ') ?> L
                        </div>
                    </label>
                </div>
            <?php endforeach; ?>
        </div>

        <div class="btn-container">
            <button type="submit" class="btn">
                Continuer ➜
            </button>
        </div>
    </form>
</div>

<script>
    // Ajouter effet visuel sur sélection
    document.querySelectorAll('.carburant-card').forEach(card => {
        card.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            radio.checked = true;
            
            // Retirer la sélection des autres
            document.querySelectorAll('.carburant-card').forEach(c => {
                c.style.borderColor = '#e2e8f0';
            });
            
            // Appliquer au sélectionné
            this.style.borderColor = '#667eea';
        });
    });
</script>

</body>
</html>