<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Carburant;
use App\Models\Electricite;
use App\Models\Transaction;
use App\Models\TransactionEnergie;

/**
 * TransactionController - Gère l'US28
 * Consultation des informations courantes de l'énergie et de la transaction
 */
class TransactionController extends Controller
{
    private Carburant $carburantModel;
    private Electricite $electriciteModel;
    private Transaction $transactionModel;
    private TransactionEnergie $transactionEnergieModel;

    public function __construct()
    {
        $this->carburantModel = new Carburant();
        $this->electriciteModel = new Electricite();
        $this->transactionModel = new Transaction();
        $this->transactionEnergieModel = new TransactionEnergie();
    }

    /**
     * US28 - Afficher l'écran de transaction avec informations en temps réel
     * Critères 1, 2, 3, 4, 5, 6, 7
     */
    public function afficher(): void
    {
        if (isset($_GET['mode'])) {
            $mode = (string) $_GET['mode'];
            if ($mode === '24' || $mode === 'automate') {
                $_SESSION['type_automate'] = 24;
            } elseif ($mode === 'caisse' || $mode === 'guichet') {
                $_SESSION['type_automate'] = 0;
            }
        }

        if (isset($_GET['energie'])) {
            $energie = (string) $_GET['energie'];
            if ($energie === 'electricite') {
                $_SESSION['type_energie'] = 'electricite';
                unset($_SESSION['id_carburant_selectionne']);
            } elseif ($energie === 'carburant' || $energie === 'essence') {
                $_SESSION['type_energie'] = 'carburant';
                unset($_SESSION['id_electricite_selectionne']);
            }

            unset(
                $_SESSION['pistolet_decroche'],
                $_SESSION['delivrance_en_cours'],
                $_SESSION['transaction_terminee'],
                $_SESSION['id_transaction_courante'],
                $_SESSION['id_transaction_energie'],
                $_SESSION['quantite_actuelle'],
                $_SESSION['temps_charge_secondes']
            );
        }

        $energieType = $_SESSION['type_energie'] ?? 'carburant';
        if ($energieType !== 'electricite') {
            $energieType = 'carburant';
        }
        $_SESSION['type_energie'] = $energieType;

        $carburants = [];
        $electricites = [];
        $idCarburant = null;
        $idElectricite = null;
        $electricite = null;
        $dbError = false;

        try {
            if ($energieType === 'electricite') {
                $electricites = $this->electriciteModel->getTous();
                $idElectricite = $_SESSION['id_electricite_selectionne'] ?? null;
                if ($idElectricite) {
                    $electricite = $this->electriciteModel->getById((int) $idElectricite);
                    if (!$electricite) {
                        unset($_SESSION['id_electricite_selectionne']);
                        $idElectricite = null;
                    }
                }

                if (!$electricite) {
                    $electricite = [
                        'type_charge' => 'Aucune sélection',
                        'prix_kwh' => 0,
                        'id_energie' => 0,
                    ];
                }

                $carburant = [
                    'libelle' => ucfirst($electricite['type_charge']),
                    'prix_litre' => (float) $electricite['prix_kwh'],
                    'stock_litre' => 0,
                    'id_energie' => (int) $electricite['id_energie'],
                ];

                $prixDisponible = $idElectricite && (float) $electricite['prix_kwh'] > 0;
                $stockDisponible = true;
            } else {
                $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
                $carburants = $this->carburantModel->getTous();

                $carburant = null;
                if ($idCarburant) {
                    $carburant = $this->carburantModel->getById((int)$idCarburant);
                    if (!$carburant) {
                        unset($_SESSION['id_carburant_selectionne']);
                        $idCarburant = null;
                    }
                }

                if (!$carburant) {
                    $carburant = [
                        'libelle' => 'Aucune sélection',
                        'prix_litre' => 0,
                        'stock_litre' => 0,
                        'id_energie' => 0,
                    ];
                }

                $prixDisponible = $idCarburant && isset($carburant['prix_litre']) && $carburant['prix_litre'] > 0;
                $stockDisponible = $idCarburant && isset($carburant['stock_litre']) && $carburant['stock_litre'] > 0;
            }
        } catch (\RuntimeException $e) {
            $dbError = true;
            $carburants = [];
            $electricites = [];
            $idCarburant = null;
            $idElectricite = null;
            $electricite = [
                'type_charge' => 'Aucune sélection',
                'prix_kwh' => 0,
                'id_energie' => 0,
            ];
            $carburant = [
                'libelle' => 'Aucune sélection',
                'prix_litre' => 0,
                'stock_litre' => 0,
                'id_energie' => 0,
            ];
            $prixDisponible = false;
            $stockDisponible = false;
        }

        $energieLabel = $energieType === 'electricite'
            ? ('Électricité - ' . ($electricite['type_charge'] ?? ''))
            : ('Carburant - ' . ($carburant['libelle'] ?? ''));

        // Type d'automate (24 = avec paiement)
        $typeAutomate = $_SESSION['type_automate'] ?? 24;
        
        $pistoletDecroche = !empty($_SESSION['pistolet_decroche']);
        unset($_SESSION['pistolet_decroche']);

        // Passer les données à la vue
        $data = [
            'carburant' => $carburant,
            'carburants' => $carburants,
            'carburant_selectionne' => $idCarburant,
            'electricites' => $electricites,
            'electricite_selectionne' => $idElectricite,
            'prix_disponible' => $prixDisponible,
            'stock_disponible' => $stockDisponible,
            'type_automate' => $typeAutomate,
            'montant_initial' => $_SESSION['montant_demande'] ?? 0,
            'quantite_demandee' => $_SESSION['quantite_demandee'] ?? 0,
            'pistolet_decroche' => $pistoletDecroche,
            'energie_type' => $energieType,
            'energie_label' => $energieLabel,
            'electricite' => $electricite,
            'db_error' => $dbError,
        ];

        extract($data, EXTR_SKIP);
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

        $energieType = $_SESSION['type_energie'] ?? 'carburant';

        if ($energieType === 'electricite') {
            $idElectricite = $_SESSION['id_electricite_selectionne'] ?? null;
            if (!$idElectricite) {
                echo json_encode([
                    'status' => 'erreur',
                    'message' => 'Aucun type de charge sélectionné'
                ]);
                exit;
            }

            $electricite = $this->electriciteModel->getById((int) $idElectricite);
            if (!$electricite) {
                echo json_encode([
                    'status' => 'erreur',
                    'message' => 'Type de charge introuvable'
                ]);
                exit;
            }

        } else {
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

        }

        // Initialiser la session (la transaction sera enregistrée au raccrochage)
        unset(
            $_SESSION['id_transaction_courante'],
            $_SESSION['id_transaction_energie'],
            $_SESSION['quantite_finale'],
            $_SESSION['total_final'],
            $_SESSION['temps_charge_final']
        );
        $_SESSION['delivrance_en_cours'] = true;
        $_SESSION['transaction_terminee'] = false;
        $_SESSION['transaction_enregistree'] = false;
        $_SESSION['quantite_actuelle'] = 0.0;
        $_SESSION['temps_charge_secondes'] = 0.0;

        echo json_encode([
            'status' => 'ok',
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
        $tempsCharge = isset($_POST['temps_charge']) ? (string) $_POST['temps_charge'] : null;
        $tempsSecondes = (float)($_POST['temps_secondes'] ?? 0);
        
        if (!isset($_SESSION['delivrance_en_cours']) || !$_SESSION['delivrance_en_cours']) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Aucune délivrance en cours'
            ]);
            exit;
        }

        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
        $idElectricite = $_SESSION['id_electricite_selectionne'] ?? null;
        $energieType = $_SESSION['type_energie'] ?? 'carburant';

