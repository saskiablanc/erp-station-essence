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

    public function getSynthese(string $dateJour): array
    {
        $tx = $this->db->query(
            'SELECT
                COUNT(*) AS nb_transactions_effectuees,
                COALESCE(SUM(prix_total), 0) AS montant_total_eur
             FROM `Transaction`
             WHERE DATE(date_heure) = :date_jour',
            ['date_jour' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $carburant = $this->db->query(
            'SELECT
                COALESCE(SUM(te.quantite_delivree), 0) AS volume_total_carburant_l,
                COALESCE(SUM(te.quantite_delivree * c.prix_litre), 0) AS montant_total_carburant_eur
             FROM `TransactionEnergie` te
             INNER JOIN `Transaction` t ON t.id_transaction = te.id_transaction
             INNER JOIN `Energie` e ON e.id_energie = te.id_energie
             INNER JOIN `Carburant` c ON c.id_energie = e.id_energie
             WHERE e.type_energie = :type_energie
               AND DATE(t.date_heure) = :date_jour',
            [
                'type_energie' => 'carburant',
                'date_jour' => $dateJour,
            ]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $electricite = $this->db->query(
            'SELECT
                COALESCE(SUM(te.quantite_delivree), 0) AS volume_total_electricite_kwh,
                COALESCE(SUM(te.quantite_delivree * el.prix_kwh), 0) AS montant_total_electricite_eur
             FROM `TransactionEnergie` te
             INNER JOIN `Transaction` t ON t.id_transaction = te.id_transaction
             INNER JOIN `Energie` e ON e.id_energie = te.id_energie
             INNER JOIN `Electricite` el ON el.id_energie = e.id_energie
             WHERE e.type_energie = :type_energie
               AND DATE(t.date_heure) = :date_jour',
            [
                'type_energie' => 'electricite',
                'date_jour' => $dateJour,
            ]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $incidents = $this->db->query(
            'SELECT COUNT(*) AS nb_incidents
             FROM `FicheIncident`
             WHERE date_creation = :date_jour',
            ['date_jour' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: [];

        $validation = $this->db->query(
            'SELECT
                est_valide,
                date_validation
             FROM `ValidationJournee`
             WHERE date_jour = :date_jour
             ORDER BY id_journee_validee DESC
             LIMIT 1',
            ['date_jour' => $dateJour]
        )->fetch(PDO::FETCH_ASSOC) ?: null;

        $estValide = $validation ? ((int) ($validation['est_valide'] ?? 0) === 1) : false;

        return [
            'date_jour' => $dateJour,
            'info_transactions_journalieres' => 'Relevé du ' . $this->toFrDate($dateJour),
            'nb_transactions_effectuees' => (int) ($tx['nb_transactions_effectuees'] ?? 0),
            'volume_total_carburant_l' => (float) ($carburant['volume_total_carburant_l'] ?? 0),
            'montant_total_carburant_eur' => (float) ($carburant['montant_total_carburant_eur'] ?? 0),
            'volume_total_electricite_kwh' => (float) ($electricite['volume_total_electricite_kwh'] ?? 0),
            'montant_total_electricite_eur' => (float) ($electricite['montant_total_electricite_eur'] ?? 0),
            'montant_total_eur' => (float) ($tx['montant_total_eur'] ?? 0),
            'nb_incidents' => (int) ($incidents['nb_incidents'] ?? 0),
            'est_valide' => $estValide,
            'date_validation' => $validation['date_validation'] ?? null,
        ];
    }

    private function toFrDate(string $dateYmd): string
    {
        $date = \DateTimeImmutable::createFromFormat('Y-m-d', $dateYmd);
        if (!$date || $date->format('Y-m-d') !== $dateYmd) {
            return $dateYmd;
        }
        return $date->format('d/m/Y');
    }
}

