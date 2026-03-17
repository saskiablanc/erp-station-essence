<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\CceParams;

/**
 * CceParamsController — US14 Modification Paramètres CCE
 *
 * Routes :
 *   GET  /json/cce/params              → get()          lire tout (montant_min + bonus)
 *   POST /json/cce/params              → updateMin()    modifier montant_min
 *   GET  /json/cce/bonus               → getBonusList() lire les tranches
 *   POST /json/cce/bonus               → addBonus()     ajouter une tranche
 *   POST /json/cce/bonus/{id}          → updateBonus()  modifier une tranche
 *   POST /json/cce/bonus/{id}/suppr    → deleteBonus()  supprimer une tranche
 */
class CceParamsController extends Controller
{
    /**
     * GET /json/cce/params
     * US14 critère 2 : retourner montant_min + toutes les tranches bonus
     */
    public function get(): void
    {
        // US14 critère 1 (ref US0) : gérant uniquement
        $this->requireAuth();
        $this->requireGerant();

        try {
            $model  = new CceParams();
            $params = $model->getMontantMin();
            $bonus  = $model->getBonusList();

            if (!$params) {
                $this->jsonError('Paramètres CCE introuvables', 404);
            }

            $this->json([
                'montant_min' => $params['montant_min'],
                'bonus'       => $bonus,
            ]);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    /**
     * POST /json/cce/params
     * US14 critère 3 : modifier le montant minimum
     * US14 critères 4/5/6 : validation numérique
     */
    public function updateMin(): void
    {
        $this->requireAuth();
        $this->requireGerant();

        $body = $this->body();

        // US14 critère 4/5 : vérification numérique
        if (!isset($body['montant_min']) || !is_numeric($body['montant_min'])) {
            // US14 critère 5 : message exact
            $this->jsonError('erreur input de montant Min: veuillez entrer une valeur numérique', 400);
        }

        try {
            $model  = new CceParams();
            $params = $model->updateMontantMin((float) $body['montant_min']);
            $this->json(['success' => true, 'montant_min' => $params['montant_min']]);
        } catch (\InvalidArgumentException $e) {
            // US14 critère 6 : "Erreur : Format Minimum Montant"
            $this->jsonError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    /**
     * POST /json/cce/bonus
     * US14 : ajouter une nouvelle tranche de bonus
     */
    public function addBonus(): void
    {
        $this->requireAuth();
        $this->requireGerant();

        $body = $this->body();

        // US14 critère 4/5 : vérification numérique
        if (!isset($body['tranche']) || !is_numeric($body['tranche']) ||
            !isset($body['montant_bonus']) || !is_numeric($body['montant_bonus'])) {
            $this->jsonError('erreur input de Bonus: veuillez entrer une valeur numérique', 400);
        }

        try {
            $model = new CceParams();
            $bonus = $model->addBonus((float) $body['tranche'], (float) $body['montant_bonus']);
            $this->json(['success' => true, 'bonus' => $bonus], 201);
        } catch (\InvalidArgumentException $e) {
            // US14 critère 6 : "Erreur : Format Bonus"
            $this->jsonError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    /**
     * POST /json/cce/bonus/{id}
     * US14 critère 3 : modifier une tranche bonus existante
     */
    public function updateBonus(string $id): void
    {
        $this->requireAuth();
        $this->requireGerant();

        $idBonus = (int) $id;
        $body    = $this->body();

        if (!isset($body['tranche']) || !is_numeric($body['tranche']) ||
            !isset($body['montant_bonus']) || !is_numeric($body['montant_bonus'])) {
            $this->jsonError('erreur input de Bonus: veuillez entrer une valeur numérique', 400);
        }

        try {
            $model = new CceParams();
            $model->updateBonus($idBonus, (float) $body['tranche'], (float) $body['montant_bonus']);
            $this->json(['success' => true]);
        } catch (\InvalidArgumentException $e) {
            $this->jsonError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    /**
     * POST /json/cce/bonus/{id}/suppr
     * US14 : supprimer une tranche bonus
     */
    public function deleteBonus(string $id): void
    {
        $this->requireAuth();
        $this->requireGerant();

        try {
            $model = new CceParams();
            $model->deleteBonus((int) $id);
            $this->json(['success' => true]);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }
}