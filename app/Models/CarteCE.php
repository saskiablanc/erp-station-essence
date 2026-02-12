<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Model CarteCE - Gère les cartes de crédit énergie
 * Adapté au schéma SQL existant pour l'US25
 */
class CarteCE
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * Vérifier le code secret d'une carte CCE
     */
    public function verifierCodeSecret(int $idCarteCE, string $codeSecret): bool
    {
        $sql = "SELECT code_secret FROM CarteCE WHERE id_carte_CE = :id_carte LIMIT 1";
        $stmt = $this->db->query($sql, ['id_carte' => $idCarteCE]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return false;
        }

        // Comparaison simple car code_secret est INT dans votre BD
        return (string)$result['code_secret'] === $codeSecret;
    }

    /**
     * Vérifier si le solde est suffisant
     */
    public function verifierSolde(int $idCarteCE, float $montant): bool
    {
        $sql = "SELECT solde_client FROM CarteCE WHERE id_carte_CE = :id_carte LIMIT 1";
        $stmt = $this->db->query($sql, ['id_carte' => $idCarteCE]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result) {
            return false;
        }

        return (float)$result['solde_client'] >= $montant;
    }

    /**
     * Débiter une carte CCE (US25 - critère d'acceptation)
     */
    public function debiter(int $idCarteCE, float $montant): bool
    {
        $sql = "UPDATE CarteCE 
                SET solde_client = solde_client - :montant 
                WHERE id_carte_CE = :id_carte 
                AND solde_client >= :montant_check";
        
        $rowsAffected = $this->db->execute($sql, [
            'montant' => $montant,
            'id_carte' => $idCarteCE,
            'montant_check' => $montant
        ]);

        return $rowsAffected > 0;
    }

    /**
     * Obtenir le solde actuel
     */
    public function getSolde(int $idCarteCE): ?float
    {
        $sql = "SELECT solde_client FROM CarteCE WHERE id_carte_CE = :id_carte LIMIT 1";
        $stmt = $this->db->query($sql, ['id_carte' => $idCarteCE]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ? (float)$result['solde_client'] : null;
    }

    /**
     * Récupérer les informations d'une carte CCE
     */
    public function getCarteById(int $idCarteCE): ?array
    {
        $sql = "SELECT * FROM CarteCE WHERE id_carte_CE = :id_carte LIMIT 1";
        $stmt = $this->db->query($sql, ['id_carte' => $idCarteCE]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result ?: null;
    }
}