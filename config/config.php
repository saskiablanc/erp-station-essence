<?php
/**
 * Configuration générale de l'application
 * SAE R409 - Projet 4E
 */

// Environnement
define('APP_ENV', 'development');

// Configuration selon l'environnement
if (APP_ENV === 'production') {
    // Sur le serveur IUT
    define('APP_URL', 'http://localhost:8000');
    define('ASSETS_URL', '/assets');
} else {
    // En local
    define('APP_URL', 'http://localhost:8000');
    define('ASSETS_URL', APP_URL . '/assets');
}

// Informations de l'application
define('APP_NAME', 'SAE R409 - Projet 4E');

// Configuration des sessions
define('SESSION_LIFETIME', 3600); // 1 heure

// Timezone
date_default_timezone_set('Europe/Paris');

// Gestion des erreurs selon l'environnement
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../storage/logs/php_errors.log');
}
