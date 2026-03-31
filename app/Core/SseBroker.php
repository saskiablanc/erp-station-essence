<?php
declare(strict_types=1);

namespace App\Core;

final class SseBroker
{
    private const POMPES_CHANNEL_FILE = '/sse/pompes_channel.json';

    /**
     * @param array<string, mixed> $payload
     */
    public static function publishPompesUpdate(array $payload = []): void
    {
        $state = self::withExclusiveState(function (array $current) use ($payload): array {
            $current['id'] = (int) ($current['id'] ?? 0) + 1;
            $current['updated_at'] = date('c');
            $current['payload'] = $payload;
            return $current;
        });

        if ($state === null) {
            return;
        }
    }

    /**
     * @return array{id:int,updated_at:string,payload:array<string,mixed>}
     */
    public static function readPompesState(): array
    {
        $state = self::readState();
        return [
            'id' => (int) ($state['id'] ?? 0),
            'updated_at' => (string) ($state['updated_at'] ?? ''),
            'payload' => is_array($state['payload'] ?? null) ? $state['payload'] : [],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function withExclusiveState(callable $mutator): ?array
    {
        $file = self::getChannelFilePath();
        if ($file === null) {
            return null;
        }

        $handle = @fopen($file, 'c+');
        if (!$handle) {
            return null;
        }

        try {
            if (!flock($handle, LOCK_EX)) {
                return null;
            }

            $raw = stream_get_contents($handle);
            $state = self::decodeState($raw ?: '');
            $state = $mutator($state);

            rewind($handle);
            ftruncate($handle, 0);
            fwrite($handle, json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            fflush($handle);
            flock($handle, LOCK_UN);

            return $state;
        } finally {
            fclose($handle);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function readState(): array
    {
        $file = self::getChannelFilePath();
        if ($file === null || !is_file($file)) {
            return self::defaultState();
        }

        $raw = @file_get_contents($file);
        if (!is_string($raw)) {
            return self::defaultState();
        }

        return self::decodeState($raw);
    }

    /**
     * @return array<string, mixed>
     */
    private static function decodeState(string $raw): array
    {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return self::defaultState();
        }

        return [
            'id' => (int) ($decoded['id'] ?? 0),
            'updated_at' => (string) ($decoded['updated_at'] ?? ''),
            'payload' => is_array($decoded['payload'] ?? null) ? $decoded['payload'] : [],
        ];
    }

    /**
     * @return array{id:int,updated_at:string,payload:array<string,mixed>}
     */
    private static function defaultState(): array
    {
        return ['id' => 0, 'updated_at' => '', 'payload' => []];
    }

    private static function getChannelFilePath(): ?string
    {
        if (!defined('STORAGE_PATH')) {
            return null;
        }

        $dir = rtrim((string) STORAGE_PATH, '/\\') . '/sse';
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        if (!is_dir($dir)) {
            return null;
        }

        return rtrim((string) STORAGE_PATH, '/\\') . self::POMPES_CHANNEL_FILE;
    }
}
