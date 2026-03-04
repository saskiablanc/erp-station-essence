<?php
declare(strict_types=1);

use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\CaisseController;
use App\Controllers\PompeController;

if (session_status() === PHP_SESSION_NONE) {
    session_name('sae_r409_4e');
    session_start();
}

define('ROOT_PATH',    dirname(__DIR__));
define('APP_PATH',     ROOT_PATH . '/app');
define('CONFIG_PATH',  ROOT_PATH . '/config');
define('VIEW_PATH',    APP_PATH  . '/Views');
define('STORAGE_PATH', ROOT_PATH . '/storage');

// ── .env ─────────────────────────────────────────────────
$envPath = ROOT_PATH . '/.env';
if (is_file($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) continue;
        [$key, $value] = $parts;
        $key   = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if ($key !== '' && getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $_SERVER[$key] = $value;
        }
    }
}

require CONFIG_PATH . '/config.php';

// ── Autoload ──────────────────────────────────────────────
spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    if (!str_starts_with($class, $prefix)) return;
    $file = APP_PATH . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) require $file;
});

$router = new Router();

// ════════════════════════════════════════════════════════
//  Routes HTML
// ════════════════════════════════════════════════════════
$router->get('/',           [new AuthController(),   'showLogin']);
$router->get('connexion',   [new AuthController(),   'showLogin']);
$router->post('connexion',  [new AuthController(),   'login']);
$router->post('deconnexion',[new AuthController(),   'logout']);

$router->get('caisse', function () {
    if (empty($_SESSION['employe'])) {
        $_SESSION['employe'] = [
            'id_connexion' => 0,
            'identifiant'  => 'demo',
            'role'         => 'employe',
        ];
    }
    (new CaisseController())->index();
});

// ════════════════════════════════════════════════════════
//  Routes JSON
// ════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────
$router->get( 'json/auth/session',              [new AuthController(),   'jsonSession']);
$router->post('json/auth/logout',               [new AuthController(),   'jsonLogout']);

<<<<<<< HEAD
// ── Articles ─────────────────────────────────────────────
=======
$router->get( 'json/articles/random',           [new CaisseController(), 'getRandomArticle']);
>>>>>>> e69ea6b757f6ddb7c4bfb9894d91dea960e38596
$router->get( 'json/articles/{code}',           [new CaisseController(), 'getArticle']);

// ── Transactions produits ─────────────────────────────────
$router->post('json/transactions',              [new CaisseController(), 'creerTransaction']);
$router->get( 'json/transactions',              [new CaisseController(), 'getTransactions']);
$router->get( 'json/transactions/{id}',         [new CaisseController(), 'getTransaction']);
$router->post('json/transactions/{id}/annuler', [new CaisseController(), 'annulerTransaction']);

// Pompes ────────────────────────────────────
$router->get( 'json/pompes',                    [new PompeController(),  'getAll']);
$router->post('json/pompes/{id}/activer',       [new PompeController(),  'activer']);

// ════════════════════════════════════════════════════════
//  Dispatch
// ════════════════════════════════════════════════════════
$page = (string) ($_GET['page'] ?? '');
if ($page === '') {
    $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
    if ($base !== '' && $base !== '/' && str_starts_with($uri, $base)) {
        $uri = substr($uri, strlen($base));
    }
    $page = $uri;
}

if ($page === '/index.php' || $page === 'index.php') $page = '/';

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $page);