        if ((!$idCarburant && !$idElectricite)) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Session invalide'
            ]);
            exit;
        }

        $_SESSION['quantite_actuelle'] = $quantite;
        if ($energieType === 'electricite') {
            $_SESSION['temps_charge_secondes'] = $tempsSecondes;
        }

        // Calculer le total
        if ($energieType === 'electricite') {
            $electricite = $this->electriciteModel->getById((int)$idElectricite);
            $total = $quantite * (float) ($electricite['prix_kwh'] ?? 0);
        } else {
            $carburant = $this->carburantModel->getById((int)$idCarburant);
            $total = $quantite * (float)$carburant['prix_litre'];
        }

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

        if (isset($_POST['quantite'])) {
            $_SESSION['quantite_actuelle'] = (float) $_POST['quantite'];
        }
        if (isset($_POST['temps_secondes'])) {
            $_SESSION['temps_charge_secondes'] = (float) $_POST['temps_secondes'];
        }

        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
        $idElectricite = $_SESSION['id_electricite_selectionne'] ?? null;
        $energieType = $_SESSION['type_energie'] ?? 'carburant';
        $quantiteFinale = $_SESSION['quantite_actuelle'] ?? 0.0;
        $tempsChargeSecondes = $_SESSION['temps_charge_secondes'] ?? 0.0;

        if ((!$idCarburant && !$idElectricite)) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Session invalide'
            ]);
            exit;
        }

        if ($energieType === 'electricite') {
            $electricite = $this->electriciteModel->getById((int) $idElectricite);
            $prixUnitaire = (float) ($electricite['prix_kwh'] ?? 0);
            $totalFinal = $quantiteFinale * $prixUnitaire;
        } else {
            // Récupérer les infos du carburant
            $carburant = $this->carburantModel->getById((int)$idCarburant);
            $prixLitre = (float)$carburant['prix_litre'];
            $totalFinal = $quantiteFinale * $prixLitre;
        }

        // Stocker les infos finales en session
        $_SESSION['delivrance_en_cours'] = false;
        $_SESSION['transaction_terminee'] = true;
        $_SESSION['transaction_enregistree'] = false;
        $_SESSION['montant_a_payer'] = $totalFinal;
        $_SESSION['quantite_finale'] = $quantiteFinale;

        $tempsCharge = $_POST['temps_charge'] ?? sprintf(
            '%02d:%02d:%02d',
            (int) floor($tempsChargeSecondes / 3600),
            (int) floor(($tempsChargeSecondes % 3600) / 60),
            (int) floor($tempsChargeSecondes % 60)
        );
        $_SESSION['temps_charge_final'] = $tempsCharge;
        $_SESSION['total_final'] = round($totalFinal, 2);

        echo json_encode([
            'status' => 'ok',
            'id_transaction' => null,
            'quantite_finale' => round($quantiteFinale, 3),
            'total_final' => round($totalFinal, 2),
            'temps_charge' => $energieType === 'electricite' ? $tempsCharge : null,
            'date_heure' => date('Y-m-d H:i:s'),
            'message' => 'Délivrance terminée'
        ]);
        exit;
    }

    /**
     * Enregistrer la transaction en base au raccrochage du pistolet
     */
    public function finaliserTransaction(): void
    {
        header('Content-Type: application/json');

        if (empty($_SESSION['transaction_terminee'])) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Aucune transaction à enregistrer'
            ]);
            exit;
        }

        if (!empty($_SESSION['transaction_enregistree'])) {
            echo json_encode([
                'status' => 'ok',
                'id_transaction' => $_SESSION['id_transaction_courante'] ?? null,
                'message' => 'Transaction déjà enregistrée'
            ]);
            exit;
        }

        $energieType = $_SESSION['type_energie'] ?? 'carburant';
        $idCarburant = $_SESSION['id_carburant_selectionne'] ?? null;
        $idElectricite = $_SESSION['id_electricite_selectionne'] ?? null;
        $quantiteFinale = (float) ($_SESSION['quantite_finale'] ?? 0);
        $totalFinal = (float) ($_SESSION['total_final'] ?? 0);
        $tempsCharge = (string) ($_SESSION['temps_charge_final'] ?? '00:00:00');

        if ((!$idCarburant && !$idElectricite) || $quantiteFinale <= 0) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Données de transaction invalides'
            ]);
            exit;
        }

        if ($energieType === 'electricite') {
            $electricite = $this->electriciteModel->getById((int) $idElectricite);
            if (!$electricite) {
                echo json_encode([
                    'status' => 'erreur',
                    'message' => 'Type de charge introuvable'
                ]);
                exit;
            }
            $idEnergie = (int) $electricite['id_energie'];
            if ($totalFinal <= 0) {
                $totalFinal = $quantiteFinale * (float) ($electricite['prix_kwh'] ?? 0);
            }
        } else {
            $carburant = $this->carburantModel->getById((int) $idCarburant);
            if (!$carburant) {
                echo json_encode([
                    'status' => 'erreur',
                    'message' => 'Carburant introuvable'
                ]);
                exit;
            }
            $idEnergie = (int) $carburant['id_energie'];
            if ($totalFinal <= 0) {
                $totalFinal = $quantiteFinale * (float) $carburant['prix_litre'];
            }
        }

        $idTransaction = $this->transactionModel->creer(round($totalFinal, 2));
        if (!$idTransaction) {
            echo json_encode([
                'status' => 'erreur',
                'message' => 'Erreur création transaction'
            ]);
            exit;
        }

        $idTransactionEnergie = $this->transactionEnergieModel->creer(
            $idTransaction,
            $idEnergie,
            $quantiteFinale,
            $energieType === 'electricite' ? $tempsCharge : null
        );

        if ($energieType !== 'electricite') {
            $this->carburantModel->diminuerStock((int) $idCarburant, $quantiteFinale);
        }

        $_SESSION['id_transaction_courante'] = $idTransaction;
        $_SESSION['id_transaction_energie'] = $idTransactionEnergie;
        $_SESSION['transaction_enregistree'] = true;
        $_SESSION['montant_a_payer'] = $totalFinal;

        $transaction = $this->transactionModel->getById($idTransaction);
        $dateHeure = $transaction['date_heure'] ?? date('Y-m-d H:i:s');

        echo json_encode([
            'status' => 'ok',
            'id_transaction' => $idTransaction,
            'date_heure' => $dateHeure,
            'total_final' => round($totalFinal, 2)
        ]);
        exit;
    }
}
