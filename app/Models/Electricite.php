<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

/**
 * Model Electricite - Gère les chargeurs électriques pour l'US28
 */
class Electricite
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function getTous(): array
    {
        $sql = "SELECT 
                    e.id_electricite,
                    e.id_energie,
                    e.prix_kwh,
                    e.type_charge
                FROM Electricite e
                ORDER BY e.type_charge ASC";

        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById(int $idElectricite): ?array
    {
        $sql = "SELECT 
                    e.id_electricite,
                    e.id_energie,
                    e.prix_kwh,
                    e.type_charge
                FROM Electricite e
                WHERE e.id_electricite = :id_electricite
                LIMIT 1";

        $stmt = $this->db->query($sql, ['id_electricite' => $idElectricite]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        return $result ?: null;
    }
}
