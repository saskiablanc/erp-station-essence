<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Incident;

class IncidentController extends Controller
{
    public function getAll(): void
    {
        $this->requireAuth();
        $this->requireGerant();

        try {
            $model = new Incident();
            $this->json([
                'incidents' => $model->getAll(),
                'next_reference' => $model->getNextReference(),
            ]);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    public function create(): void
    {
        $this->requireAuth();
        $this->requireGerant();

        try {
            $model = new Incident();
            $incident = $model->create($this->body());
            $this->json([
                'success' => true,
                'incident' => $incident,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            $this->jsonError($e->getMessage(), 422);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }
}
