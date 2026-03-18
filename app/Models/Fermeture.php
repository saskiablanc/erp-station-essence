<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;
use RuntimeException;

class Fermeture
{
    private Database $db;
    private ?bool $hasTable = null;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function all(): array
    {
        $this->assertTableExists();

        $stmt = $this->db->query(
            'SELECT
                id_fermeture,
                date_fermeture,
                motif
             FROM `JourFermeture`
             ORDER BY date_fermeture ASC, id_fermeture ASC'
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function create(array $data): array
    {
        $this->assertTableExists();

        $date = $this->normalizeDate((string) ($data['date_fermeture'] ?? ''));
        $motif = $this->normalizeMotif((string) ($data['motif'] ?? ''));

        $duplicate = $this->db->query(
            'SELECT id_fermeture
             FROM `JourFermeture`
             WHERE date_fermeture = :date_fermeture
               AND motif = :motif
             LIMIT 1',
            [
                'date_fermeture' => $date,
                'motif' => $motif,
            ]
        )->fetchColumn();

        if ($duplicate) {
            throw new RuntimeException('Ce jour de fermeture existe déjà');
        }

        $this->db->execute(
            'INSERT INTO `JourFermeture` (date_fermeture, motif)
             VALUES (:date_fermeture, :motif)',
            [
                'date_fermeture' => $date,
                'motif' => $motif,
            ]
        );

        $id = (int) $this->db->lastInsertId();
        if ($id <= 0) {
            throw new RuntimeException('Création du jour de fermeture impossible');
        }

        return [
            'id_fermeture' => $id,
            'date_fermeture' => $date,
            'motif' => $motif,
        ];
    }

    public function delete(int $id): bool
    {
        $this->assertTableExists();
        if ($id <= 0) {
            throw new RuntimeException('Identifiant de fermeture invalide');
        }

        $deleted = $this->db->execute(
            'DELETE FROM `JourFermeture` WHERE id_fermeture = :id LIMIT 1',
            ['id' => $id]
        );

        return $deleted > 0;
    }

    private function assertTableExists(): void
    {
        if ($this->hasTable !== null) {
            if (!$this->hasTable) {
                throw new RuntimeException('Table JourFermeture introuvable');
            }
            return;
        }

        $stmt = $this->db->query("SHOW TABLES LIKE 'JourFermeture'");
        $this->hasTable = (bool) $stmt->fetchColumn();
        if (!$this->hasTable) {
            throw new RuntimeException('Table JourFermeture introuvable');
        }
    }

    private function normalizeDate(string $value): string
    {
        $value = trim($value);
        if ($value === '') {
            throw new RuntimeException('La date de fermeture est requise');
        }

        $date = \DateTime::createFromFormat('Y-m-d', $value);
        $errors = \DateTime::getLastErrors();
        if (
            !$date
            || ($errors['warning_count'] ?? 0) > 0
            || ($errors['error_count'] ?? 0) > 0
        ) {
            throw new RuntimeException('Format de date invalide');
        }

        return $date->format('Y-m-d');
    }

    private function normalizeMotif(string $value): string
    {
        $value = trim((string) preg_replace('/\s+/', ' ', $value));

        if ($value === '') {
            throw new RuntimeException('Le motif est requis');
        }
        if (mb_strlen($value) > 100) {
            throw new RuntimeException('Le motif est trop long');
        }

        return $value;
    }
}
