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
    private int $queryCount = 0;

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

    public function query(string $statement, array $params = []): \PDOStatement
    {
        try {
            $this->queryCount++;

            if (!empty($this->config['log_queries'])) {
                $this->logQuery($statement, $params);
            }

            $stmt = $this->connection->prepare($statement);
            $stmt->execute($params);

            return $stmt;
        } catch (PDOException $e) {
            $this->logError('SQL error: ' . $e->getMessage() . ' | Query: ' . $statement);
            throw new RuntimeException($this->toReadableSqlError($e));
        }
    }

    public function execute(string $statement, array $params = []): int
    {
        $stmt = $this->query($statement, $params);
        return $stmt->rowCount();
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
        $profileConfig['options'] = array_replace($options, $profileConfig['options'] ?? []);
        $profileConfig['log_queries'] = $profileConfig['log_queries'] ?? ($configs['log_queries'] ?? false);
        $profileConfig['log_file'] = $profileConfig['log_file'] ?? ($configs['log_file'] ?? null);

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
            $this->logError('Database connection error: ' . $e->getMessage());
            throw new RuntimeException('Database connection failed.');
        }
    }

    private function logQuery(string $statement, array $params = []): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $paramsStr = json_encode($params, JSON_UNESCAPED_UNICODE);
        $message = "[{$timestamp}] SQL: {$statement} | Params: {$paramsStr}\n";

        $logFile = $this->config['log_file'] ?? $this->defaultLogFile();
        $this->appendLog($logFile, $message);
    }

    private function logError(string $message): void
    {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] ERROR: {$message}\n";

        $logFile = $this->defaultErrorLogFile();
        $this->appendLog($logFile, $logMessage);
    }

    private function appendLog(string $logFile, string $message): void
    {
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0777, true);
        }

        error_log($message, 3, $logFile);
    }

    private function defaultLogFile(): string
    {
        if (defined('STORAGE_PATH')) {
            return rtrim((string) STORAGE_PATH, '/\\') . '/logs/database.log';
        }

        return __DIR__ . '/../../storage/logs/database.log';
    }

    private function defaultErrorLogFile(): string
    {
        if (defined('STORAGE_PATH')) {
            return rtrim((string) STORAGE_PATH, '/\\') . '/logs/database_errors.log';
        }

        return __DIR__ . '/../../storage/logs/database_errors.log';
    }

    private function toReadableSqlError(PDOException $e): string
    {
        $sqlState = (string) $e->getCode();
        $driverCode = isset($e->errorInfo[1]) ? (int) $e->errorInfo[1] : 0;
        $driverMessage = isset($e->errorInfo[2]) ? (string) $e->errorInfo[2] : '';

        if ($sqlState === '23000') {
            if ($driverCode === 1062) {
                return 'Valeur déjà existante (contrainte d\'unicité).';
            }
            if ($driverCode === 1451) {
                return 'Suppression impossible : cet enregistrement est encore référencé dans une autre table.';
            }
            if ($driverCode === 1452) {
                return 'Enregistrement impossible : clé étrangère invalide.';
            }
            return 'Contrainte d\'intégrité violée.';
        }

        if ($sqlState === '42000') {
            return 'Requête SQL invalide.';
        }

        if ($driverMessage !== '') {
            return 'Erreur base de données : ' . $driverMessage;
        }

        return 'Database query failed.';
    }
}
