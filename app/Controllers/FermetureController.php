<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Fermeture;

class FermetureController extends Controller
{
    public function all(): void
    {
        $this->requireGerant();
        $model = new Fermeture();

        try {
            $rows = $model->all();
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        $this->json($rows);
    }

    public function create(): void
    {
        $this->requireGerant();
        $model = new Fermeture();
        $payload = $this->body();

        try {
            $row = $model->create($payload);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        $this->json([
            'success' => true,
            'fermeture' => $row,
        ], 201);
    }

    public function delete(string $id): void
    {
        $this->requireGerant();
        $model = new Fermeture();
        $idFermeture = (int) $id;

        try {
            $deleted = $model->delete($idFermeture);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        if (!$deleted) {
            $this->jsonError("Fermeture #{$idFermeture} introuvable", 404);
        }

        $this->json([
            'success' => true,
            'id_fermeture' => $idFermeture,
        ]);
    }
}
