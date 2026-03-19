<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\ValidationJournee;

final class ValidationController extends Controller
{
    public function getJournee(): void
    {
        $this->requireGerant();

        $dateJour = trim((string) ($_GET['date'] ?? ''));
        if ($dateJour === '') {
            $dateJour = (new \DateTimeImmutable('now'))->format('Y-m-d');
        }

        if (!$this->isValidDate($dateJour)) {
            $this->jsonError('Format de date invalide (YYYY-MM-DD)', 400);
        }

        try {
            $model = new ValidationJournee();
            $this->json($model->getSynthese($dateJour));
        } catch (\Throwable $e) {
            $this->jsonError($e->getMessage(), 500);
        }
    }

    private function isValidDate(string $value): bool
    {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return false;
        }

        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $value);
        return $date !== false && $date->format('Y-m-d') === $value;
    }
}

