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
            'SELECT code_barres, libelle_produit, prix
             FROM Produit
             WHERE code_barres = :code
             LIMIT 1',
            [':code' => $code]
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

    public function findRandomProduit(): ?array
    {
        $stmt = $this->db->query(
            'SELECT code_barres, libelle_produit, prix
             FROM Produit
             ORDER BY RAND()
             LIMIT 1'
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
