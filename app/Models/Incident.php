<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use DateTimeImmutable;
use InvalidArgumentException;
use PDO;

class Incident
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function getAll(): array
    {
        $stmt = $this->db->query(
            'SELECT
                id_ref_unique,
                date_creation,
                TIME_FORMAT(heure_creation, "%H:%i:%s") AS heure_creation,
                type_incident,
                detail_tech,
                solution
             FROM `FicheIncident`
             ORDER BY id_ref_unique DESC'
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return array_map(
            static fn(array $row): array => [
                'id_ref_unique' => (int) $row['id_ref_unique'],
                'date_creation' => (string) $row['date_creation'],
                'heure_creation' => (string) $row['heure_creation'],
                'type_incident' => (string) $row['type_incident'],
                'detail_tech' => (string) $row['detail_tech'],
                'solution' => (string) $row['solution'],
            ],
            $rows
        );
    }

    public function getNextReference(): int
    {
        try {
            $stmt = $this->db->query("SHOW TABLE STATUS LIKE 'FicheIncident'");
            $status = $stmt->fetch(PDO::FETCH_ASSOC);
            $next = (int) ($status['Auto_increment'] ?? 0);
            if ($next > 0) {
                return $next;
            }
        } catch (\Throwable) {
        }

        $stmt = $this->db->query(
            'SELECT COALESCE(MAX(id_ref_unique), 0) + 1 AS next_reference
             FROM `FicheIncident`'
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        return (int) ($row['next_reference'] ?? 1);
    }

    public function create(array $payload): array
    {
        $dateCreation = $this->normalizeDate((string) ($payload['date_creation'] ?? ''));
        $heureCreation = $this->normalizeTime((string) ($payload['heure_creation'] ?? ''));
        $typeIncident = $this->normalizeText((string) ($payload['type_incident'] ?? ''), 100);
        $detailTech = $this->normalizeText((string) ($payload['detail_tech'] ?? ''));
        $solution = $this->normalizeText((string) ($payload['solution'] ?? ''));

        $this->db->execute(
            'INSERT INTO `FicheIncident`
                (date_creation, heure_creation, type_incident, detail_tech, solution)
             VALUES
                (:date_creation, :heure_creation, :type_incident, :detail_tech, :solution)',
            [
                'date_creation' => $dateCreation,
                'heure_creation' => $heureCreation,
                'type_incident' => $typeIncident,
                'detail_tech' => $detailTech,
                'solution' => $solution,
            ]
        );

        return $this->getById((int) $this->db->lastInsertId());
    }

    private function getById(int $id): array
    {
        $stmt = $this->db->query(
            'SELECT
                id_ref_unique,
                date_creation,
                TIME_FORMAT(heure_creation, "%H:%i:%s") AS heure_creation,
                type_incident,
                detail_tech,
                solution
             FROM `FicheIncident`
             WHERE id_ref_unique = :id',
            ['id' => $id]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new InvalidArgumentException('Fiche incident introuvable');
        }

        return [
            'id_ref_unique' => (int) $row['id_ref_unique'],
            'date_creation' => (string) $row['date_creation'],
            'heure_creation' => (string) $row['heure_creation'],
            'type_incident' => (string) $row['type_incident'],
            'detail_tech' => (string) $row['detail_tech'],
            'solution' => (string) $row['solution'],
        ];
    }

    private function normalizeDate(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            throw new InvalidArgumentException('La date est obligatoire');
        }

        $date = null;
        if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $value) === 1) {
            $date = DateTimeImmutable::createFromFormat('d/m/Y', $value);
            if ($date && $date->format('d/m/Y') === $value) {
                return $date->format('Y-m-d');
            }
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1) {
            $date = DateTimeImmutable::createFromFormat('Y-m-d', $value);
            if ($date && $date->format('Y-m-d') === $value) {
                return $date->format('Y-m-d');
            }
        }

        throw new InvalidArgumentException('La date est invalide');
    }

    private function normalizeTime(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            throw new InvalidArgumentException("L'heure est obligatoire");
        }

        $time = null;
        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $value) === 1) {
            $time = DateTimeImmutable::createFromFormat('H:i:s', $value);
            if ($time && $time->format('H:i:s') === $value) {
                return $time->format('H:i:s');
            }
        }

        if (preg_match('/^\d{2}:\d{2}$/', $value) === 1) {
            $time = DateTimeImmutable::createFromFormat('H:i', $value);
            if ($time && $time->format('H:i') === $value) {
                return $time->format('H:i:s');
            }
        }

        throw new InvalidArgumentException("L'heure est invalide");
    }

    private function normalizeText(string $value, ?int $maxLength = null): string
    {
        $value = trim($value);
        if ($value === '') {
            throw new InvalidArgumentException('Tous les champs sont obligatoires');
        }

        if ($maxLength !== null && mb_strlen($value) > $maxLength) {
            throw new InvalidArgumentException('Le type incident est trop long');
        }

        return $value;
    }
}
