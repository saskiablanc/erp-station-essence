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

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * Créer une nouvelle transaction (US25)
     */
    public function creer(float $prixTotal): ?int
    {
        $dateHeure = date('Y-m-d H:i:s');
        
        $sql = "INSERT INTO Transaction (prix_total, date_heure) 
                VALUES (:prix_total, :date_heure)";
        
        $this->db->execute($sql, [
            'prix_total' => $prixTotal,
            'date_heure' => $dateHeure
        ]);

        $lastId = $this->db->lastInsertId();
        return $lastId ? (int)$lastId : null;
    }

    /**
     * Récupérer une transaction par son ID
     */
    public function getById(int $idTransaction): ?array
    {
        $sql = "SELECT * FROM Transaction WHERE id_transaction = :id_transaction LIMIT 1";
        $stmt = $this->db->query($sql, ['id_transaction' => $idTransaction]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Supprimer une transaction 
     */
    public function supprimer(int $idTransaction): bool
    {
        $sql = "DELETE FROM Transaction WHERE id_transaction = :id";
        $rowsAffected = $this->db->execute($sql, ['id' => $idTransaction]);

        return $rowsAffected > 0;
    }
}