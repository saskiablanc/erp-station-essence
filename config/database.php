<?php
declare(strict_types=1);

return [
    'courante' => [
        'driver' => 'mysql',
        'host' => 'localhost',
        'port' => '3306',
        'dbname' => 'unica_station',
        'username' => 'local',
        'password' => 'local',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],
    'archive' => [
        'driver' => 'mysql',
        'host' => 'localhost',
        'port' => '3306',
        'dbname' => 'unica_station_Archives',
        'username' => 'local',
        'password' => 'local',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],
    'options' => [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES => false,
    ],
    'log_queries' => true,
    'log_file' => __DIR__ . '/../storage/logs/database.log',
];
