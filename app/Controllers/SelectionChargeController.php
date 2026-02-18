<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Electricite;

/**
 * SelectionChargeController - Permet au client de choisir un type de charge
 */
class SelectionChargeController extends Controller
{
    private Electricite $electriciteModel;

    public function __construct()
    {
        $this->electriciteModel = new Electricite();
    }

    public function selectionner(): void
    {
        $idElectricite = $_POST['id_electricite'] ?? null;

        if (!$idElectricite) {
            $_SESSION['erreur_selection'] = 'Veuillez sélectionner un type de charge';
            $this->redirect($this->buildUrl('transaction'));
            return;
        }

        $electricite = $this->electriciteModel->getById((int) $idElectricite);

        if (!$electricite) {
            $_SESSION['erreur_selection'] = 'Type de charge invalide';
            $this->redirect($this->buildUrl('transaction'));
            return;
        }

        $_SESSION['type_energie'] = 'electricite';
        $_SESSION['id_electricite_selectionne'] = (int) $idElectricite;
        $_SESSION['pistolet_decroche'] = true;

        unset($_SESSION['id_carburant_selectionne']);

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
