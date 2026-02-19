<?php
declare(strict_types=1);

namespace App\Core;

class Controller
{
    // ── Vues HTML (ton original intact) ───────────────────
    protected function render(string $view, array $data = []): void
    {
        if (!defined('VIEW_PATH')) {
            http_response_code(500);
            echo 'VIEW_PATH not defined.';
            return;
        }

        $viewPath = rtrim((string) VIEW_PATH, '/\\') . '/' . ltrim($view, '/');
        if (pathinfo($viewPath, PATHINFO_EXTENSION) === '') {
            $viewPath .= '.php';
        }

        if (!is_file($viewPath)) {
            http_response_code(500);
            echo 'View not found: ' . htmlspecialchars($viewPath);
            return;
        }

        extract($data, EXTR_OVERWRITE);
        require $viewPath;
    }

    protected function redirect(string $url): void
    {
        header('Location: ' . $url);
        exit;
    }

    // ── Réponses JSON ─────────────────────────────────────
    protected function json(mixed $data, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    protected function jsonError(string $message, int $code = 400): void
    {
        $this->json(['error' => true, 'message' => $message], $code);
    }

    // ── Body JSON (lu depuis le JS via fetch) ─────────────
    protected function body(): array
    {
        $raw = file_get_contents('php://input');
        return json_decode($raw ?: '{}', true) ?? [];
    }

    // ── Vérification session ──────────────────────────────
    protected function requireAuth(): array
    {
        if (empty($_SESSION['employe'])) {
            // Route JSON → réponse JSON
            if (str_contains($_SERVER['REQUEST_URI'] ?? '', '/json/')) {
                $this->jsonError('Non authentifié', 401);
            }
            // Route HTML → redirect
            $this->redirect('connexion');
        }
        return $_SESSION['employe'];
    }

    protected function requireGerant(): array
    {
        $emp = $this->requireAuth();
        if (($emp['role'] ?? '') !== 'gerant') {
            $this->jsonError('Accès réservé au gérant', 403);
        }
        return $emp;
    }
}
