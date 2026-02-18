<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use Exception;

/**
 * Model Paiement - Orchestration du paiement pour l'US25
 * Gère les critères d'acceptation de l'US25
*/

class Paiement
{
    private Database $db;
    private CarteCE $carteCE;
    private Transaction $transaction;

    // Pour le mode simulation
    private string $codeSecretSimulation = "2121";
    private float $soldeSimulation = 150.00;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
        $this->carteCE = new CarteCE();
        $this->transaction = new Transaction();
    }

    public function verifierPaiement(string $code, float $montant): array
    {
        if ($code !== $this->codeSecretSimulation) {
            return [
                "status" => "erreur_code",
                "message" => "Erreur : Code Secret incorrect"
            ];
        }

        if ($montant > $this->soldeSimulation) {
            return [
                "status" => "solde_insuffisant",
                "message" => "Paiement Refusé : Solde Insuffisant"
            ];
        }

        return [
            "status" => "ok",
            "message" => "Paiement accepté"
        ];
    }

    /**
     * MODE 2 : Paiement réel avec carte CCE (US25 complet)
     * Gère tous les critères d'acceptation de l'US25
     */
    public function traiterPaiementCarteCCE(
        int $idCarteCE, 
        string $codeSecret, 
        float $montant
    ): array {
        if (!$this->carteCE->verifierCodeSecret($idCarteCE, $codeSecret)) {
            return [
                'status' => 'erreur_code',
                'message' => 'Erreur : Code Secret incorrect'
            ];
        }

        if (!$this->carteCE->verifierSolde($idCarteCE, $montant)) {
            return [
                'status' => 'solde_insuffisant',
                'message' => 'Paiement Refusé : Solde Insuffisant'
            ];
        }

        // Démarrer une transaction SQL pour garantir l'intégrité
        $this->db->beginTransaction();

        try {
            $idTransaction = $this->transaction->creer($montant);
            
            if (!$idTransaction) {
                throw new Exception('Erreur lors de la création de la transaction');
            }

            if (!$this->carteCE->debiter($idCarteCE, $montant)) {
                throw new Exception('Erreur lors du débit de la carte CCE');
            }

            $this->db->commit();

            return [
                'status' => 'ok',
                'message' => 'Paiement accepté',
                'id_transaction' => $idTransaction
            ];

        } catch (Exception $e) {
            $this->db->rollBack();
            
            return [
                'status' => 'erreur',
                'message' => 'Erreur lors du paiement'
            ];
        }
    }

    public function annulerPaiement(int $idTransaction): bool
    {
        return $this->transaction->supprimer($idTransaction);
    }
}