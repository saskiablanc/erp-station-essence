<?php
declare(strict_types=1);

use App\Core\Router;
use App\Controllers\HomeController;
use App\Controllers\PaiementController;
use App\Controllers\ChoixPaiementController;  // ← AJOUT US24

if (session_status() === PHP_SESSION_NONE) {
    session_name('sae_r409_4e');
    session_start();
}

define('ROOT_PATH', dirname(__DIR__));
define('APP_PATH', ROOT_PATH . '/app');
define('CONFIG_PATH', ROOT_PATH . '/config');
define('VIEW_PATH', APP_PATH . '/Views');
define('STORAGE_PATH', ROOT_PATH . '/storage');

$envPath = ROOT_PATH . '/.env';
if (is_file($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        $key = trim($parts[0]);
        $value = trim($parts[1]);
        if ($key === '') {
            continue;
        }
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if (getenv($key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    }
}

require CONFIG_PATH . '/config.php';

function render_base_page(string $title, string $bodyHtml): void
{
    $appName = defined('APP_NAME') ? APP_NAME : 'Projet 4E';
    $assetsUrl = defined('ASSETS_URL') ? ASSETS_URL : '/assets';
    $fullTitle = $title !== '' ? $title . ' - ' . $appName : $appName;

    echo "<!doctype html>";
    echo "<html lang='fr'>";
    echo "<head>";
    echo "<meta charset='utf-8'>";
    echo "<meta name='viewport' content='width=device-width, initial-scale=1'>";
    echo "<meta name='description' content='SAE R409 - Projet 4E'>";
    echo "<title>" . htmlspecialchars($fullTitle, ENT_QUOTES, 'UTF-8') . "</title>";
    echo "<link rel='stylesheet' href='" . htmlspecialchars($assetsUrl, ENT_QUOTES, 'UTF-8') . "/css/main.css'>";
    echo "</head>";
    echo "<body>";
    echo $bodyHtml;
    echo "</body>";
    echo "</html>";
}

spl_autoload_register(static function (string $class): void {
    $prefix = 'App\\';
    $prefixLength = strlen($prefix);
    if (strncmp($class, $prefix, $prefixLength) !== 0) {
        return;
    }

    $relativeClass = substr($class, $prefixLength);
    $file = APP_PATH . '/' . str_replace('\\', '/', $relativeClass) . '.php';
    if (is_file($file)) {
        require $file;
    }
});

$router = new Router();

// ============================================================
// Routes générales
// ============================================================
$router->get('/', [new HomeController(), 'index']);
$router->get('home', [new HomeController(), 'index']);

// ============================================================
// US24 : Choix Mode Paiement Borne
// ============================================================
$router->get('choix-paiement', [new ChoixPaiementController(), 'index']);
$router->post('choix-paiement/selectionner', [new ChoixPaiementController(), 'selectionner']);
$router->get('choix-paiement/retour', [new ChoixPaiementController(), 'retour']);

// ============================================================
// US25 : Paiement Carte et CCE (TPE)
// ============================================================
$router->get('paiement', [new PaiementController(), 'index']);
$router->post('paiement/traiter', [new PaiementController(), 'traiter']);

// ============================================================
// US28 : Sélection Pompe/Carburant (via actions physiques)
// ============================================================
$router->post('selection-pompe/selectionner', [new \App\Controllers\SelectionPompeController(), 'selectionner']);
$router->post('selection-charge/selectionner', [new \App\Controllers\SelectionChargeController(), 'selectionner']);

// ============================================================
// US28 : Consultation Informations Énergie et Transaction
// ============================================================
$router->get('transaction', [new \App\Controllers\TransactionController(), 'afficher']);
$router->get('transaction/infos-carburant', [new \App\Controllers\TransactionController(), 'getInfosCarburant']);
$router->post('transaction/demarrer', [new \App\Controllers\TransactionController(), 'demarrerDelivrance']);
$router->post('transaction/maj-delivrance', [new \App\Controllers\TransactionController(), 'mettreAJourDelivrance']);
$router->post('transaction/terminer', [new \App\Controllers\TransactionController(), 'terminerDelivrance']);

// ============================================================
// Route de test de connexion BD
// ============================================================
$router->get('test-db', function () {
    try {
        \App\Core\Database::getInstance('courante')->query('SELECT 1');
        render_base_page('Test DB', "<div class='shell'><div class='card'>OK : connexion base courante</div></div>");
    } catch (Throwable $e) {
        $message = htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
        render_base_page('Test DB', "<div class='shell'><div class='card'>KO : {$message}</div></div>");
    }
});

// ============================================================
// Dispatch du routeur
// ============================================================
$page = (string) ($_GET['page'] ?? '');
if ($page === '') {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');

    if ($base !== '' && $base !== '/' && strpos($uri, $base) === 0) {
        $uri = substr($uri, strlen($base));
    }

    $page = $uri;
}

if ($page === '/index.php' || $page === 'index.php') {
    $page = '/';
}

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $page);
