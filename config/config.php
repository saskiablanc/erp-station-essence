<?php
declare(strict_types=1);

$env = getenv('ENVIRONMENT');
$env = $env !== false && $env !== '' ? $env : 'development';

return [
    'env' => $env,
    'app_name' => 'SAE R409 - Projet 4E',
    'timezone' => 'Europe/Paris',
    'display_errors' => $env === 'development',
];
