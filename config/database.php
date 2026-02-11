<?php
declare(strict_types=1);

$env = static function (string $key, $default = null) {
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
};

return [
    'courante' => [
        'driver' => $env('DB_COURANTE_DRIVER', 'mysql'),
        'host' => $env('DB_COURANTE_HOST', 'localhost'),
        'port' => $env('DB_COURANTE_PORT', '3306'),
        'dbname' => $env('DB_COURANTE_NAME', 'StationCourante'),
        'username' => $env('DB_COURANTE_USER', 'station_user'),
        'password' => $env('DB_COURANTE_PASSWORD', 'station_pass_secure'),
        'charset' => $env('DB_COURANTE_CHARSET', 'utf8mb4'),
    ],
    'archive' => [
        'driver' => $env('DB_ARCHIVE_DRIVER', 'mysql'),
        'host' => $env('DB_ARCHIVE_HOST', 'localhost'),
        'port' => $env('DB_ARCHIVE_PORT', '3307'),
        'dbname' => $env('DB_ARCHIVE_NAME', 'Archive'),
        'username' => $env('DB_ARCHIVE_USER', 'station_user'),
        'password' => $env('DB_ARCHIVE_PASSWORD', 'station_pass_secure'),
        'charset' => $env('DB_ARCHIVE_CHARSET', 'utf8mb4'),
    ],
    'options' => [
        \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
        \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        \PDO::ATTR_EMULATE_PREPARES => false,
    ],
];
