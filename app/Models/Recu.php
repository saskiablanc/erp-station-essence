<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;
use RuntimeException;

final class Recu
{
    private Database $db;
    private ?string $printStatusColumn = null;
    private bool $printStatusResolved = false;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * @param int[] $transactionIds
     * @return array<int, array<string, int|string>>
     */
    public function creerPourTransactions(array $transactionIds, string $modePaiement): array
    {
        $ids = array_values(array_unique(array_filter(array_map('intval', $transactionIds), static fn (int $id): bool => $id > 0)));
        if ($ids === []) {
            throw new RuntimeException('Aucune transaction valide pour le reçu.');
        }

        $this->db->beginTransaction();
        try {
            $inserted = [];

            foreach ($ids as $idTransaction) {
                $exists = $this->db->query(
                    'SELECT id_transaction FROM `Transaction` WHERE id_transaction = :id LIMIT 1',
                    [':id' => $idTransaction]
                )->fetch(PDO::FETCH_ASSOC);

                if (!$exists) {
                    throw new RuntimeException("Transaction #{$idTransaction} introuvable.");
                }

                $numCarte = $this->genererNumCarte($modePaiement, $idTransaction);

                $this->insererRecu($idTransaction, $numCarte);

                $inserted[] = [
                    'id_recu' => (int) $this->db->lastInsertId(),
                    'id_transaction' => $idTransaction,
                    'num_carte' => $numCarte,
                ];
            }

            $this->db->commit();
            return $inserted;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function genererNumCarte(string $modePaiement, int $idTransaction): int
    {
        $prefix = strtolower(trim($modePaiement)) === 'cce' ? 2 : 1;
        $suffix = $idTransaction % 100000;
        return (int) ($prefix * 100000 + $suffix);
    }

    private function insererRecu(int $idTransaction, int $numCarte): void
    {
        $baseParams = [
            ':id_transaction' => $idTransaction,
            ':num_carte' => $numCarte,
        ];

        $printStatusColumn = $this->getPrintStatusColumn();
        if ($printStatusColumn !== null) {
            try {
                $this->db->execute(
                    sprintf(
                        'INSERT INTO `Recu` (id_transaction, num_carte, horodatage, `%s`)
                         VALUES (:id_transaction, :num_carte, NOW(), :print_status)',
                        str_replace('`', '``', $printStatusColumn)
                    ),
                    $baseParams + [':print_status' => 'impression en cours']
                );
                return;
            } catch (\Throwable $e) {
                // Fallback sans statut si la colonne n'accepte pas cette valeur.
            }
        }

        $this->db->execute(
            'INSERT INTO `Recu` (id_transaction, num_carte, horodatage)
             VALUES (:id_transaction, :num_carte, NOW())',
            $baseParams
        );
    }

    private function getPrintStatusColumn(): ?string
    {
        if ($this->printStatusResolved) {
            return $this->printStatusColumn;
        }

        $stmt = $this->db->query('SHOW COLUMNS FROM `Recu`');
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $candidates = ['statut_impression', 'etat_impression', 'impression', 'statut'];

        foreach ($columns as $column) {
            $field = trim((string) ($column['Field'] ?? ''));
            if (in_array($field, $candidates, true)) {
                $this->printStatusColumn = $field;
                $this->printStatusResolved = true;
                return $field;
            }
        }

        $this->printStatusResolved = true;
        return null;
    }
}
