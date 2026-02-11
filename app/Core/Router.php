<?php
declare(strict_types=1);

namespace App\Core;

final class Router
{
    private array $routes = [];

    public function get(string $pattern, callable $handler): void
    {
        $this->addRoute('GET', $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->addRoute('POST', $pattern, $handler);
    }

    private function addRoute(string $method, string $pattern, callable $handler): void
    {
        $method = strtoupper($method);
        $pattern = $this->normalizePattern($pattern);

        $this->routes[$method][] = [
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function dispatch(string $method, string $path): void
    {
        $method = strtoupper($method);
        $path = $this->normalizePath($path);

        foreach ($this->routes[$method] ?? [] as $route) {
            $params = [];
            $regex = $this->buildRegex($route['pattern'], $params);

            if (preg_match($regex, $path, $matches)) {
                $values = [];
                foreach ($params as $index => $name) {
                    $values[] = $matches[$index + 1] ?? null;
                }

                call_user_func_array($route['handler'], $values);
                return;
            }
        }

        http_response_code(404);
        $this->renderNotFound($path);
    }

    private function normalizePattern(string $pattern): string
    {
        $pattern = trim($pattern);
        if ($pattern === '' || $pattern === '/') {
            return '/';
        }

        return trim($pattern, '/');
    }

    private function normalizePath(string $path): string
    {
        $path = trim($path);
        if ($path === '') {
            return '/';
        }

        $path = explode('?', $path, 2)[0];
        $path = trim($path, '/');

        return $path === '' ? '/' : $path;
    }

    private function buildRegex(string $pattern, array &$params): string
    {
        if ($pattern === '/') {
            return '#^/$#';
        }

        $params = [];
        $regex = preg_replace_callback(
            '#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#',
            function (array $matches) use (&$params): string {
                $params[] = $matches[1];
                return '([^/]+)';
            },
            $pattern
        );

        return '#^' . $regex . '$#';
    }

    private function renderNotFound(string $path): void
    {
        if (defined('VIEW_PATH')) {
            $view = rtrim((string) VIEW_PATH, '/\\') . '/errors/404.php';
            if (is_file($view)) {
                $safePath = htmlspecialchars($path, ENT_QUOTES, 'UTF-8');
                require $view;
                return;
            }
        }

        $safePath = htmlspecialchars($path, ENT_QUOTES, 'UTF-8');
        echo '404 - Page not found: ' . $safePath;
    }
}
