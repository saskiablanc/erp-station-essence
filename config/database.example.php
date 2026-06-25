<?php
declare(strict_types=1);

/**
 * Modele de configuration de connexion.
 * Copier ce fichier en config/database.php et renseigner les identifiants locaux.
 * config/database.php n'est pas versionne (voir .gitignore).
 */

return [
    'courante' => [
        'driver'    => 'mysql',
        'host'      => '127.0.0.1',
        'port'      => '3306',
        'dbname'    => 'unica_station',
        'username'  => 'root',
        'password'  => '',
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],
    'options' => [
        \PDO::ATTR_ERRMODE            => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES   => false,
    ],
    'log_queries' => true,
    'log_file'    => __DIR__ . '/../storage/logs/database.log',
];