<?php
/**
 * Configuration générale de l'application
 * UNICA Station - Logiciel de caisse ERP
 */

// Environnement (local)
define('APP_ENV', 'development');

// URLs (serveur local)
define('APP_URL', 'http://localhost:8000');
define('ASSETS_URL', APP_URL . '/assets');

// Informations de l'application
define('APP_NAME', 'UNICA Station');

// Configuration des sessions
define('SESSION_LIFETIME', 3600); // 1 heure

// Timezone
date_default_timezone_set('Europe/Paris');

// Gestion des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);