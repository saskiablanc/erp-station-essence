<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

class Article
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function findByCodeBarres(string $code): ?array
    {
        $stmt = $this->db->query(
            "SELECT p.code_barres,
                    p.libelle_produit,
                    p.prix,
                    COALESCE(s.quantite_stock, 0) AS quantite_stock
             FROM Produit p
             LEFT JOIN Stock s
               ON s.id_article = p.id_article
              AND s.type_quantite = 'unite'
             WHERE p.code_barres = :code
             LIMIT 1",
            [':code' => $code]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        $stockGlobal = (int) ($row['quantite_stock'] ?? 0);

        return [
            'code_barres' => (string) $row['code_barres'],
            'libelle'     => $row['libelle_produit'],
            'prix'        => (float) $row['prix'],
            'stock_disponible' => ($stockGlobal > 0),
        ];
    }

    public function findRandomProduit(): ?array
    {
        $stmt = $this->db->query(
            "SELECT p.code_barres, p.libelle_produit, p.prix
             FROM Produit p
             JOIN Stock s
               ON s.id_article = p.id_article
              AND s.type_quantite = 'unite'
             WHERE s.quantite_stock > 0
             ORDER BY RAND()
             LIMIT 1"
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return [
            'code_barres' => (string) $row['code_barres'],
            'libelle'     => $row['libelle_produit'],
            'prix'        => (float) $row['prix'],
        ];
    }
}
