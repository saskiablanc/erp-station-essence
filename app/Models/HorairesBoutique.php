<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use InvalidArgumentException;
use PDO;

class HorairesBoutique
{
    private Database $db;

    private const DAYS = [
        'Lundi',
        'Mardi',
        'Mercredi',
        'Jeudi',
        'Vendredi',
        'Samedi',
        'Dimanche',
    ];

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function getAll(): array
    {
        $dayMap = $this->ensureWeekSetup();

        $stmt = $this->db->query(
            'SELECT
                h.id_horaire,
                h.id_jour,
                j.libelle,
                h.heure_ouverture,
                h.heure_fermeture,
                h.est_ferme
             FROM `Horaire` h
             INNER JOIN `JourSemaine` j ON j.id_jour = h.id_jour'
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $byLabel = [];
        foreach ($rows as $row) {
            $byLabel[(string) $row['libelle']] = [
                'id_horaire' => (int) $row['id_horaire'],
                'id_jour' => (int) $row['id_jour'],
                'libelle' => (string) $row['libelle'],
                'heure_ouverture' => (string) $row['heure_ouverture'],
                'heure_fermeture' => (string) $row['heure_fermeture'],
                'est_ferme' => (int) $row['est_ferme'] === 1,
            ];
        }

        $ordered = [];
        foreach ($dayMap as $day) {
            $ordered[] = $byLabel[$day['libelle']];
        }

        return $ordered;
    }

    public function updateAll(array $horaires): array
    {
        $dayMap = $this->ensureWeekSetup();
        $allowedIds = [];
        foreach ($dayMap as $day) {
            $allowedIds[(int) $day['id_jour']] = true;
        }

        $this->db->beginTransaction();
        try {
            foreach ($horaires as $horaire) {
                $idJour = (int) ($horaire['id_jour'] ?? 0);
                if ($idJour <= 0 || !isset($allowedIds[$idJour])) {
                    throw new InvalidArgumentException('Erreur : Valeurs Incorrectes');
                }

                $estFerme = !empty($horaire['est_ferme']);
                $ouverture = $this->normalizeTimeValue((string) ($horaire['heure_ouverture'] ?? '08h00'));
                $fermeture = $this->normalizeTimeValue((string) ($horaire['heure_fermeture'] ?? '23h00'));

                $this->db->execute(
                    'UPDATE `Horaire`
                     SET heure_ouverture = :heure_ouverture,
                         heure_fermeture = :heure_fermeture,
                         est_ferme = :est_ferme
                     WHERE id_jour = :id_jour',
                    [
                        'heure_ouverture' => $ouverture,
                        'heure_fermeture' => $fermeture,
                        'est_ferme' => $estFerme ? 1 : 0,
                        'id_jour' => $idJour,
                    ]
                );
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }

        return $this->getAll();
    }

    private function ensureWeekSetup(): array
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->query('SELECT id_jour, libelle FROM `JourSemaine`');
            $existingDays = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            $byLabel = [];
            foreach ($existingDays as $day) {
                $byLabel[$this->normalizeLabel((string) $day['libelle'])] = [
                    'id_jour' => (int) $day['id_jour'],
                    'libelle' => (string) $day['libelle'],
                ];
            }

            $orderedDays = [];
            foreach (self::DAYS as $label) {
                $key = $this->normalizeLabel($label);
                if (!isset($byLabel[$key])) {
                    $this->db->execute(
                        'INSERT INTO `JourSemaine` (`libelle`) VALUES (:libelle)',
                        ['libelle' => $label]
                    );
                    $byLabel[$key] = [
                        'id_jour' => (int) $this->db->lastInsertId(),
                        'libelle' => $label,
                    ];
                }
                $orderedDays[] = $byLabel[$key];
            }

            $stmt = $this->db->query('SELECT id_jour FROM `Horaire`');
            $existingHoraires = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
            $existingHorairesByDay = [];
            foreach ($existingHoraires as $horaire) {
                $existingHorairesByDay[(int) $horaire['id_jour']] = true;
            }

            foreach ($orderedDays as $day) {
                if (isset($existingHorairesByDay[(int) $day['id_jour']])) {
                    continue;
                }

                $this->db->execute(
                    'INSERT INTO `Horaire`
                        (`id_jour`, `heure_ouverture`, `heure_fermeture`, `est_ferme`)
                     VALUES
                        (:id_jour, :heure_ouverture, :heure_fermeture, :est_ferme)',
                    [
                        'id_jour' => (int) $day['id_jour'],
                        'heure_ouverture' => '08:00:00',
                        'heure_fermeture' => '23:00:00',
                        'est_ferme' => 0,
                    ]
                );
            }

            $this->db->commit();
            return $orderedDays;
        } catch (\Throwable $e) {
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    private function normalizeTimeValue(string $value): string
    {
        $value = trim($value);

        if (preg_match('/^([01]\d|2[0-3])h([0-5]\d)$/', $value, $matches) === 1) {
            return sprintf('%02d:%02d:00', (int) $matches[1], (int) $matches[2]);
        }

        if (preg_match('/^([01]\d|2[0-3]):([0-5]\d)$/', $value, $matches) === 1) {
            return sprintf('%02d:%02d:00', (int) $matches[1], (int) $matches[2]);
        }

        if (preg_match('/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/', $value, $matches) === 1) {
            return sprintf('%02d:%02d:%02d', (int) $matches[1], (int) $matches[2], (int) $matches[3]);
        }

        throw new InvalidArgumentException('Erreur : Valeurs Incorrectes');
    }

    private function normalizeLabel(string $label): string
    {
        return strtolower(trim($label));
    }
}