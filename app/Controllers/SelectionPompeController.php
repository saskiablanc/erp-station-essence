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
            $_SESSION['erreur_selection'] = 'Veuillez sélectionner un carburant';
            $this->redirect($this->buildUrl('transaction'));
            return;
        }

        // Vérifier que le carburant existe
        $carburant = $this->carburantModel->getById((int)$idCarburant);

        if (!$carburant) {
            $_SESSION['erreur_selection'] = 'Carburant invalide';
            $this->redirect($this->buildUrl('transaction'));
            return;
        }

        // Stocker en session
        $_SESSION['id_carburant_selectionne'] = (int)$idCarburant;
        $_SESSION['carburant_libelle'] = $carburant['libelle'];
        $_SESSION['type_energie'] = 'carburant';
        $_SESSION['pistolet_decroche'] = true;
        unset($_SESSION['id_electricite_selectionne']);

        // Rediriger vers la page de transaction (US28)
        $this->redirect($this->buildUrl('transaction'));
    }

    private function buildUrl(string $page, array $params = []): string
    {
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
        $url = ($base !== '' ? $base : '') . '/index.php?page=' . $page;
        if ($params) {
            $url .= '&' . http_build_query($params);
        }
        return $url;
    }
}
