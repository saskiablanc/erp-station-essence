<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;

class Connexion
{
    private Database $db;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    /**
     * Critère 1 : vérifie les identifiants saisis par l'employé.
     * Retourne les données du compte si OK, null sinon.
     */
    public function authenticate(string $identifiant, string $mdp): ?array
    {
        $stmt = $this->db->query(
            'SELECT id_connexion, identifiant, mdp, role
             FROM Connexion
             WHERE identifiant = :identifiant
             LIMIT 1',
            [':identifiant' => $identifiant]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        // Critère 2 : identifiants incorrects → retourne null
        if (!$row || !password_verify($mdp, $row['mdp'])) {
            return null;
        }

        return [
            'id_connexion' => (int) $row['id_connexion'],
            'identifiant'  => $row['identifiant'],
            'role'         => $row['role'],
        ];
    }
}