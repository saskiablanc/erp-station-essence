<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;

/**
 * SimulatorController
 *
 * Sert la vue du simulateur physique.
 * Pas d'auth requise — c'est un outil de test/démo.
 * Le simulateur appelle les mêmes routes JSON que la caisse.
 */
final class SimulatorController extends Controller
{
    public function index(): void
    {
        // On injecte une session fictive si absente pour que les routes JSON marchent
        if (empty($_SESSION['employe'])) {
            $_SESSION['employe'] = [
                'id_connexion' => 0,
                'identifiant'  => 'simulateur',
                'role'         => 'gerant',  // gérant pour avoir accès à tout
            ];
        }

        $this->render('simulator');
    }
}