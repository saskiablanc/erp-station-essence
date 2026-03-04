<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use RuntimeException;

final class Pompe
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function getAll(): array
    {
        // ── 1. Toutes les pompes ──────────────────────────────
        $pompes = $this->db->query(
            'SELECT id_pompe, numero, type_pompe, sous_type, mode, statut,
                    date_debut, id_transaction_energie
             FROM Pompe
             ORDER BY type_pompe, numero'
        )->fetchAll();

        if (empty($pompes)) {
            return [];
        }

        // ── 2. Transactions en cours (si id_transaction_energie renseigné) ──
        $ids = array_values(array_filter(
            array_column($pompes, 'id_transaction_energie'),
            fn($v) => $v !== null && $v !== ''
        ));

        $txDetails = [];

        if (!empty($ids)) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));

            // ── Carburant ────────────────────────────────────
            // Energie.type_energie = 'carburant' → JOIN Carburant
            $carbRows = $this->db->query(
                "SELECT
                    te.` id_transaction_energie` AS id_transaction_energie,
                    te.id_energie,
                    te.quantite_delivree,
                    te.temps_charge,
                    te.statut        AS te_statut,
                    t.prix_total,
                    t.date_heure,
                    c.libelle,
                    c.prix_litre,
                    NULL             AS prix_kwh,
                    NULL             AS type_charge
                 FROM TransactionEnergie te
                 JOIN `Transaction` t ON t.id_transaction = te.id_transaction
                 JOIN Energie e       ON e.id_energie     = te.id_energie
                 JOIN Carburant c     ON c.id_energie     = e.id_energie
                 WHERE te.` id_transaction_energie` IN ($placeholders)
                   AND e.type_energie = 'carburant'",
                $ids
            )->fetchAll();

            // ── Electricité ──────────────────────────────────
            $elecRows = $this->db->query(
                "SELECT
                    te.` id_transaction_energie` AS id_transaction_energie,
                    te.id_energie,
                    te.quantite_delivree,
                    te.temps_charge,
                    te.statut        AS te_statut,
                    t.prix_total,
                    t.date_heure,
                    NULL             AS libelle,
                    NULL             AS prix_litre,
                    el.prix_kwh,
                    el.type_charge
                 FROM TransactionEnergie te
                 JOIN `Transaction` t  ON t.id_transaction = te.id_transaction
                 JOIN Energie e        ON e.id_energie     = te.id_energie
                 JOIN Electricite el   ON el.id_energie    = e.id_energie
                 WHERE te.` id_transaction_energie` IN ($placeholders)
                   AND e.type_energie = 'electricite'",
                $ids
            )->fetchAll();

            // Indexer par id_transaction_energie pour lookup O(1)
            foreach (array_merge($carbRows, $elecRows) as $row) {
                $key = (int) $row['id_transaction_energie'];
                $txDetails[$key] = $row;
            }
        }

        // ── 3. Assembler ─────────────────────────────────────
        return array_map(function (array $p) use ($txDetails): array {
            $idTe = isset($p['id_transaction_energie']) && $p['id_transaction_energie'] !== ''
                  ? (int) $p['id_transaction_energie']
                  : null;

            $tx = ($idTe && isset($txDetails[$idTe])) ? $txDetails[$idTe] : null;

            return [
                'id_pompe'   => (int) $p['id_pompe'],
                'numero'     => (int) $p['numero'],
                'type_pompe' => $p['type_pompe'],           // 'carburant' | 'electricite'
                'sous_type'  => $p['sous_type'],            // 'rapide' | 'lente' | null
                'mode'       => $p['mode'],                 // 'manuel' | 'auto'
                'statut'     => $p['statut'],               // 'active' | 'en_cours' | 'desactivee'
                'date_debut' => $p['date_debut'],
                'transaction' => $tx ? [
                    'id_transaction_energie' => (int) $tx['id_transaction_energie'],
                    'id_energie'             => (int) $tx['id_energie'],
                    'libelle'                => $tx['libelle'],
                    'prix_litre'             => $tx['prix_litre'] !== null ? (float) $tx['prix_litre'] : null,
                    'prix_kwh'               => $tx['prix_kwh']   !== null ? (float) $tx['prix_kwh']   : null,
                    'type_charge'            => $tx['type_charge'],
                    'quantite_delivree'      => (float) $tx['quantite_delivree'],
                    'temps_charge'           => $tx['temps_charge'],
                    'prix_total'             => (float) $tx['prix_total'],
                    'date_heure'             => $tx['date_heure'],
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
            'SELECT id_pompe, numero, type_pompe, sous_type, mode, statut,
                    date_debut, id_transaction_energie
             FROM Pompe WHERE id_pompe = ?',
            [$idPompe]
        )->fetch();

        return $row ?: null;
    }

    // ──────────────────────────────────────────────────────────
    //  Écriture
    // ──────────────────────────────────────────────────────────

    /**
     * Activation manuelle : desactivee → active
     * Règle : uniquement si statut = 'desactivee'
     *
     * @throws RuntimeException code 404 si introuvable, 409 si déjà active/en_cours
     */
    public function activer(int $idPompe): array
    {
        $pompe = $this->findById($idPompe);

        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }
        if ($pompe['statut'] === 'active') {
            throw new RuntimeException("La pompe {$pompe['numero']} est deja active.", 409);
        }
        if ($pompe['statut'] === 'en_cours') {
            throw new RuntimeException("La pompe {$pompe['numero']} est en cours de livraison.", 409);
        }

        $this->db->execute(
            "UPDATE Pompe
             SET statut = 'active', date_debut = NULL, id_transaction_energie = NULL
             WHERE id_pompe = ?",
            [$idPompe]
        );

        return ['id_pompe' => $idPompe, 'statut' => 'active'];
    }

    /**
     * Démarre une livraison : active → en_cours
     * Appelé à la création d'une TransactionEnergie.
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
     * Fin de livraison (avant paiement) : en_cours → desactivee
     */
    public function terminerLivraison(int $idPompe): void
    {
        $this->db->execute(
            "UPDATE Pompe SET statut = 'desactivee' WHERE id_pompe = ?",
            [$idPompe]
        );
    }

    /**
     * Paiement validé : desactivee → active + TransactionEnergie → payee
     * Transaction atomique.
     */
    public function validerPaiement(int $idPompe, int $idTransactionEnergie): void
    {
        $this->db->beginTransaction();
        try {
            $this->db->execute(
                "UPDATE TransactionEnergie SET statut = 'payee'
                 WHERE ` id_transaction_energie` = ?",
                [$idTransactionEnergie]
            );
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