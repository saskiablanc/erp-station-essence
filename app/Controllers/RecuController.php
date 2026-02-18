<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Recu;

/**
 * RecuController - US26
 * Gère l'impression du reçu après paiement (automate 24 et caisse)
 */
class RecuController extends Controller
{
    private Recu $recuModel;

    public function __construct()
    {
        $this->recuModel = new Recu();
    }

    /**
     * US26.1 - Automate 24 : le client accepte le reçu sur la borne
     * US26.2 - Caisse     : l'employé clique "Imprimer le reçu"
     *
     * POST recu/imprimer
     * Réponse JSON : { status, id_recu } ou { status, message }
     */
    public function imprimer(): void
    {
        header('Content-Type: application/json');

        $idTransaction = (int) ($_SESSION['id_transaction_courante'] ?? 0);
        $numCarte      = (int) ($_SESSION['num_carte'] ?? 0);

        if ($idTransaction === 0) {
            echo json_encode([
                'status'  => 'erreur',
                'message' => 'Aucune transaction en cours'
            ]);
            exit;
        }

        if ($numCarte === 0) {
            echo json_encode([
                'status'  => 'erreur',
                'message' => 'Numéro de carte manquant'
            ]);
            exit;
        }

        $idRecu = $this->recuModel->inserer($idTransaction, $numCarte);

        if ($idRecu === null) {
            echo json_encode([
                'status'  => 'erreur',
                'message' => 'Erreur lors de la création du reçu'
            ]);
            exit;
        }

        echo json_encode([
            'status'  => 'ok',
            'id_recu' => $idRecu
        ]);
        exit;
    }

    /**
     * US26.2 - Caisse : afficher la page avec le bouton "Imprimer le reçu"
     *
     * GET recu/caisse
     */
    public function caisse(): void
    {
        $idTransaction = (int) ($_SESSION['id_transaction_courante'] ?? 0);
        $montant       = (float) ($_SESSION['montant_a_payer'] ?? 0);

        $this->render('recu_caisse', [
            'id_transaction' => $idTransaction,
            'montant'        => $montant,
        ]);
    }
}