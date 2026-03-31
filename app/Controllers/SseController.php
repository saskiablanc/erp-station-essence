<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Core\SseBroker;

final class SseController extends Controller
{
    public function pompes(): void
    {
        $this->requireAuth();

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }

        @ini_set('zlib.output_compression', '0');
        @ini_set('output_buffering', 'off');
        @ini_set('implicit_flush', '1');
        @set_time_limit(0);

        while (ob_get_level() > 0) {
            ob_end_flush();
        }
        ob_implicit_flush(true);

        header('Content-Type: text/event-stream; charset=utf-8');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        $lastEventId = 0;
        if (!empty($_SERVER['HTTP_LAST_EVENT_ID'])) {
            $lastEventId = (int) $_SERVER['HTTP_LAST_EVENT_ID'];
        } elseif (isset($_GET['lastEventId'])) {
            $lastEventId = (int) $_GET['lastEventId'];
        }

        $initial = SseBroker::readPompesState();
        $this->sendEvent('pompes-update', $initial, (int) $initial['id']);
        $lastSentId = (int) $initial['id'];
        if ($lastEventId > $lastSentId) {
            $lastSentId = $lastEventId;
        }

        $heartbeatTick = 0;
        $maxLoops = 240; // ~2 minutes, puis reconnexion automatique côté client
        for ($i = 0; $i < $maxLoops; $i++) {
            if (connection_aborted()) {
                break;
            }

            $state = SseBroker::readPompesState();
            $currentId = (int) ($state['id'] ?? 0);
            if ($currentId > $lastSentId) {
                $this->sendEvent('pompes-update', $state, $currentId);
                $lastSentId = $currentId;
                $heartbeatTick = 0;
            } else {
                $heartbeatTick++;
                if ($heartbeatTick >= 20) {
                    echo ": ping\n\n";
                    @flush();
                    $heartbeatTick = 0;
                }
            }

            usleep(500000);
        }

        exit;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function sendEvent(string $event, array $payload, int $id): void
    {
        echo 'id: ' . $id . "\n";
        echo 'event: ' . $event . "\n";
        echo 'data: ' . json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
        @flush();
    }
}
