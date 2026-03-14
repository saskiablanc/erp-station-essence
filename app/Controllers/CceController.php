<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Cce;

class CceController extends Controller
{
    public function latest(): void
    {
        $this->requireAuth();
        $model = new Cce();
        $cce = $model->findLatestOverview();

        if (!$cce) {
            $this->jsonError('Aucune carte CCE enregistrée', 404);
        }

        $this->json($cce);
    }

    public function get(string $id): void
    {
        $this->requireAuth();
        $model = new Cce();
        $cce = $model->findOverviewById((int) $id);

        if (!$cce) {
            $this->jsonError("CCE #{$id} introuvable", 404);
        }

        $this->json($cce);
    }

    public function create(): void
    {
        $this->requireAuth();
        $model = new Cce();
        $body = $this->body();
        $forcerCreation = !empty($body['forcer_creation']);

        if (!$forcerCreation) {
            try {
                $existing = $model->findDuplicateClient($body);
            } catch (\Throwable $e) {
                $this->jsonError($e->getMessage(), 400);
            }

            if ($existing) {
                $this->json([
                    'error' => true,
                    'duplicate' => true,
                    'message' => 'Les informations du clients sont déjà enregistrées',
                    'client' => $existing,
                ], 409);
            }
        }

        try {
            $cce = $model->create($body);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        $this->json([
            'success' => true,
            'cce' => $cce,
        ], 201);
    }

    public function recharger(string $id): void
    {
        $this->requireAuth();
        $body = $this->body();
        $montant = (float) ($body['montant'] ?? 0);
        $model = new Cce();

        try {
            $cce = $model->recharger((int) $id, $montant);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        if (!$cce) {
            $this->jsonError("CCE #{$id} introuvable", 404);
        }

        $this->json([
            'success' => true,
            'cce' => $cce,
        ]);
    }
}
