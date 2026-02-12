<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use Exception;

/**
 * Model Paiement - Orchestration du paiement pour l'US25
 * Gère les critères d'acceptation de l'US25 :
 * - Vérification code secret (critère 4)
 * - Gestion des 3 tentatives (critère 7)
 * - Vérification solde (critère 8)
 * - Annulation (critère 6)
 */
class Paiement
{
    private Database $db;
    private CarteCE $carteCE;
    private Transaction $transaction;

    // Pour le mode simulation (sans vraie carte)
    private string $codeSecretSimulation = "1234";
    private float $soldeSimulation = 150.00;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
        $this->carteCE = new CarteCE();
        $this->transaction = new Transaction();
    }

    /**
     * MODE 1 : Paiement en simulation (pour tester le TPE sans BD)
     */
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
     * 
     * @param int $idCarteCE L'identifiant de la carte CCE
     * @param string $codeSecret Le code secret saisi
     * @param float $montant Le montant à payer
     * @return array Résultat avec status et message
     */
    public function traiterPaiementCarteCCE(
        int $idCarteCE, 
        string $codeSecret, 
        float $montant
    ): array {
        // CRITÈRE 4 : Vérifier le code secret
        if (!$this->carteCE->verifierCodeSecret($idCarteCE, $codeSecret)) {
            // CRITÈRE 7 : Gestion des tentatives (géré côté JS actuellement)
            return [
                'status' => 'erreur_code',
                'message' => 'Erreur : Code Secret incorrect'
            ];
        }

        // CRITÈRE 8 : Vérifier le solde
        if (!$this->carteCE->verifierSolde($idCarteCE, $montant)) {
            return [
                'status' => 'solde_insuffisant',
                'message' => 'Paiement Refusé : Solde Insuffisant'
            ];
        }

        // Démarrer une transaction SQL pour garantir l'intégrité
        $this->db->beginTransaction();

        try {
            // 1. Créer la transaction dans la BD
            $idTransaction = $this->transaction->creer($montant);
            
            if (!$idTransaction) {
                throw new Exception('Erreur lors de la création de la transaction');
            }

            // 2. Débiter la carte CCE
            if (!$this->carteCE->debiter($idCarteCE, $montant)) {
                throw new Exception('Erreur lors du débit de la carte CCE');
            }

            // Valider la transaction SQL
            $this->db->commit();

            return [
                'status' => 'ok',
                'message' => 'Paiement accepté',
                'id_transaction' => $idTransaction
            ];

        } catch (Exception $e) {
            // Annuler la transaction en cas d'erreur
            $this->db->rollBack();
            
            return [
                'status' => 'erreur',
                'message' => 'Erreur lors du paiement'
            ];
        }
    }

    /**
     * CRITÈRE 6 : Annuler un paiement
     */
    public function annulerPaiement(int $idTransaction): bool
    {
        return $this->transaction->supprimer($idTransaction);
    }
}