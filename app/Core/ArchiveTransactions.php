<?php
declare(strict_types=1);

namespace App\Core;

use Throwable;

final class ArchiveTransactions
{
    private const MIN_INTERVAL_SECONDS = 300;
    private static bool $ranInRequest = false;

    private function __construct() {}

    public static function runIfNeeded(): void
    {
        if (self::$ranInRequest) {
            return;
        }

        self::$ranInRequest = true;
        if (!self::shouldRunNow()) {
            return;
        }
        self::run();
    }

    public static function run(?string $cutoff = null): void
    {
        try {
            $pdo = Database::getInstance('archive')->getConnection();

            if ($cutoff === null || trim($cutoff) === '') {
                $stmt = $pdo->prepare('CALL `sp_archive_old_transactions`(NULL)');
                $stmt->execute();
            } else {
                $stmt = $pdo->prepare('CALL `sp_archive_old_transactions`(:cutoff)');
                $stmt->execute([':cutoff' => $cutoff]);
            }

            while ($stmt->nextRowset()) {
                // flush all result sets from stored procedure
            }
            $stmt->closeCursor();
        } catch (Throwable $e) {
            self::log('Archivage automatique non exécuté: ' . $e->getMessage());
        }
    }

    private static function log(string $message): void
    {
        $dir = self::storageSubDir('logs');

        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }

        $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
        @file_put_contents($dir . '/archive.log', $line, FILE_APPEND);
    }

    private static function shouldRunNow(): bool
    {
        $dir = self::storageSubDir('cache');
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }

        $file = $dir . '/archive.last_run';
        $fp = @fopen($file, 'c+');
        if ($fp === false) {
            return true;
        }

        $now = time();
        try {
            if (!flock($fp, LOCK_EX)) {
                fclose($fp);
                return true;
            }

            $raw = stream_get_contents($fp);
            $last = (int) trim((string) $raw);
            if ($last > 0 && ($now - $last) < self::MIN_INTERVAL_SECONDS) {
                flock($fp, LOCK_UN);
                fclose($fp);
                return false;
            }

            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, (string) $now);
            fflush($fp);
            flock($fp, LOCK_UN);
            fclose($fp);
            return true;
        } catch (Throwable) {
            @fclose($fp);
            return true;
        }
    }

    private static function storageSubDir(string $subDir): string
    {
        $base = defined('STORAGE_PATH')
            ? rtrim((string) STORAGE_PATH, '/\\')
            : __DIR__ . '/../../storage';

        return $base . '/' . trim($subDir, '/\\');
    }
}
