<?php
declare(strict_types=1);

use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\CaisseController;
use App\Controllers\CceController;
use App\Controllers\PompeController;
use App\Controllers\ReapproController;
use App\Controllers\CceParamsController;
use App\Controllers\CarburantPrixController;
use App\Controllers\HorairesBoutiqueController;
use App\Controllers\IncidentController;


$uri = $_SERVER['REQUEST_URI'] ?? '';
if (str_contains($uri, '/json/')) {
    ini_set('display_errors', '0');
}

if (session_status() === PHP_SESSION_NONE) {
    session_name('sae_r409_4e');
    session_start();
}

define('ROOT_PATH',    dirname(__DIR__));
define('APP_PATH',     ROOT_PATH . '/app');
define('CONFIG_PATH',  ROOT_PATH . '/config');
define('VIEW_PATH',    APP_PATH  . '/Views');
define('STORAGE_PATH', ROOT_PATH . '/storage');

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
        $_SESSION['employe'] = ['id_connexion' => 0, 'identifiant' => 'demo', 'role' => 'employe'];
    }
    (new CaisseController())->index();
});

$router->get('gerant', function () {
    (new CaisseController())->gerant();
});

// ════════════════════════════════════════════════════════
//  Routes JSON
// ════════════════════════════════════════════════════════

$router->get( 'json/auth/session',              [new AuthController(),   'jsonSession']);
$router->post('json/auth/logout',               [new AuthController(),   'jsonLogout']);

$router->get( 'json/articles/random',           [new CaisseController(), 'getRandomArticle']);
$router->get( 'json/articles',                  [new CaisseController(), 'getArticles']);
$router->get( 'json/articles/{code}',           [new CaisseController(), 'getArticle']);
$router->get( 'json/stock',                     [new CaisseController(), 'getStock']);

$router->post('json/transactions',              [new CaisseController(), 'creerTransaction']);
$router->get( 'json/transactions',              [new CaisseController(), 'getTransactions']);
$router->get( 'json/transactions/{id}',         [new CaisseController(), 'getTransaction']);
$router->post('json/transactions/{id}/annuler', [new CaisseController(), 'annulerTransaction']);
$router->post('json/recus',                     [new CaisseController(), 'creerRecus']);

$router->get( 'json/pompes',                    [new PompeController(),  'getAll']);
$router->post('json/pompes/{id}/activer',       [new PompeController(),  'activer']);
$router->post('json/pompes/{id}/demarrer',      [new PompeController(),  'demarrer']);
$router->post('json/pompes/{id}/terminer',      [new PompeController(),  'terminer']);
$router->post('json/pompes/{id}/encaisser',     [new PompeController(),  'encaisser']);

// ── Prix carburant — Sprint 6 (US12 + US13) ──────────────
$router->get( 'json/carburants/prix',  [new CarburantPrixController(), 'get']);
$router->post('json/carburants/prix',  [new CarburantPrixController(), 'update']);

// ── Fiches incident — Sprint 6 (US11) ─────────────────────
$router->get( 'json/incidents',        [new IncidentController(), 'getAll']);
$router->post('json/incidents',        [new IncidentController(), 'create']);
 
// ── CCE  ────────
$router->get( 'json/cce',                       [new CceController(),       'all']);
$router->get( 'json/cce/latest',                [new CceController(),       'latest']);
// Sprint 6 US14 
$router->get( 'json/cce/params',                [new CceParamsController(), 'get']);
$router->post('json/cce/params',                [new CceParamsController(), 'updateMin']);
// Sprint 6 US14 
$router->post('json/cce/bonus',                 [new CceParamsController(), 'addBonus']);
$router->post('json/cce/bonus/{id}/suppr',      [new CceParamsController(), 'deleteBonus']);
$router->post('json/cce/bonus/{id}',            [new CceParamsController(), 'updateBonus']);
// Routes CCE dynamiques 
$router->get( 'json/cce/{id}/transactions',     [new CceController(),       'transactions']);
$router->get( 'json/cce/{id}',                  [new CceController(),       'get']);
$router->post('json/cce',                       [new CceController(),       'create']);
$router->post('json/cce/{id}/recharger',        [new CceController(),       'recharger']);
$router->post('json/cce/{id}/debiter',          [new CceController(),       'debiter']);

// ── Réapprovisionnement — Sprint 4 ───────────────────────
$router->get( 'json/reappros/articles',              [new ReapproController(), 'getArticles']);
$router->get( 'json/reappros/valeurs-defaut',        [new ReapproController(), 'getValeursDefaut']);
$router->post('json/reappros/valeurs-defaut-type',   [new ReapproController(), 'updateValeursDefautType']);
$router->post('json/reappros/valeurs-defaut/{id}',   [new ReapproController(), 'updateValeurDefaut']);
$router->get( 'json/reappros',                       [new ReapproController(), 'getAll']);
$router->post('json/reappros',                       [new ReapproController(), 'creerManuel']);
$router->get( 'json/reappros/{id}',                  [new ReapproController(), 'getById']);
$router->post('json/reappros/{id}/statut',           [new ReapproController(), 'updateStatut']);
$router->post('json/reappros/{id}/annuler',          [new ReapproController(), 'annuler']);

// ── Horaires boutique — Sprint 6 / US15 ──────────────────
$router->get( 'json/horaires/boutique',              [new HorairesBoutiqueController(), 'get']);
$router->post('json/horaires/boutique',              [new HorairesBoutiqueController(), 'update']);

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
