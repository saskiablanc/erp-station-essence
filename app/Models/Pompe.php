<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use RuntimeException;

final class Pompe
{
    private Database $db;
    private ?string $transactionEnergiePkColumn = null;
    private ?bool $transactionEnergieTransactionNullable = null;

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

        // ── 1.b Dernière transaction payée par pompe (carte + détails) ───
        $pompeIds = array_values(array_filter(
            array_map(static fn($p) => (int) ($p['id_pompe'] ?? 0), $pompes),
            static fn(int $id): bool => $id > 0
        ));
        $lastCardByPompe = [];
        $lastTransactionByPompe = [];
        if (!empty($pompeIds)) {
            $placeholdersPompes = implode(',', array_fill(0, count($pompeIds), '?'));
            $pkColumn = $this->getTransactionEnergiePkColumn();
            $pkQuoted = sprintf('`%s`', str_replace('`', '``', $pkColumn));

            $rows = $this->db->query(
                sprintf(
                    "SELECT te.id_pompe,
                            te.%s AS id_transaction_energie,
                            te.id_energie,
                            te.quantite_delivree,
                            te.temps_charge,
                            te.statut AS te_statut,
                            t.id_transaction,
                            t.date_heure,
                            CASE WHEN tc.id_transaction IS NULL THEN 'CB' ELSE 'CCE' END AS derniere_carte,
                            e.type_energie,
                            c.libelle,
                            c.prix_litre,
                            el.type_charge,
                            el.prix_kwh,
                            COALESCE(
                              t.prix_total,
                              ROUND(
                                te.quantite_delivree
                                * CASE
                                    WHEN e.type_energie = 'carburant' THEN COALESCE(c.prix_litre, 0)
                                    ELSE COALESCE(el.prix_kwh, 0)
                                  END,
                                3
                              )
                            ) AS prix_total
                     FROM TransactionEnergie te
                     JOIN (
                       SELECT id_pompe, MAX(%s) AS max_te
                       FROM TransactionEnergie
                       WHERE id_pompe IN (%s)
                         AND statut = 'payee'
                         AND id_transaction IS NOT NULL
                       GROUP BY id_pompe
                     ) latest
                       ON latest.id_pompe = te.id_pompe
                      AND latest.max_te = te.%s
                     JOIN Energie e
                       ON e.id_energie = te.id_energie
                     LEFT JOIN Carburant c
                       ON c.id_energie = e.id_energie
                     LEFT JOIN Electricite el
                       ON el.id_energie = e.id_energie
                     LEFT JOIN `Transaction` t
                       ON t.id_transaction = te.id_transaction
                     LEFT JOIN TransactionCCE tc
                       ON tc.id_transaction = te.id_transaction",
                    $pkQuoted,
                    $pkQuoted,
                    $placeholdersPompes,
                    $pkQuoted
                ),
                $pompeIds
            )->fetchAll();

            foreach ($rows as $row) {
                $idPompe = (int) ($row['id_pompe'] ?? 0);
                if ($idPompe <= 0) continue;
                $lastCardByPompe[$idPompe] = strtoupper((string) ($row['derniere_carte'] ?? 'CB'));
                $lastTransactionByPompe[$idPompe] = [
                    'id_transaction_energie' => (int) ($row['id_transaction_energie'] ?? 0),
                    'id_energie' => (int) ($row['id_energie'] ?? 0),
                    'libelle' => $row['libelle'],
                    'prix_litre' => $row['prix_litre'] !== null ? (float) $row['prix_litre'] : null,
                    'prix_kwh' => $row['prix_kwh'] !== null ? (float) $row['prix_kwh'] : null,
                    'type_charge' => $row['type_charge'],
                    'quantite_delivree' => (float) ($row['quantite_delivree'] ?? 0),
                    'temps_charge' => $row['temps_charge'],
                    'prix_total' => (float) ($row['prix_total'] ?? 0),
                    'date_heure' => $row['date_heure'],
                    'statut' => $row['te_statut'],
                ];
            }
        }

