<?php
declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;
use RuntimeException;

final class Database
{
    private static array $instances = [];

    private PDO $connection;

    private function __construct(private array $config)
    {
        $this->connect();
    }

    private function __clone() {}

    public function __wakeup(): void
    {
        throw new RuntimeException('Cannot unserialize singleton');
    }

    public static function getInstance(string $profile = 'courante'): self
    {
        if (!isset(self::$instances[$profile])) {
            $config = self::loadConfig($profile);
            self::$instances[$profile] = new self($config);
        }

        return self::$instances[$profile];
    }

    public function getConnection(): PDO
    {
        return $this->connection;
    }

    public function prepare(string $statement): \PDOStatement
    {
        return $this->connection->prepare($statement);
    }

    public function query(string $statement): \PDOStatement
    {
        return $this->connection->query($statement);
    }

    public function beginTransaction(): bool
    {
        return $this->connection->beginTransaction();
    }

    public function commit(): bool
    {
        return $this->connection->commit();
    }

    public function rollBack(): bool
    {
        return $this->connection->rollBack();
    }

    public function lastInsertId(?string $name = null): string
    {
        return $this->connection->lastInsertId($name);
    }

    private static function loadConfig(string $profile): array
    {
        if (!defined('CONFIG_PATH')) {
            throw new RuntimeException('CONFIG_PATH not defined.');
        }

        $configFile = rtrim((string) CONFIG_PATH, '/\\') . '/database.php';
        if (!is_file($configFile)) {
            throw new RuntimeException('Database config not found.');
        }

        $configs = require $configFile;
        if (!is_array($configs) || !isset($configs[$profile])) {
            throw new RuntimeException('Database profile not found: ' . $profile);
        }

        $profileConfig = $configs[$profile];
        $options = $configs['options'] ?? [];
        if (!isset($profileConfig['options'])) {
            $profileConfig['options'] = $options;
        }

        return $profileConfig;
    }

    private function connect(): void
    {
        $driver = $this->config['driver'] ?? 'mysql';
        $host = $this->config['host'] ?? 'localhost';
        $port = $this->config['port'] ?? '3306';
        $dbname = $this->config['dbname'] ?? '';
        $charset = $this->config['charset'] ?? 'utf8mb4';
        $username = $this->config['username'] ?? '';
        $password = $this->config['password'] ?? '';
        $options = $this->config['options'] ?? [];

        $dsn = sprintf('%s:host=%s;port=%s;dbname=%s;charset=%s', $driver, $host, $port, $dbname, $charset);

        try {
            $this->connection = new PDO($dsn, $username, $password, $options);
        } catch (PDOException $e) {
            error_log('Database connection error: ' . $e->getMessage());
            throw new RuntimeException('Database connection failed.');
        }
    }
}
