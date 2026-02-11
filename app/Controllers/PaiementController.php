<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Models\Paiement;

class PaiementController
{
    public function index(): void
    {
        require VIEW_PATH . '/paiement.php';
    }

    public function traiter(): void
    {
        $code = $_POST['code'] ?? '';
        $montant = (int) ($_POST['montant'] ?? 0);

        $paiement = new Paiement();
        $resultat = $paiement->verifierPaiement($code, $montant);

        header('Content-Type: application/json');
        echo json_encode($resultat);
        exit;
    }
}