        // ── 2. Transactions en cours (si id_transaction_energie renseigné) ──
        $ids = array_values(array_filter(
            array_column($pompes, 'id_transaction_energie'),
            fn($v) => $v !== null && $v !== ''
        ));

        $txDetails = [];

        if (!empty($ids)) {
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $pkColumn = $this->getTransactionEnergiePkColumn();
            $pkQuoted = sprintf('`%s`', str_replace('`', '``', $pkColumn));

            // ── Carburant ────────────────────────────────────
            // Energie.type_energie = 'carburant' → JOIN Carburant
            $carbRows = $this->db->query(
                sprintf(
                    "SELECT
                    te.%s AS id_transaction_energie,
                    te.id_energie,
                    te.quantite_delivree,
                    te.temps_charge,
                    te.statut        AS te_statut,
                    COALESCE(t.prix_total, te.quantite_delivree * c.prix_litre) AS prix_total,
                    t.date_heure,
                    c.libelle,
                    c.prix_litre,
                    NULL             AS prix_kwh,
                    NULL             AS type_charge
                 FROM TransactionEnergie te
                 LEFT JOIN `Transaction` t ON t.id_transaction = te.id_transaction
                 JOIN Energie e       ON e.id_energie     = te.id_energie
                 JOIN Carburant c     ON c.id_energie     = e.id_energie
                 WHERE te.%s IN ($placeholders)
                   AND e.type_energie = 'carburant'",
                    $pkQuoted,
                    $pkQuoted
                ),
                $ids
            )->fetchAll();

            // ── Electricité ──────────────────────────────────
            $elecRows = $this->db->query(
                sprintf(
                    "SELECT
                    te.%s AS id_transaction_energie,
                    te.id_energie,
                    te.quantite_delivree,
                    te.temps_charge,
                    te.statut        AS te_statut,
                    COALESCE(t.prix_total, te.quantite_delivree * el.prix_kwh) AS prix_total,
                    t.date_heure,
                    NULL             AS libelle,
                    NULL             AS prix_litre,
                    el.prix_kwh,
                    el.type_charge
                 FROM TransactionEnergie te
                 LEFT JOIN `Transaction` t  ON t.id_transaction = te.id_transaction
                 JOIN Energie e        ON e.id_energie     = te.id_energie
                 JOIN Electricite el   ON el.id_energie    = e.id_energie
                 WHERE te.%s IN ($placeholders)
                   AND e.type_energie = 'electricite'",
                    $pkQuoted,
                    $pkQuoted
                ),
                $ids
            )->fetchAll();

            // Indexer par id_transaction_energie pour lookup O(1)
            foreach (array_merge($carbRows, $elecRows) as $row) {
                $key = (int) $row['id_transaction_energie'];
                $txDetails[$key] = $row;
            }
        }

