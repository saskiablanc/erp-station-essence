<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Paiement;

/**
 * PaiementController - Gère le TPE pour l'US25
 */
class PaiementController extends Controller
{
    /**
     * Afficher la page du TPE (US25 - critères 1, 2, 3)
     */
    public function index(): void
    {
        // Récupérer le montant depuis la session ou paramètre GET
        $montant = $_SESSION['montant_a_payer'] ?? ($_GET['montant'] ?? 80);
        
        // Passer le montant à la vue
        require VIEW_PATH . '/paiement.php';
    }

    /**
     * Traiter le paiement (US25 - critères 4, 7, 8)
     * Gère :
     * - Vérification du code secret (critère 4)
     * - Messages d'erreur avec tentatives (critère 7)
     * - Vérification solde insuffisant (critère 8)
     */
    public function traiter(): void
    {
        header('Content-Type: application/json');

        // Récupérer les données POST
        $code = $_POST['code'] ?? '';
        $montant = (float) ($_POST['montant'] ?? 0);
        
        // Validation des données
        if (empty($code) || $montant <= 0) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Données invalides'
            ]);
            exit;
        }

        // Validation du code (4 chiffres)
        if (!preg_match('/^\d{4}$/', $code)) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Le code doit contenir 4 chiffres'
            ]);
            exit;
        }

        // Instancier le model de paiement
        $paiementModel = new Paiement();

        try {
            // MODE SIMULATION pour le moment
            // Quand vous aurez une vraie carte CCE en BD, utilisez :
            // $idCarteCCE = $_SESSION['id_carte_cce'] ?? 1;
            // $resultat = $paiementModel->traiterPaiementCarteCCE($idCarteCCE, $code, $montant);
            
            $resultat = $paiementModel->verifierPaiement($code, $montant);

            // Stocker l'ID de transaction en session si succès
            if ($resultat['status'] === 'ok' && isset($resultat['id_transaction'])) {
                $_SESSION['derniere_transaction'] = $resultat['id_transaction'];
            }

            echo json_encode($resultat);

        } catch (\Exception $e) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Erreur serveur'
            ]);
        }

        exit;
    }

    /**
     * Annuler le paiement (US25 - critère 6)
     */
    public function annuler(): void
    {
        header('Content-Type: application/json');

        // Réinitialiser les données de paiement en session
        unset($_SESSION['montant_a_payer']);
        unset($_SESSION['derniere_transaction']);

        echo json_encode([
            'status' => 'ok',
            'message' => 'Paiement annulé'
        ]);
        exit;
    }
}