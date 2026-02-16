<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Carburant;

/**
 * SelectionPompeController - Permet au client de choisir son carburant
 * Cette étape précède l'US28 (affichage de la transaction)
 */
class SelectionPompeController extends Controller
{
    private Carburant $carburantModel;

    public function __construct()
    {
        $this->carburantModel = new Carburant();
    }

    /**
     * Afficher la page de sélection de pompe/carburant
     */
    public function index(): void
    {
        // Récupérer tous les carburants disponibles
        $carburants = $this->carburantModel->getTous();

        require VIEW_PATH . '/selection_pompe.php';
    }

    /**
     * Traiter la sélection d'une pompe/carburant
     */
    public function selectionner(): void
    {
        $idCarburant = $_POST['id_carburant'] ?? null;

        if (!$idCarburant) {
            $_SESSION['erreur'] = 'Veuillez sélectionner un carburant';
            header('Location: /selection-pompe');
            exit;
        }

        // Vérifier que le carburant existe
        $carburant = $this->carburantModel->getById((int)$idCarburant);

        if (!$carburant) {
            $_SESSION['erreur'] = 'Carburant invalide';
            header('Location: /selection-pompe');
            exit;
        }

        // Stocker en session
        $_SESSION['id_carburant_selectionne'] = (int)$idCarburant;
        $_SESSION['carburant_libelle'] = $carburant['libelle'];

        // Rediriger vers la page de transaction (US28)
        header('Location: /transaction');
        exit;
    }
}