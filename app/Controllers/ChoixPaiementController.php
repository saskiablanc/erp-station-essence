<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;

/**
 * ChoixPaiementController - Gère l'US24 : Choix Mode Paiement Borne
 * 
 * Critères d'acceptation :
 * 1. L'écran affiche les instructions de paiement
 * 2. Le client choisit CCE ou Carte bancaire
 * 3. Retour arrière possible
 */
class ChoixPaiementController extends Controller
{
    /**
     * US24 - Critère 1 : Afficher l'écran de choix
     * Route : GET /choix-paiement
     */
    public function index(): void
    {
        // Récupérer le montant depuis GET ou SESSION
        $montant = (float) ($_GET['montant'] ?? $_SESSION['montant_a_payer'] ?? 80.00);
        
        // Stocker en session pour la suite
        $_SESSION['montant_a_payer'] = $montant;

        // Afficher la vue
        $this->render('choix_paiement', [
            'montant' => $montant
        ]);
    }

    /**
     * US24 - Critère 2 : Enregistrer le choix du client
     * Route : POST /choix-paiement/selectionner
     */
    public function selectionner(): void
    {
        // Récupérer le type de carte choisi
        $typeCarte = $_POST['type_carte'] ?? '';
        $montant = (float) ($_POST['montant'] ?? $_SESSION['montant_a_payer'] ?? 80.00);

        // Validation
        if (!in_array($typeCarte, ['bancaire', 'cce'], true)) {
            // Si type invalide, retour au choix
            $_SESSION['erreur'] = 'Veuillez choisir un mode de paiement valide';
            $this->redirect($this->buildUrl('choix-paiement', ['montant' => $montant]));
            return;
        }

        // Stocker le choix en session
        $_SESSION['type_carte'] = $typeCarte;
        $_SESSION['montant_a_payer'] = $montant;

        // Rediriger vers le TPE (US25)
        $this->redirect($this->buildUrl('paiement'));
    }

    /**
     * US24 - Critère 3 : Annuler et retourner au choix
     * Appelée depuis le TPE si le client veut changer de mode
     */
    public function retour(): void
    {
        // Garder le montant mais effacer le type de carte
        $montant = $_SESSION['montant_a_payer'] ?? 80.00;
        unset($_SESSION['type_carte']);

        // Retour vers le choix
        $this->redirect($this->buildUrl('choix-paiement', ['montant' => $montant]));
    }

    private function buildUrl(string $page, array $params = []): string
    {
        $base = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/');
        $url = ($base !== '' ? $base : '') . '/index.php?page=' . $page;
        if ($params) {
            $url .= '&' . http_build_query($params);
        }
        return $url;
    }
}
