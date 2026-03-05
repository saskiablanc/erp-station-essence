<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Model Transaction - Gère les transactions de paiement
 */
class Transaction
{
    private Database $db;
    private ?string $transactionProduitTransactionColumn = null;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * Créer une nouvelle transaction avec lignes produits
     */
    public function creer(array $data): ?int
    {
        $lignes = $data['lignes'] ?? [];
        if (empty($lignes)) {
            return null;
        }

        $this->db->beginTransaction();
        try {
            $items = [];
            $total = 0.0;

            foreach ($lignes as $ligne) {
                $code = (string) ($ligne['code_barres'] ?? '');
                $qty  = (int) ($ligne['quantite'] ?? 0);
                if ($code === '' || $qty <= 0) {
                    throw new \RuntimeException('Ligne produit invalide');
                }

                $stmt = $this->db->query(
                    'SELECT code_barres, id_article, prix, quantite_produit
                     FROM `Produit`
                     WHERE code_barres = :code
                     LIMIT 1',
                    [':code' => $code]
                );
                $prod = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$prod) {
                    throw new \RuntimeException("Produit introuvable : {$code}");
                }

                $stock = (int) $prod['quantite_produit'];
                if ($stock < $qty) {
                    throw new \RuntimeException("Stock insuffisant pour {$code}");
                }

                $prix = (float) $prod['prix'];
                $stockStmt = $this->db->query(
                    "SELECT quantite_stock
                     FROM `Stock`
                     WHERE id_article = :id_article AND type_quantite = 'unite'
                     LIMIT 1",
                    [':id_article' => (int) $prod['id_article']]
                );
                $stockRow = $stockStmt->fetch(PDO::FETCH_ASSOC);
                if ($stockRow && (int) $stockRow['quantite_stock'] < $qty) {
                    throw new \RuntimeException("Stock insuffisant pour {$code}");
                }

                $total += $prix * $qty;
                $items[] = [
                    'code_barres' => (string) $prod['code_barres'],
                    'id_article'  => (int) $prod['id_article'],
                    'quantite'    => $qty,
                ];
            }

            $dateHeure = date('Y-m-d H:i:s');
            $this->db->execute(
                'INSERT INTO `Transaction` (prix_total, date_heure) VALUES (:prix_total, :date_heure)',
                ['prix_total' => $total, 'date_heure' => $dateHeure]
            );

            $idTransaction = (int) $this->db->lastInsertId();
            if ($idTransaction <= 0) {
                throw new \RuntimeException('Création transaction échouée');
            }

            foreach ($items as $item) {
                $transactionColumn = $this->getTransactionProduitTransactionColumn();
                $this->db->execute(
                    sprintf(
                        'INSERT INTO `TransactionProduit` (`%s`, `code_barres`, `quantite_produit_totale`)
                         VALUES (:id_transaction, :code_barres, :quantite)',
                        str_replace('`', '``', $transactionColumn)
                    ),
                    [
                        'id_transaction' => $idTransaction,
                        'code_barres'    => $item['code_barres'],
                        'quantite'       => $item['quantite'],
                    ]
                );

                $this->db->execute(
                    'UPDATE `Produit`
                     SET quantite_produit = quantite_produit - :quantite
                     WHERE code_barres = :code_barres',
                    [
                        'quantite'    => $item['quantite'],
                        'code_barres' => $item['code_barres'],
                    ]
                );

                $this->db->execute(
                    "UPDATE `Stock`
                     SET quantite_stock = quantite_stock - :quantite
                     WHERE id_article = :id_article AND type_quantite = 'unite'",
                    [
                        'quantite'   => $item['quantite'],
                        'id_article' => $item['id_article'],
                    ]
                );
            }

            $this->db->commit();
            return $idTransaction;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Récupérer une transaction par son ID
     */
    public function getById(int $idTransaction): ?array
    {
        $sql = "SELECT * FROM `Transaction` WHERE id_transaction = :id_transaction LIMIT 1";
        $stmt = $this->db->query($sql, ['id_transaction' => $idTransaction]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Supprimer une transaction 
     */
    public function supprimer(int $idTransaction): bool
    {
        $sql = "DELETE FROM `Transaction` WHERE id_transaction = :id";
        $rowsAffected = $this->db->execute($sql, ['id' => $idTransaction]);

        return $rowsAffected > 0;
    }

    /**
     * Mettre à jour le prix total d'une transaction
     */
    public function mettreAJourPrixTotal(int $idTransaction, float $prixTotal): bool
    {
        $sql = "UPDATE `Transaction` SET prix_total = :prix_total WHERE id_transaction = :id";
        $rowsAffected = $this->db->execute($sql, [
            'prix_total' => $prixTotal,
            'id' => $idTransaction
        ]);

        return $rowsAffected > 0;
    }

    private function getTransactionProduitTransactionColumn(): string
    {
        if ($this->transactionProduitTransactionColumn !== null) {
            return $this->transactionProduitTransactionColumn;
        }

        $stmt = $this->db->query('SHOW COLUMNS FROM `TransactionProduit`');
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($columns as $column) {
            $field = (string) ($column['Field'] ?? '');
            if (trim($field) === 'id_transaction') {
                $this->transactionProduitTransactionColumn = $field;
                return $field;
            }
        }

        throw new \RuntimeException('Colonne id_transaction introuvable dans TransactionProduit');
    }
}
