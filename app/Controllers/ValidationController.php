<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\ValidationJournee;

final class ValidationController extends Controller
{
    // GET /json/validation/journee?date=YYYY-MM-DD
    public function getJournee(): void
    {
        $this->requireGerant();
        $dateJour = $this->parseDate($_GET['date'] ?? '');
        try {
            $this->json((new ValidationJournee())->getSynthese($dateJour));
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // POST /json/validation/journee   body: { date_jour, type: 'transactions'|'incidents' }
    public function postJournee(): void
    {
        $this->requireGerant();
        $d        = $this->body();
        $dateJour = $this->parseDate((string)($d['date_jour'] ?? ''));
        $type     = trim((string)($d['type'] ?? ''));
        if (!in_array($type, ['transactions', 'incidents'], true)) {
            $this->jsonError("Type invalide — attendu 'transactions' ou 'incidents'", 400);
            return;
        }
        try {
            $this->json((new ValidationJournee())->validerJournee($dateJour, $type));
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // GET /json/validation/journees-validees
    public function getJourneesValidees(): void
    {
        $this->requireGerant();
        try {
            $this->json((new ValidationJournee())->getJourneesValidees());
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // GET /json/validation/transactions?date=YYYY-MM-DD
    public function getTransactionsJour(): void
    {
        $this->requireGerant();
        $dateJour = $this->parseDate($_GET['date'] ?? '');
        try {
            $this->json((new ValidationJournee())->getTransactionsJour($dateJour));
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // GET /json/validation/incidents?date=YYYY-MM-DD
    public function getIncidentsJour(): void
    {
        $this->requireGerant();
        $dateJour = $this->parseDate($_GET['date'] ?? '');
        try {
            $this->json((new ValidationJournee())->getIncidentsJour($dateJour));
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    // ── Helper ────────────────────────────────────────────
    private function parseDate(string $value): string
    {
        $value = trim($value);
        if ($value === '') return (new \DateTimeImmutable('now'))->format('Y-m-d');
        if (!$this->isValidDate($value)) {
            $this->jsonError('Format de date invalide (YYYY-MM-DD)', 400);
            exit;
        }
        return $value;
    }

    private function isValidDate(string $value): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return false;
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $value);
        return $date !== false && $date->format('Y-m-d') === $value;
    }
}