<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Carburant;
use App\Models\Transaction;
use App\Models\TransactionEnergie;

/**
 * TransactionController - Gère l'US28
 * Consultation des informations courantes de l'énergie et de la transaction
 */
class TransactionController extends Controller
{
    private Carburant $carburantModel;
    private Transaction $transactionModel;
    private TransactionEnergie $transactionEnergieModel;

    public function __construct()
    {
        $this->carburantModel = new Carburant();
        $this->transactionModel = new Transaction();
        $this->transactionEnergieModel = new TransactionEnergie();
    }

    /**
     * US28 - Afficher l'écran de transaction avec informations en temps réel
     * Critères 1, 2, 3, 4, 5, 6, 7
     */
    public function afficher(): void
    {
        // Récupérer l'ID du carburant sélectionné depuis la session
        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
        
        if (!$idCarburant) {
            // Rediriger vers la sélection de pompe si pas de carburant sélectionné
            header('Location: /selection-pompe');
            exit;
        }

        // Récupérer les informations du carburant
        $carburant = $this->carburantModel->getById((int)$idCarburant);
        
        if (!$carburant) {
            $_SESSION['erreur'] = 'Carburant non trouvé';
            header('Location: /');
            exit;
        }

        // Vérifier la disponibilité des données (critère 6)
        $prixDisponible = isset($carburant['prix_litre']) && $carburant['prix_litre'] > 0;
        $stockDisponible = isset($carburant['stock_litre']) && $carburant['stock_litre'] > 0;

        // Type d'automate (24 = avec paiement)
        $typeAutomate = $_SESSION['type_automate'] ?? 24;
        
        // Passer les données à la vue
        $data = [
            'carburant' => $carburant,
            'prix_disponible' => $prixDisponible,
            'stock_disponible' => $stockDisponible,
            'type_automate' => $typeAutomate,
            'montant_initial' => $_SESSION['montant_demande'] ?? 0,
            'quantite_demandee' => $_SESSION['quantite_demandee'] ?? 0
        ];

        require VIEW_PATH . '/transaction.php';
    }

    /**
     * API - Récupérer les données de carburant en temps réel (AJAX)
     * US28 - critère 2 : mise à jour continue
     */
    public function getInfosCarburant(): void
    {
        header('Content-Type: application/json');

        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
        
        if (!$idCarburant) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Aucun carburant sélectionné'
            ]);
            exit;
        }

        $carburant = $this->carburantModel->getById((int)$idCarburant);
        
        if (!$carburant) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Carburant introuvable'
            ]);
            exit;
        }

        echo json_encode([
            'status' => 'ok',
            'carburant' => [
                'libelle' => $carburant['libelle'],
                'prix_litre' => (float)$carburant['prix_litre'],
                'stock_litre' => (float)$carburant['stock_litre']
            ]
        ]);
        exit;
    }

    /**
     * Démarrer la simulation de délivrance
     * US28 - critères 2, 3, 4
     */
    public function demarrerDelivrance(): void
    {
        header('Content-Type: application/json');

        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
        
        if (!$idCarburant) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Aucun carburant sélectionné'
            ]);
            exit;
        }

        $carburant = $this->carburantModel->getById((int)$idCarburant);
        
        if (!$carburant) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Carburant introuvable'
            ]);
            exit;
        }

        // Créer la transaction
        $montantInitial = 0; // Sera calculé au fur et à mesure
        $idTransaction = $this->transactionModel->creer($montantInitial);

        if (!$idTransaction) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Erreur création transaction'
            ]);
            exit;
        }

        // Créer la transaction énergie
        $idTransactionEnergie = $this->transactionEnergieModel->creer(
            $idTransaction,
            (int)$carburant['id_energie'],
            0.0 // Quantité initiale à 0
        );

        // Stocker en session
        $_SESSION['id_transaction_courante'] = $idTransaction;
        $_SESSION['id_transaction_energie'] = $idTransactionEnergie;
        $_SESSION['delivrance_en_cours'] = true;
        $_SESSION['quantite_actuelle'] = 0.0;

        echo json_encode([
            'status' => 'ok',
            'id_transaction' => $idTransaction,
            'message' => 'Délivrance démarrée'
        ]);
        exit;
    }

    /**
     * Mettre à jour la délivrance en cours (simulation temps réel)
     * US28 - critère 2
     */
    public function mettreAJourDelivrance(): void
    {
        header('Content-Type: application/json');

        $quantite = (float)($_POST['quantite'] ?? 0);
        
        if (!isset($_SESSION['delivrance_en_cours']) || !$_SESSION['delivrance_en_cours']) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Aucune délivrance en cours'
            ]);
            exit;
        }

        $idTransactionEnergie = $_SESSION['id_transaction_energie'] ?? null;
        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;

        if (!$idTransactionEnergie || !$idCarburant) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Session invalide'
            ]);
            exit;
        }

        // Mettre à jour la quantité
        $this->transactionEnergieModel->mettreAJourQuantite((int)$idTransactionEnergie, $quantite);
        
        $_SESSION['quantite_actuelle'] = $quantite;

        // Calculer le total
        $carburant = $this->carburantModel->getById((int)$idCarburant);
        $total = $quantite * (float)$carburant['prix_litre'];

        echo json_encode([
            'status' => 'ok',
            'quantite' => $quantite,
            'total' => round($total, 2)
        ]);
        exit;
    }

    /**
     * Terminer la délivrance
     * US28 - critères 4, 7
     */
    public function terminerDelivrance(): void
    {
        header('Content-Type: application/json');

        if (!isset($_SESSION['delivrance_en_cours']) || !$_SESSION['delivrance_en_cours']) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Aucune délivrance en cours'
            ]);
            exit;
        }

        $idTransaction = $_SESSION['id_transaction_courante'] ?? null;
        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
        $quantiteFinale = $_SESSION['quantite_actuelle'] ?? 0.0;

        if (!$idTransaction || !$idCarburant) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Session invalide'
            ]);
            exit;
        }

        // Récupérer les infos du carburant
        $carburant = $this->carburantModel->getById((int)$idCarburant);
        $prixLitre = (float)$carburant['prix_litre'];
        $totalFinal = $quantiteFinale * $prixLitre;

        // Mettre à jour le stock (critère 7)
        $this->carburantModel->diminuerStock((int)$idCarburant, $quantiteFinale);

        // Mettre à jour le prix total de la transaction
        $this->transactionModel->getById((int)$idTransaction); // Pour vérifier l'existence

        // Stocker les infos finales en session
        $_SESSION['delivrance_en_cours'] = false;
        $_SESSION['transaction_terminee'] = true;
        $_SESSION['montant_a_payer'] = $totalFinal;

        echo json_encode([
            'status' => 'ok',
            'id_transaction' => $idTransaction,
            'quantite_finale' => round($quantiteFinale, 3),
            'total_final' => round($totalFinal, 2),
            'date_heure' => date('Y-m-d H:i:s'),
            'message' => 'Délivrance terminée'
        ]);
        exit;
    }
}