        // ── 3. Assembler ─────────────────────────────────────
        return array_map(function (array $p) use ($txDetails, $lastCardByPompe, $lastTransactionByPompe): array {
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
                'derniere_carte' => $lastCardByPompe[(int) $p['id_pompe']] ?? 'CB',
                'derniere_transaction' => $lastTransactionByPompe[(int) $p['id_pompe']] ?? null,
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
     * Bascule l'activation manuelle d'une pompe :
     * active <-> desactivee
     * (interdit pendant une livraison en cours et pendant une transaction
     * énergie en attente d'encaissement).
     *
     * @throws RuntimeException code 404 si introuvable, 409 si verrouillée
     */
    public function basculerActivation(int $idPompe): array
    {
        $pompe = $this->findById($idPompe);
        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }

        $statut = (string) ($pompe['statut'] ?? '');
        $idTransactionEnergie = isset($pompe['id_transaction_energie']) && $pompe['id_transaction_energie'] !== ''
            ? (int) $pompe['id_transaction_energie']
            : 0;

        if ($statut === 'en_cours') {
            throw new RuntimeException("La pompe {$pompe['numero']} est en cours de livraison.", 409);
        }

        if ($statut === 'desactivee' && $idTransactionEnergie > 0) {
            if (($pompe['mode'] ?? '') === 'auto') {
                $pkColumn = $this->getTransactionEnergiePkColumn();
                $pkQuoted = sprintf('`%s`', str_replace('`', '``', $pkColumn));
                $te = $this->db->query(
                    sprintf(
                        "SELECT statut
                         FROM TransactionEnergie
                         WHERE %s = ?
                         LIMIT 1",
                        $pkQuoted
                    ),
                    [$idTransactionEnergie]
                )->fetch();

                if (!$te || ($te['statut'] ?? '') === 'payee') {
                    $this->db->execute(
                        "UPDATE Pompe
                         SET statut = 'active', date_debut = NULL, id_transaction_energie = NULL
                         WHERE id_pompe = ?",
                        [$idPompe]
                    );
                    return ['id_pompe' => $idPompe, 'statut' => 'active'];
                }

                $this->validerPaiement($idPompe, $idTransactionEnergie);
                return ['id_pompe' => $idPompe, 'statut' => 'active'];
            }

            throw new RuntimeException(
                "La pompe {$pompe['numero']} est en attente d'encaissement.",
                409
            );
        }

        $next = ($statut === 'active') ? 'desactivee' : 'active';
        $this->db->execute(
            "UPDATE Pompe
             SET statut = ?, date_debut = NULL
             WHERE id_pompe = ?",
            [$next, $idPompe]
        );

        return ['id_pompe' => $idPompe, 'statut' => $next];
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
     * Démarrage d'une livraison:
     * - crée une TransactionEnergie en statut en_cours
     * - lie la pompe à cette transaction énergie
     * - NE crée PAS de Transaction (créée au moment du paiement)
     */
    public function demarrerTransactionEnergie(
        int $idPompe,
        int $idEnergie,
        float $quantiteDelivree,
        string $tempsCharge = '00:00:00'
    ): int {
        $pompe = $this->findById($idPompe);
        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }
        if (($pompe['statut'] ?? '') === 'en_cours') {
            throw new RuntimeException("La pompe {$pompe['numero']} est déjà en cours de livraison.", 409);
        }
        if (!empty($pompe['id_transaction_energie'])) {
            throw new RuntimeException(
                "La pompe {$pompe['numero']} a déjà une transaction en attente d'encaissement.",
                409
            );
        }
        if (!$this->isTransactionEnergieTransactionNullable()) {
            throw new RuntimeException(
                "La colonne TransactionEnergie.id_transaction doit accepter NULL pour créer la transaction au paiement.",
                500
            );
        }
        if ($quantiteDelivree <= 0) {
            throw new RuntimeException('La quantité livrée doit être strictement positive.', 400);
        }
        $this->assertEnergieCompatibleAvecPompe($idPompe, $idEnergie);

        $this->db->beginTransaction();
        try {
            $this->db->execute(
                "INSERT INTO TransactionEnergie
                 (`id_transaction`, id_energie, quantite_delivree, temps_charge, statut, id_pompe)
                 VALUES (NULL, ?, ?, ?, 'en_cours', ?)",
                [$idEnergie, $quantiteDelivree, $tempsCharge, $idPompe]
            );

            $idTe = (int) $this->db->lastInsertId();
            if ($idTe <= 0) {
                $pk = $this->getTransactionEnergiePkColumn();
                $row = $this->db->query(
                    sprintf(
                        "SELECT `%s` AS id_te
                         FROM TransactionEnergie
                         WHERE id_pompe = ?
                         ORDER BY `%s` DESC
                         LIMIT 1",
                        str_replace('`', '``', $pk),
                        str_replace('`', '``', $pk)
                    ),
                    [$idPompe]
                )->fetch();
                $idTe = (int) ($row['id_te'] ?? 0);
            }
            if ($idTe <= 0) {
                throw new RuntimeException("Impossible de créer la transaction énergie.", 500);
            }

            $this->db->execute(
                "UPDATE Pompe
                 SET statut = 'en_cours', date_debut = NOW(), id_transaction_energie = ?
                 WHERE id_pompe = ?",
                [$idTe, $idPompe]
            );

            $this->db->commit();
            return $idTe;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Fin de livraison (avant paiement) : en_cours → desactivee
     */
    public function terminerLivraison(int $idPompe): void
    {
        $pompe = $this->findById($idPompe);
        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }
        if (($pompe['statut'] ?? '') !== 'en_cours') {
            throw new RuntimeException("La pompe {$pompe['numero']} n'est pas en cours de livraison.", 409);
        }
        if (empty($pompe['id_transaction_energie'])) {
            throw new RuntimeException("Aucune transaction énergie en cours pour la pompe {$pompe['numero']}.", 409);
        }

        $this->db->execute(
            "UPDATE Pompe SET statut = 'desactivee' WHERE id_pompe = ?",
            [$idPompe]
        );
    }

    public function getRandomEnergieIdForPompe(int $idPompe): int
    {
        $pompe = $this->findById($idPompe);
        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }

        if (($pompe['type_pompe'] ?? '') === 'carburant') {
            $row = $this->db->query(
                "SELECT e.id_energie
                 FROM Energie e
                 WHERE e.type_energie = 'carburant'
                 ORDER BY RAND()
                 LIMIT 1"
            )->fetch();
        } else {
            $row = $this->db->query(
                "SELECT e.id_energie
                 FROM Energie e
                 JOIN Electricite el ON el.id_energie = e.id_energie
                 WHERE e.type_energie = 'electricite'
                   AND el.type_charge = ?
                 ORDER BY RAND()
                 LIMIT 1",
                [($pompe['sous_type'] ?? 'lente')]
            )->fetch();
        }

        $idEnergie = (int) ($row['id_energie'] ?? 0);
        if ($idEnergie <= 0) {
            throw new RuntimeException("Aucune énergie disponible pour la pompe {$pompe['numero']}.", 404);
        }

        return $idEnergie;
    }

    /**
     * Retourne la liste des carburants disponibles pour le simulateur.
     *
     * @return array<int, array{id_energie:int, libelle:string, prix_litre:float}>
     */
    public function getCarburantsDisponibles(): array
    {
        $rows = $this->db->query(
            "SELECT c.id_energie, c.libelle, c.prix_litre
             FROM Carburant c
             JOIN Energie e ON e.id_energie = c.id_energie
             WHERE e.type_energie = 'carburant'
             ORDER BY c.libelle ASC"
        )->fetchAll();

        return array_map(static function (array $row): array {
            return [
                'id_energie' => (int) ($row['id_energie'] ?? 0),
                'libelle' => (string) ($row['libelle'] ?? ''),
                'prix_litre' => (float) ($row['prix_litre'] ?? 0),
            ];
        }, $rows);
    }

    /**
     * Paiement validé : desactivee → active + TransactionEnergie → payee
     * Transaction atomique.
     */
    public function validerPaiement(
        int $idPompe,
        int $idTransactionEnergie,
        ?int $forcedTransactionId = null,
        ?int $cceCardId = null
    ): int
    {
        $pompe = $this->findById($idPompe);
        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }

        $idTePompe = isset($pompe['id_transaction_energie']) && $pompe['id_transaction_energie'] !== ''
            ? (int) $pompe['id_transaction_energie']
            : 0;
        if ($idTePompe !== $idTransactionEnergie) {
            throw new RuntimeException(
                "La transaction énergie $idTransactionEnergie n'est pas associée à la pompe {$pompe['numero']}.",
                409
            );
        }

        $pkColumn = $this->getTransactionEnergiePkColumn();
        $pkQuoted = sprintf('`%s`', str_replace('`', '``', $pkColumn));

        $te = $this->db->query(
            sprintf(
                "SELECT statut, id_pompe, id_energie, quantite_delivree, id_transaction
                 FROM TransactionEnergie
                 WHERE %s = ?
                 LIMIT 1",
                $pkQuoted
            ),
            [$idTransactionEnergie]
        )->fetch();

        if (!$te) {
            throw new RuntimeException("Transaction énergie $idTransactionEnergie introuvable.", 404);
        }
        if ((int) ($te['id_pompe'] ?? 0) !== $idPompe) {
            throw new RuntimeException('Transaction énergie incohérente avec la pompe.', 409);
        }
        if (($te['statut'] ?? '') === 'payee') {
            throw new RuntimeException('Cette transaction énergie est déjà payée.', 409);
        }

        $this->db->beginTransaction();
        try {
            $prixUnitaire = $this->db->query(
                "SELECT e.type_energie, c.prix_litre, el.prix_kwh
                 FROM Energie e
                 LEFT JOIN Carburant c ON c.id_energie = e.id_energie
                 LEFT JOIN Electricite el ON el.id_energie = e.id_energie
                 WHERE e.id_energie = ?
                 LIMIT 1",
                [(int) $te['id_energie']]
            )->fetch();
            if (!$prixUnitaire) {
                throw new RuntimeException('Énergie introuvable.', 404);
            }

            $qte = (float) $te['quantite_delivree'];
            $prix = ($prixUnitaire['type_energie'] === 'carburant')
                ? (float) ($prixUnitaire['prix_litre'] ?? 0)
                : (float) ($prixUnitaire['prix_kwh'] ?? 0);
            $total = round($qte * $prix, 3);

            if ($prixUnitaire['type_energie'] === 'carburant') {
                $stockRow = $this->db->query(
                    "SELECT s.quantite_stock
                     FROM Stock s
                     JOIN Energie e ON e.id_article = s.id_article
                     WHERE e.id_energie = ?
                       AND s.type_quantite = 'litre'
                     LIMIT 1",
                    [(int) $te['id_energie']]
                )->fetch();

                if (!$stockRow || (float) ($stockRow['quantite_stock'] ?? 0) < $qte) {
                    throw new RuntimeException('Stock carburant insuffisant pour valider le paiement.', 409);
                }
            }

            $existingTransactionId = (int) ($te['id_transaction'] ?? 0);
            $forcedId = ($forcedTransactionId !== null && $forcedTransactionId > 0)
                ? $forcedTransactionId
                : 0;

            if ($forcedId > 0) {
                if ($existingTransactionId > 0 && $existingTransactionId !== $forcedId) {
                    throw new RuntimeException(
                        "La transaction énergie $idTransactionEnergie est déjà liée à une autre transaction.",
                        409
                    );
                }

                $exists = $this->db->query(
                    'SELECT id_transaction
                     FROM `Transaction`
                     WHERE id_transaction = ?
                     LIMIT 1',
                    [$forcedId]
                )->fetch();
                if (!$exists) {
                    throw new RuntimeException("Transaction $forcedId introuvable.", 404);
                }

                $this->db->execute(
                    "UPDATE `Transaction`
                     SET prix_total = ROUND(prix_total + ?, 3), date_heure = NOW()
                     WHERE id_transaction = ?",
                    [$total, $forcedId]
                );
                $idTransaction = $forcedId;
            } else {
                $idTransaction = $existingTransactionId;
                if ($idTransaction <= 0) {
                    $this->db->execute(
                        "INSERT INTO `Transaction` (prix_total, date_heure)
                         VALUES (?, NOW())",
                        [$total]
                    );
                    $idTransaction = (int) $this->db->lastInsertId();
                    if ($idTransaction <= 0) {
                        throw new RuntimeException('Impossible de créer la transaction.', 500);
                    }
                } else {
                    $this->db->execute(
                        "UPDATE `Transaction`
                         SET prix_total = ?, date_heure = NOW()
                         WHERE id_transaction = ?",
                        [$total, $idTransaction]
                    );
                }
            }

            $this->db->execute(
                sprintf(
                    "UPDATE TransactionEnergie
                     SET id_transaction = ?, statut = 'payee'
                     WHERE %s = ?",
                    $pkQuoted
                ),
                [$idTransaction, $idTransactionEnergie]
            );

            if ($cceCardId !== null && $cceCardId > 0) {
                $this->debiterCarteCce($cceCardId, $total, $idTransaction);
            }

            if ($prixUnitaire['type_energie'] === 'carburant') {
                $this->db->execute(
                    "UPDATE Stock s
                     JOIN Energie e ON e.id_article = s.id_article
                     SET s.quantite_stock = GREATEST(s.quantite_stock - ?, 0)
                     WHERE e.id_energie = ?
                       AND s.type_quantite = 'litre'",
                    [$qte, (int) $te['id_energie']]
                );
            }
            $this->db->execute(
                "UPDATE Pompe
                 SET statut = 'active', date_debut = NULL, id_transaction_energie = NULL
                 WHERE id_pompe = ?",
                [$idPompe]
            );
            $this->db->commit();
            return $idTransaction;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function debiterCarteCce(int $idCarte, float $montant, int $idTransaction): void
    {
        if ($idCarte <= 0) {
            throw new RuntimeException('Carte CCE invalide.', 400);
        }

        $row = $this->db->query(
            'SELECT solde_client
             FROM `CarteCE`
             WHERE id_carte_CE = ?
             LIMIT 1',
            [$idCarte]
        )->fetch();
        if (!$row) {
            throw new RuntimeException("Carte CCE $idCarte introuvable.", 404);
        }

        $solde = (float) ($row['solde_client'] ?? 0);
        if ($solde < $montant) {
            throw new RuntimeException('Solde CCE insuffisant.', 409);
        }

        $this->db->execute(
            'UPDATE `CarteCE`
             SET solde_client = solde_client - ?
             WHERE id_carte_CE = ?',
            [$montant, $idCarte]
        );

        $this->db->execute(
            'INSERT IGNORE INTO `TransactionCCE` (`id_transaction`, `id_carte_CE`)
             VALUES (?, ?)',
            [$idTransaction, $idCarte]
        );
    }

    private function getTransactionEnergiePkColumn(): string
    {
        if ($this->transactionEnergiePkColumn !== null) {
            return $this->transactionEnergiePkColumn;
        }

        $stmt = $this->db->query('SHOW COLUMNS FROM `TransactionEnergie`');
        $columns = $stmt->fetchAll();
        foreach ($columns as $column) {
            $field = (string) ($column['Field'] ?? '');
            if (trim($field) === 'id_transaction_energie') {
                $this->transactionEnergiePkColumn = $field;
                return $field;
            }
        }

        throw new RuntimeException('Colonne id_transaction_energie introuvable dans TransactionEnergie', 500);
    }

    private function isTransactionEnergieTransactionNullable(): bool
    {
        if ($this->transactionEnergieTransactionNullable !== null) {
            return $this->transactionEnergieTransactionNullable;
        }

        $stmt = $this->db->query('SHOW COLUMNS FROM `TransactionEnergie`');
        $columns = $stmt->fetchAll();
        foreach ($columns as $column) {
            $field = (string) ($column['Field'] ?? '');
            if (trim($field) === 'id_transaction') {
                $this->transactionEnergieTransactionNullable =
                    strtoupper((string) ($column['Null'] ?? 'NO')) === 'YES';
                return $this->transactionEnergieTransactionNullable;
            }
        }

        throw new RuntimeException('Colonne id_transaction introuvable dans TransactionEnergie', 500);
    }

    private function assertEnergieCompatibleAvecPompe(int $idPompe, int $idEnergie): void
    {
        $pompe = $this->findById($idPompe);
        if (!$pompe) {
            throw new RuntimeException("Pompe $idPompe introuvable.", 404);
        }

        $energie = $this->db->query(
            "SELECT e.type_energie, el.type_charge
             FROM Energie e
             LEFT JOIN Electricite el ON el.id_energie = e.id_energie
             WHERE e.id_energie = ?
             LIMIT 1",
            [$idEnergie]
        )->fetch();

        if (!$energie) {
            throw new RuntimeException("Énergie $idEnergie introuvable.", 404);
        }

        if (($pompe['type_pompe'] ?? '') !== ($energie['type_energie'] ?? '')) {
            throw new RuntimeException('Énergie incompatible avec le type de pompe.', 409);
        }

        if (($pompe['type_pompe'] ?? '') === 'electricite') {
            $pompeSousType = (string) ($pompe['sous_type'] ?? '');
            $energieSousType = (string) ($energie['type_charge'] ?? '');
            if ($pompeSousType !== '' && $energieSousType !== '' && $pompeSousType !== $energieSousType) {
                throw new RuntimeException('Énergie incompatible avec le sous-type de borne.', 409);
            }
        }
    }
}
