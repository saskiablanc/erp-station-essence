<?php
declare(strict_types=1);

namespace App\Core;

class Controller
{
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
            echo 'View not found.';
            return;
        }

        if (!empty($data)) {
            extract($data, EXTR_SKIP);
        }

        require $viewPath;
    }

    protected function redirect(string $url): void
    {
        header('Location: ' . $url);
        exit;
    }
}
