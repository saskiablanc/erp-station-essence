<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\HorairesBoutique;

class HorairesBoutiqueController extends Controller
{
    public function get(): void
    {
        $this->requireAuth();
        $this->requireGerant();

        try {
            $model = new HorairesBoutique();
            $this->json($model->getAll());
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    public function update(): void
    {
        $this->requireAuth();
        $this->requireGerant();

        $body = $this->body();
        if (empty($body['horaires']) || !is_array($body['horaires'])) {
            $this->jsonError('Données horaires manquantes', 400);
        }

        try {
            $model = new HorairesBoutique();
            $horaires = $model->updateAll($body['horaires']);
            $this->json([
                'success' => true,
                'horaires' => $horaires,
            ]);
        } catch (\InvalidArgumentException $e) {
            $this->jsonError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }
}
