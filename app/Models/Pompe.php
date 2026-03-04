<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use RuntimeException;

/**
 * PompeModel — Accès aux données des pompes et bornes électriques
 *
 * Tables impliquées :
 *   Pompe              -> statut, mode, type, sous_type
 *   TransactionEnergie -> livraison en cours (statut = 'en_cours')
 *   Energie            -> type_energie (carburant | electricite)
 *   Carburant          -> libelle, prix_litre
 *   Electricite        -> prix_kwh, type_charge
 *   Transaction        -> prix_total, date_heure
 */
final class Pompe
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    // ──────────────────────────────────────────────────────────
    //  Lecture
    // ──────────────────────────────────────────────────────────

    /**
     * Retourne toutes les pompes avec leur transaction en cours si elle existe.
     * Le JSON retourné par /json/pompes alimente les panels JS.
     *
     * @return array[]
     */
    public function getAll(): array
    {
        // 1. Récupérer toutes les pompes
        $pompes = $this->db->query(
            'SELECT id_pompe, numero, type_pompe, sous_type, mode, statut,
                    date_debut, id_transaction_energie
             FROM Pompe
             ORDER BY type_pompe, numero'
        )->fetchAll();

        if (empty($pompes)) {
            return [];
        }

        // 2. Pour chaque pompe avec une transaction liée, charger les détails
        $ids = array_filter(array_column($pompes, 'id_transaction_energie'));
        $txDetails = [];

        if (!empty($ids)) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));

            // Transactions carburant en cours
            $carbRows = $this->db->query(
                "SELECT
                    te.id_transaction_energie,
                    te.id_energie,
                    te.quantite_delivree,
                    te.temps_charge,
                    te.statut           AS te_statut,
                    te.id_pompe,
                    t.prix_total,
                    t.date_heure,
                    c.libelle,
                    c.prix_litre,
                    NULL                AS prix_kwh,
                    NULL                AS type_charge,
                    NULL                AS type_carte
                 FROM TransactionEnergie te
                 JOIN Transaction t  ON t.id_transaction  = te.id_transaction
                 JOIN Energie e      ON e.id_energie       = te.id_energie
                 JOIN Carburant c    ON c.id_energie        = e.id_energie
                 WHERE te.id_transaction_energie IN ($placeholders)
                   AND e.type_energie = 'carburant'",
                array_values($ids)
            )->fetchAll();

            // Transactions électricité en cours
            $elecRows = $this->db->query(
                "SELECT
                    te.id_transaction_energie,
                    te.id_energie,
                    te.quantite_delivree,
                    te.temps_charge,
                    te.statut           AS te_statut,
                    te.id_pompe,
                    t.prix_total,
                    t.date_heure,
                    NULL                AS libelle,
                    NULL                AS prix_litre,
                    el.prix_kwh,
                    el.type_charge,
                    NULL                AS type_carte
                 FROM TransactionEnergie te
                 JOIN Transaction t    ON t.id_transaction  = te.id_transaction
                 JOIN Energie e        ON e.id_energie       = te.id_energie
                 JOIN Electricite el   ON el.id_energie       = e.id_energie
                 WHERE te.id_transaction_energie IN ($placeholders)
                   AND e.type_energie = 'electricite'",
                array_values($ids)
            )->fetchAll();

            // Indexer par id_transaction_energie pour lookup O(1)
            foreach (array_merge($carbRows, $elecRows) as $row) {
                $txDetails[(int)$row['id_transaction_energie']] = $row;
            }
        }

        // 3. Assembler le résultat final
        return array_map(function (array $pompe) use ($txDetails): array {
            $idTe = $pompe['id_transaction_energie']
                  ? (int)$pompe['id_transaction_energie']
                  : null;

            $tx = ($idTe && isset($txDetails[$idTe])) ? $txDetails[$idTe] : null;

            return [
                'id_pompe'   => (int)$pompe['id_pompe'],
                'numero'     => (int)$pompe['numero'],
                'type_pompe' => $pompe['type_pompe'],
                'sous_type'  => $pompe['sous_type'],   // 'rapide' | 'lente' | null
                'mode'       => $pompe['mode'],         // 'manuel' | 'auto'
                'statut'     => $pompe['statut'],       // 'active' | 'en_cours' | 'desactivee'
                'date_debut' => $pompe['date_debut'],
                'transaction' => $tx ? [
                    'id_transaction_energie' => (int)$tx['id_transaction_energie'],
                    'id_energie'             => (int)$tx['id_energie'],
                    'libelle'                => $tx['libelle'],           // SP95, GAZOLE… ou null
                    'prix_litre'             => $tx['prix_litre'] !== null
                                                 ? (float)$tx['prix_litre'] : null,
                    'prix_kwh'               => $tx['prix_kwh'] !== null
                                                 ? (float)$tx['prix_kwh'] : null,
                    'type_charge'            => $tx['type_charge'],       // 'rapide' | 'lente' | null
                    'quantite_delivree'      => (float)$tx['quantite_delivree'],
                    'temps_charge'           => $tx['temps_charge'],      // TIME "HH:MM:SS" ou null
                    'prix_total'             => (float)$tx['prix_total'],
                    'date_heure'             => $tx['date_heure'],
                    'type_carte'             => $tx['type_carte'],
                    'statut'                 => $tx['te_statut'],
                ] : null,
            ];
        }, $pompes);
    }

    /**
     * Trouve une pompe par son id.
     */
    public function findById(int $idPompe): ?array
    {
        $row = $this->db->query(
            'SELECT id_pompe, numero, type_pompe, sous_type, mode, statut, date_debut
             FROM Pompe WHERE id_pompe = ?',
            [$idPompe]
        )->fetch();

        return $row ?: null;
    }

    // ──────────────────────────────────────────────────────────
    //  Écriture
    // ──────────────────────────────────────────────────────────

    /**
     * Active manuellement une pompe désactivée.
     * Règle métier : seule une pompe 'desactivee' peut être activée.
     * Si une TransactionEnergie 'en_cours' est liée, elle reste en attente côté BDD
     * (c'est l'encaissement caisse qui la clôturera).
     *
     * @throws RuntimeException si la pompe est introuvable ou déjà active/en_cours
     */
    public function activer(int $idPompe): array
    {
        $pompe = $this->findById($idPompe);

        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }

        if ($pompe['statut'] === 'active') {
            throw new RuntimeException("La pompe {$pompe['numero']} est déjà active.", 409);
        }

        if ($pompe['statut'] === 'en_cours') {
            throw new RuntimeException("La pompe {$pompe['numero']} est en cours de livraison.", 409);
        }

        // Transition : desactivee → active
        $this->db->execute(
            "UPDATE Pompe
             SET statut = 'active', date_debut = NULL, id_transaction_energie = NULL
             WHERE id_pompe = ?",
            [$idPompe]
        );

        return ['id_pompe' => $idPompe, 'statut' => 'active'];
    }

    /**
     * Marque une pompe comme "en_cours" au démarrage d'une livraison.
     * Appelé lors de la création d'une TransactionEnergie.
     */
    public function demarrerLivraison(int $idPompe, int $idTransactionEnergie): void
    {
        $this->db->execute(
            "UPDATE Pompe
             SET statut = 'en_cours',
                 date_debut = NOW(),
                 id_transaction_energie = ?
             WHERE id_pompe = ?",
            [$idTransactionEnergie, $idPompe]
        );
    }

    /**
     * Marque une pompe comme "desactivee" après fin de livraison (avant paiement).
     */
    public function terminerLivraison(int $idPompe): void
    {
        $this->db->execute(
            "UPDATE Pompe SET statut = 'desactivee' WHERE id_pompe = ?",
            [$idPompe]
        );
    }

    /**
     * Réactive automatiquement une pompe après validation du paiement.
     * Met aussi à jour le statut de la TransactionEnergie à 'payee'.
     */
    public function validerPaiement(int $idPompe, int $idTransactionEnergie): void
    {
        $this->db->beginTransaction();
        try {
            // Clôturer la transaction énergie
            $this->db->execute(
                "UPDATE TransactionEnergie
                 SET statut = 'payee'
                 WHERE id_transaction_energie = ?",
                [$idTransactionEnergie]
            );

            // Réactiver la pompe
            $this->db->execute(
                "UPDATE Pompe
                 SET statut = 'active', date_debut = NULL, id_transaction_energie = NULL
                 WHERE id_pompe = ?",
                [$idPompe]
            );

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}