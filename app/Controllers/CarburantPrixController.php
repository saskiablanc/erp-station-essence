<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\CarburantPrix;

/**
 * CarburantPrixController — US12 + US13
 *
 * Routes :
 *   GET  /json/carburants/prix  → get()    lire prix + livraison_min
 *   POST /json/carburants/prix  → update() modifier prix + livraison_min
 */
class CarburantPrixController extends Controller
{
    /**
     * GET /json/carburants/prix
     * US12 critère 2 / US13 critère 2 : afficher les prix et livraisons minimales actuels
     */
    public function get(): void
    {
        // US12 critère 1 (ref US0) : gérant uniquement
        $this->requireAuth();
        $this->requireGerant();

        try {
            $model = new CarburantPrix();
            $this->json($model->getAll());
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    /**
     * POST /json/carburants/prix
     * US12 critère 3 : modifier les prix carburant
     * US13 critère 3 : modifier les livraisons minimales
     * US12 critère 4 / US13 critère 4 : validation des entrées
     */
    public function update(): void
    {
        $this->requireAuth();
        $this->requireGerant();

        $body = $this->body();

        // Body attendu : { "carburants": [{"id": 1, "prix_litre": 1.799, "livraison_min": 20}, ...] }
        if (empty($body['carburants']) || !is_array($body['carburants'])) {
            $this->jsonError('Données manquantes', 400);
        }

        // US12 critère 4 / US13 critère 4 : validation numérique de chaque champ
        foreach ($body['carburants'] as $c) {
            if (isset($c['prix_litre']) && (!is_numeric($c['prix_litre']) || (float)$c['prix_litre'] <= 0)) {
                // US12 critère 4 : message exact
                $this->jsonError('Erreur : Format Price', 422);
            }
            if (isset($c['livraison_min']) && (!is_numeric($c['livraison_min']) || (float)$c['livraison_min'] < 0)) {
                // US13 critère 4 : message exact
                $this->jsonError('Erreur : Format Values', 422);
            }
        }

        try {
            $model     = new CarburantPrix();
            $carburants = $model->updateAll($body['carburants']);
            $this->json(['success' => true, 'carburants' => $carburants]);
        } catch (\InvalidArgumentException $e) {
            $this->jsonError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }
}