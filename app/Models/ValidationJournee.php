<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

final class ValidationJournee
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    // ── Synthèse d'une journée ────────────────────────────
    public function getSynthese(string $dateJour): array
    {
        $tx = $this->db->query(
            'SELECT COUNT(*) AS nb_transactions_effectuees,
                    COALESCE(SUM(prix_total), 0) AS montant_total_eur
             FROM `Transaction`
             WHERE DATE(date_heure) = :d',
            ['d' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $carburant = $this->db->query(
            'SELECT COALESCE(SUM(te.quantite_delivree), 0)            AS volume_total_carburant_l,
                    COALESCE(SUM(te.quantite_delivree * c.prix_litre), 0) AS montant_total_carburant_eur
             FROM `TransactionEnergie` te
             INNER JOIN `Transaction` t  ON t.id_transaction = te.id_transaction
             INNER JOIN `Energie` e      ON e.id_energie = te.id_energie
             INNER JOIN `Carburant` c    ON c.id_energie = e.id_energie
             WHERE e.type_energie = :type AND DATE(t.date_heure) = :d',
            ['type' => 'carburant', 'd' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $electricite = $this->db->query(
            'SELECT COALESCE(SUM(te.quantite_delivree), 0)              AS volume_total_electricite_kwh,
                    COALESCE(SUM(te.quantite_delivree * el.prix_kwh), 0) AS montant_total_electricite_eur
             FROM `TransactionEnergie` te
             INNER JOIN `Transaction` t   ON t.id_transaction = te.id_transaction
             INNER JOIN `Energie` e       ON e.id_energie = te.id_energie
             INNER JOIN `Electricite` el  ON el.id_energie = e.id_energie
             WHERE e.type_energie = :type AND DATE(t.date_heure) = :d',
            ['type' => 'electricite', 'd' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $incidents = $this->db->query(
            'SELECT COUNT(*) AS nb_incidents FROM `FicheIncident` WHERE date_creation = :d',
            ['d' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $validTx = $this->getValidation('ValidationTransactions', $dateJour);
        $validInc = $this->getValidation('ValidationIncidents', $dateJour);

        return [
            'date_jour'                       => $dateJour,
            'info_transactions_journalieres'  => 'Relevé du ' . $this->toFrDate($dateJour),
            'nb_transactions_effectuees'      => (int)($tx['nb_transactions_effectuees'] ?? 0),
            'volume_total_carburant_l'        => (float)($carburant['volume_total_carburant_l'] ?? 0),
            'montant_total_carburant_eur'     => (float)($carburant['montant_total_carburant_eur'] ?? 0),
            'volume_total_electricite_kwh'    => (float)($electricite['volume_total_electricite_kwh'] ?? 0),
            'montant_total_electricite_eur'   => (float)($electricite['montant_total_electricite_eur'] ?? 0),
            'montant_total_eur'               => (float)($tx['montant_total_eur'] ?? 0),
            'nb_incidents'                    => (int)($incidents['nb_incidents'] ?? 0),
            // États de validation indépendants
            'est_valide_tx'                   => $validTx['est_valide'],
            'date_validation_tx'              => $validTx['date_validation'],
            'est_valide_inc'                  => $validInc['est_valide'],
            'date_validation_inc'             => $validInc['date_validation'],
        ];
    }

    // ── Validation d'un type (transactions ou incidents) ──
    public function validerJournee(string $dateJour, string $type): array
    {
        $table = $this->resolveTable($type);
        $pkCol = $this->resolvePk($type);
        $now   = (new \DateTimeImmutable('now'))->format('Y-m-d H:i:s');

        $existing = $this->db->query(
            "SELECT `{$pkCol}` FROM `{$table}` WHERE date_jour = :d ORDER BY `{$pkCol}` DESC LIMIT 1",
            ['d' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $this->db->query(
                "UPDATE `{$table}` SET est_valide = 1, date_validation = :dv WHERE `{$pkCol}` = :id",
                ['dv' => $now, 'id' => (int)$existing[$pkCol]]
            );
        } else {
            $this->db->query(
                "INSERT INTO `{$table}` (date_jour, est_valide, date_validation) VALUES (:dj, 1, :dv)",
                ['dj' => $dateJour, 'dv' => $now]
            );
        }

        return $this->getSynthese($dateJour);
    }

    // ── Listes des dates verrouillées par type ────────────
    public function getJourneesValidees(): array
    {
        $tx = $this->db->query(
            'SELECT date_jour FROM `ValidationTransactions` WHERE est_valide = 1'
        )->fetchAll(PDO::FETCH_COLUMN) ?: [];

        $inc = $this->db->query(
            'SELECT date_jour FROM `ValidationIncidents` WHERE est_valide = 1'
        )->fetchAll(PDO::FETCH_COLUMN) ?: [];

        return [
            'dates_tx'  => array_values($tx),
            'dates_inc' => array_values($inc),
        ];
    }

    // ── Transactions d'un jour ────────────────────────────
    public function getTransactionsJour(string $dateJour): array
    {
        $rows = $this->db->query(
            'SELECT id_transaction, prix_total, date_heure
             FROM `Transaction`
             WHERE DATE(date_heure) = :d
             ORDER BY date_heure ASC',
            ['d' => $dateJour]
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return ['transactions' => $rows];
    }

    // ── Incidents d'un jour ───────────────────────────────
    public function getIncidentsJour(string $dateJour): array
    {
        $rows = $this->db->query(
            'SELECT id_ref_unique, heure_creation, type_incident, detail_tech, solution
             FROM `FicheIncident`
             WHERE date_creation = :d
             ORDER BY heure_creation ASC',
            ['d' => $dateJour]
        )->fetchAll(PDO::FETCH_ASSOC) ?: [];

        return ['incidents' => $rows];
    }

    // ── Helpers privés ────────────────────────────────────
    private function getValidation(string $table, string $dateJour): array
    {
        $row = $this->db->query(
            "SELECT est_valide, date_validation FROM `{$table}`
             WHERE date_jour = :d ORDER BY 1 DESC LIMIT 1",
            ['d' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: null;

        return [
            'est_valide'      => $row ? ((int)($row['est_valide'] ?? 0) === 1) : false,
            'date_validation' => $row['date_validation'] ?? null,
        ];
    }

    private function resolveTable(string $type): string
    {
        return match($type) {
            'transactions' => 'ValidationTransactions',
            'incidents'    => 'ValidationIncidents',
            default        => throw new \InvalidArgumentException("Type invalide: {$type}"),
        };
    }

    private function resolvePk(string $type): string
    {
        return match($type) {
            'transactions' => 'id_validation_tx',
            'incidents'    => 'id_validation_inc',
            default        => throw new \InvalidArgumentException("Type invalide: {$type}"),
        };
    }

    private function toFrDate(string $dateYmd): string
    {
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $dateYmd);
        if (!$date || $date->format('Y-m-d') !== $dateYmd) return $dateYmd;
        return $date->format('d/m/Y');
    }
}