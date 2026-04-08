<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Cce;

class CceController extends Controller
{
    private function buildDuplicateResponse(array $existing): array
    {
        $duplicateEmail = (bool) ($existing['duplicate_email'] ?? false);
        $duplicateTelephone = (bool) ($existing['duplicate_telephone'] ?? false);

        $message = 'Coordonnées déjà utilisées';
        if ($duplicateEmail && $duplicateTelephone) {
            $message = "L'adresse mail et le numéro de téléphone sont déjà utilisés";
        } elseif ($duplicateEmail) {
            $message = "L'adresse mail est déjà utilisée";
        } elseif ($duplicateTelephone) {
            $message = 'Le numéro de téléphone est déjà utilisé';
        }

        return [
            'error' => true,
            'duplicate' => true,
            'message' => $message,
            'client' => $existing,
            'conflicts' => [
                'email' => $duplicateEmail,
                'telephone' => $duplicateTelephone,
            ],
        ];
    }

    public function checkDuplicate(): void
    {
        $this->requireAuth();
        $model = new Cce();
        $body = $this->body();

        try {
            $existing = $model->findDuplicateClient($body);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        if ($existing) {
            $this->json($this->buildDuplicateResponse($existing), 409);
        }

        $this->json([
            'success' => true,
            'duplicate' => false,
        ]);
    }

    public function all(): void
    {
        $this->requireAuth();
        $model = new Cce();
        $this->json($model->findAllForScan());
    }

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

    public function transactions(string $id): void
    {
        $this->requireAuth();
        $idCarte = (int) $id;
        if ($idCarte <= 0) {
            $this->jsonError('Identifiant CCE invalide', 400);
        }

        $model = new Cce();
        try {
            $payload = $model->findTransactionCceForCard($idCarte);
        } catch (\Throwable $e) {
            $message = $e->getMessage();
            $status = str_contains(strtolower($message), 'introuvable') ? 404 : 400;
            $this->jsonError($message, $status);
        }

        $this->json($payload);
    }

    public function create(): void
    {
        $this->requireAuth();
        $model = new Cce();
        $body = $this->body();

        try {
            $existing = $model->findDuplicateClient($body);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        if ($existing) {
            $this->json($this->buildDuplicateResponse($existing), 409);
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

    public function debiter(string $id): void
    {
        $this->requireAuth();
        $body = $this->body();
        $montant = (float) ($body['montant'] ?? 0);
        $idTransactions = $body['id_transactions'] ?? [];
        if (!is_array($idTransactions)) {
            $idTransactions = [];
        }
        $model = new Cce();

        try {
            $cce = $model->debiter((int) $id, $montant, $idTransactions);
        } catch (\Throwable $e) {
            $code = str_contains(strtolower($e->getMessage()), 'insuffisant') ? 409 : 400;
            $this->jsonError($e->getMessage(), $code);
        }

        if (!$cce) {
            $this->jsonError("CCE #{$id} introuvable", 404);
        }

        $this->json([
            'success' => true,
            'cce' => $cce,
        ]);
    }

    public function verifyCode(string $id): void
    {
        $this->requireAuth();
        $idCarte = (int) $id;
        if ($idCarte <= 0) {
            $this->jsonError('Identifiant CCE invalide', 400);
        }

        $body = $this->body();
        $codeSecret = $body['code_secret'] ?? '';
        $model = new Cce();

        try {
            $valid = $model->verifyCodeSecret($idCarte, $codeSecret);
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 400);
        }

        if ($valid === null) {
            $this->jsonError("CCE #{$idCarte} introuvable", 404);
        }

        $this->json([
            'success' => true,
            'valid' => (bool) $valid,
        ]);
    }
}
