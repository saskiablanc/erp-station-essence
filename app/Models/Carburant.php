<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Model Carburant - Gère les carburants pour l'US28
 * Permet de récupérer les informations sur les carburants disponibles
 */
class Carburant
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function getTous(): array
    {
        $sql = "SELECT 
                    c.id_carburant,
                    c.libelle,
                    c.prix_litre,
                    c.stock_litre,
                    c.id_energie
                FROM Carburant c
                WHERE c.stock_litre > 0
                ORDER BY c.libelle ASC";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $idCarburant): ?array
    {
        $sql = "SELECT 
                    c.id_carburant,
                    c.libelle,
                    c.prix_litre,
                    c.stock_litre,
                    c.id_energie
                FROM Carburant c
                WHERE c.id_carburant = :id_carburant
                LIMIT 1";
        
        $stmt = $this->db->query($sql, ['id_carburant' => $idCarburant]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    public function getByLibelle(string $libelle): ?array
    {
        $sql = "SELECT 
                    c.id_carburant,
                    c.libelle,
                    c.prix_litre,
                    c.stock_litre,
                    c.id_energie
                FROM Carburant c
                WHERE c.libelle = :libelle
                LIMIT 1";
        
        $stmt = $this->db->query($sql, ['libelle' => $libelle]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    public function diminuerStock(int $idCarburant, float $quantiteDelivree): bool
    {
        // Vérifier d'abord qu'il y a assez de stock
        $carburant = $this->getById($idCarburant);
        
        if (!$carburant || $carburant['stock_litre'] < $quantiteDelivree) {
            return false;
        }

        $sql = "UPDATE Carburant 
                SET stock_litre = stock_litre - :quantite 
                WHERE id_carburant = :id_carburant 
                AND stock_litre >= :quantite_min";
        
        $rowsAffected = $this->db->execute($sql, [
            'quantite' => $quantiteDelivree,
            'quantite_min' => $quantiteDelivree,
            'id_carburant' => $idCarburant
        ]);

        return $rowsAffected > 0;
    }

    public function estDisponible(int $idCarburant, float $quantiteDemandee): bool
    {
        $carburant = $this->getById($idCarburant);
        
        if (!$carburant) {
            return false;
        }

        return $carburant['stock_litre'] >= $quantiteDemandee;
    }

    public function getPrix(int $idCarburant): ?float
    {
        $carburant = $this->getById($idCarburant);
        return $carburant ? (float)$carburant['prix_litre'] : null;
    }
}
