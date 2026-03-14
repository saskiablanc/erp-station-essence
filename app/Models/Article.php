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

    public function findAllCodeBarres(): array
    {
        $stmt = $this->db->query(
            "SELECT p.code_barres, p.libelle_produit
             FROM Produit p
             ORDER BY p.code_barres ASC"
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        return array_map(
            static fn (array $row): array => [
                'code_barres' => (string) ($row['code_barres'] ?? ''),
                'libelle' => (string) ($row['libelle_produit'] ?? ''),
            ],
            $rows
        );
    }

    public function findStockProduits(): array
    {
        $stmt = $this->db->query(
            "SELECT p.code_barres,
                    p.libelle_produit,
                    COALESCE(s.quantite_stock, 0) AS quantite_stock,
                    v.seuil_alerte
             FROM Produit p
             LEFT JOIN Stock s
               ON s.id_article = p.id_article
              AND s.type_quantite = 'unite'
             LEFT JOIN ValeursDefautReappro v
               ON v.id_article = p.id_article
             ORDER BY p.libelle_produit ASC"
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        return array_map(
            static fn (array $row): array => [
                'code_barres' => (string) ($row['code_barres'] ?? ''),
                'libelle' => (string) ($row['libelle_produit'] ?? ''),
                'quantite_stock' => (int) ($row['quantite_stock'] ?? 0),
                'seuil_alerte' => isset($row['seuil_alerte']) ? (float) $row['seuil_alerte'] : null,
            ],
            $rows
        );
    }

    public function findStockCarburants(): array
    {
        $stmt = $this->db->query(
            "SELECT c.libelle,
                    c.stock_litre,
                    v.seuil_alerte
             FROM Carburant c
             LEFT JOIN Energie e
               ON e.id_energie = c.id_energie
             LEFT JOIN ValeursDefautReappro v
               ON v.id_article = e.id_article
             ORDER BY c.libelle ASC"
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        return array_map(
            static fn (array $row): array => [
                'libelle' => (string) ($row['libelle'] ?? ''),
                'quantite_stock' => (float) ($row['stock_litre'] ?? 0),
                'seuil_alerte' => isset($row['seuil_alerte']) ? (float) $row['seuil_alerte'] : null,
            ],
            $rows
        );
    }
}
