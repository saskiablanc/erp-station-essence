<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Model TransactionEnergie - Gère les transactions d'énergie pour l'US28
 * Enregistre les détails de la délivrance de carburant
 */
class TransactionEnergie
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * Créer une transaction d'énergie (carburant délivré)
     * US28 - critère 7
     */
    public function creer(
        int $idTransaction, 
        int $idEnergie, 
        float $quantiteDelivree, 
        ?string $tempsCharge = null
    ): ?int {
        // Pour les carburants, temps_charge doit être '00:00:00' selon le schéma
        $tempsCharge = $tempsCharge ?? '00:00:00';
        
        $sql = "INSERT INTO TransactionEnergie 
                (id_transaction, id_energie, quantite_delivree, temps_charge) 
                VALUES (:id_transaction, :id_energie, :quantite_delivree, :temps_charge)";
        
        $this->db->execute($sql, [
            'id_transaction' => $idTransaction,
            'id_energie' => $idEnergie,
            'quantite_delivree' => $quantiteDelivree,
            'temps_charge' => $tempsCharge
        ]);

        $lastId = $this->db->lastInsertId();
        return $lastId ? (int)$lastId : null;
    }

    /**
     * Récupérer les détails d'une transaction énergie par ID transaction
     */
    public function getByTransaction(int $idTransaction): ?array
    {
        $sql = "SELECT 
                    te.*,
                    c.libelle as carburant_libelle,
                    c.prix_litre
                FROM TransactionEnergie te
                INNER JOIN Energie e ON te.id_energie = e.id_energie
                INNER JOIN Carburant c ON e.id_energie = c.id_energie
                WHERE te.id_transaction = :id_transaction
                LIMIT 1";
        
        $stmt = $this->db->query($sql, ['id_transaction' => $idTransaction]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }

    /**
     * Mettre à jour la quantité délivrée (pendant la délivrance en temps réel)
     * US28 - critère 2
     */
    public function mettreAJourQuantite(int $idTransactionEnergie, float $quantiteDelivree): bool
    {
        $sql = "UPDATE TransactionEnergie 
                SET quantite_delivree = :quantite_delivree 
                WHERE id_transaction_energie = :id";
        
        $rowsAffected = $this->db->execute($sql, [
            'quantite_delivree' => $quantiteDelivree,
            'id' => $idTransactionEnergie
        ]);

        return $rowsAffected > 0;
    }
}