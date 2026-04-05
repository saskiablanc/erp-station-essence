<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Controller;
use App\Models\Bdd;
use Throwable;

class BddController extends Controller
{
    private function bdd(): Bdd { return new Bdd(); }

    private function wrap(callable $fn): void
    {
        try { $this->requireGerant(); $this->json($fn()); }
        catch (Throwable $e) { $this->jsonError($e->getMessage()); }
    }
    private function wrapVoid(callable $fn): void
    {
        try { $this->requireGerant(); $fn(); $this->json(['ok' => true]); }
        catch (Throwable $e) { $this->jsonError($e->getMessage()); }
    }

    // ── Dispatch générique ────────────────────────────────
    public function getTable(string $table): void
    {
        $this->wrap(fn() => match($table) {
            'article'             => $this->bdd()->getArticle(),
            'produit'             => $this->bdd()->getProduit(),
            'energie'             => $this->bdd()->getEnergie(),
            'carburant'           => $this->bdd()->getCarburant(),
            'electricite'         => $this->bdd()->getElectricite(),
            'stock'               => $this->bdd()->getStock(),
            'client'              => $this->bdd()->getClient(),
            'cce'                 => $this->bdd()->getCarteCCE(),
            'connexion'           => $this->bdd()->getConnexion(),
            'transaction'         => $this->bdd()->getTransaction(),
            'transaction_cce'     => $this->bdd()->getTransactionCCE(),
            'transaction_produit' => $this->bdd()->getTransactionProduit(),
            'transaction_energie' => $this->bdd()->getTransactionEnergie(),
            'recu'                => $this->bdd()->getRecu(),
            'pompe'               => $this->bdd()->getPompe(),
            'reappro'             => $this->bdd()->getReappro(),
            'ligne_reappro'       => $this->bdd()->getLigneReappro(),
            'valeurs_defaut'      => $this->bdd()->getValeursDefaut(),
            'fiche_incident'      => $this->bdd()->getFicheIncident(),
            'jour_fermeture'      => $this->bdd()->getJourFermeture(),
            'jour_semaine'        => $this->bdd()->getJourSemaine(),
            'horaire'             => $this->bdd()->getHoraire(),
            'params_cce'          => $this->bdd()->getParamsCCE(),
            'bonus_cce'           => $this->bdd()->getBonusCCE(),
            'validation_transactions' => $this->bdd()->getValidationTransactions(),
            'validation_incidents'    => $this->bdd()->getValidationIncidents(),
            default               => throw new \RuntimeException("Table inconnue: $table"),
        });
    }

    public function addTable(string $table): void
    {
        $d = $this->body();
        $this->wrap(fn() => match($table) {
            'article'             => $this->bdd()->addArticle($d),
            'produit'             => $this->bdd()->addProduit($d),
            'energie'             => $this->bdd()->addEnergie($d),
            'carburant'           => $this->bdd()->addCarburant($d),
            'electricite'         => $this->bdd()->addElectricite($d),
            'stock'               => $this->bdd()->addStock($d),
            'client'              => $this->bdd()->addClient($d),
            'connexion'           => $this->bdd()->addConnexion($d),
            'transaction'         => $this->bdd()->addTransaction($d),
            'transaction_cce'     => $this->bdd()->addTransactionCCE($d),
            'transaction_produit' => $this->bdd()->addTransactionProduit($d),
            'transaction_energie' => $this->bdd()->addTransactionEnergie($d),
            'recu'                => $this->bdd()->addRecu($d),
            'pompe'               => $this->bdd()->addPompe($d),
            'reappro'             => $this->bdd()->addReappro($d),
            'ligne_reappro'       => $this->bdd()->addLigneReappro($d),
            'valeurs_defaut'      => $this->bdd()->addValeursDefaut($d),
            'fiche_incident'      => $this->bdd()->addFicheIncident($d),
            'jour_fermeture'      => $this->bdd()->addJourFermeture($d),
            'jour_semaine'        => $this->bdd()->addJourSemaine($d),
            'horaire'             => $this->bdd()->addHoraire($d),
            'bonus_cce'           => $this->bdd()->addBonusCCE($d),
            'validation_transactions' => $this->bdd()->addValidationTransactions($d),
            'validation_incidents'    => $this->bdd()->addValidationIncidents($d),
            default               => throw new \RuntimeException("Ajout non supporté: $table"),
        });
    }

    public function putTable(string $table, string $id): void
    {
        $d = $this->body();
        $this->wrap(fn() => match($table) {
            'article'             => $this->bdd()->updateArticle((int)$id, $d),
            'produit'             => $this->bdd()->updateProduit($id, $d),
            'energie'             => $this->bdd()->updateEnergie((int)$id, $d),
            'carburant'           => $this->bdd()->updateCarburant((int)$id, $d),
            'electricite'         => $this->bdd()->updateElectricite((int)$id, $d),
            'stock'               => $this->bdd()->updateStock((int)$id, $d),
            'client'              => $this->bdd()->updateClient((int)$id, $d),
            'cce'                 => $this->bdd()->updateCarteCCE((int)$id, $d),
            'connexion'           => $this->bdd()->updateConnexion((int)$id, $d),
            'transaction'         => $this->bdd()->updateTransaction((int)$id, $d),
            'transaction_cce'     => $this->bdd()->updateTransactionCCE($id, $d),
            'transaction_produit' => $this->bdd()->updateTransactionProduit((int)$id, $d),
            'transaction_energie' => $this->bdd()->updateTransactionEnergie((int)$id, $d),
            'recu'                => $this->bdd()->updateRecu((int)$id, $d),
            'pompe'               => $this->bdd()->updatePompe((int)$id, $d),
            'reappro'             => $this->bdd()->updateReappro((int)$id, $d),
            'ligne_reappro'       => $this->bdd()->updateLigneReappro($id, $d),
            'valeurs_defaut'      => $this->bdd()->updateValeursDefaut((int)$id, $d),
            'fiche_incident'      => $this->bdd()->updateFicheIncident((int)$id, $d),
            'jour_fermeture'      => $this->bdd()->updateJourFermeture((int)$id, $d),
            'jour_semaine'        => $this->bdd()->updateJourSemaine((int)$id, $d),
            'horaire'             => $this->bdd()->updateHoraire((int)$id, $d),
            'params_cce'          => $this->bdd()->updateParamsCCE((int)$id, $d),
            'bonus_cce'           => $this->bdd()->updateBonusCCE((int)$id, $d),
            'validation_transactions' => $this->bdd()->updateValidationTransactions((int)$id, $d),
            'validation_incidents'    => $this->bdd()->updateValidationIncidents((int)$id, $d),
            default               => throw new \RuntimeException("Modification non supportée: $table"),
        });
    }

    public function delTable(string $table, string $id): void
    {
        $this->wrapVoid(fn() => match($table) {
            'article'             => $this->bdd()->deleteArticle((int)$id),
            'produit'             => $this->bdd()->deleteProduit($id),
            'energie'             => $this->bdd()->deleteEnergie((int)$id),
            'carburant'           => $this->bdd()->deleteCarburant((int)$id),
            'electricite'         => $this->bdd()->deleteElectricite((int)$id),
            'stock'               => $this->bdd()->deleteStock((int)$id),
            'client'              => $this->bdd()->deleteClient((int)$id),
            'cce'                 => $this->bdd()->deleteCarteCCE((int)$id),
            'connexion'           => $this->bdd()->deleteConnexion((int)$id),
            'transaction'         => $this->bdd()->deleteTransaction((int)$id),
            'transaction_cce'     => $this->bdd()->deleteTransactionCCE($id),
            'transaction_produit' => $this->bdd()->deleteTransactionProduit((int)$id),
            'transaction_energie' => $this->bdd()->deleteTransactionEnergie((int)$id),
            'recu'                => $this->bdd()->deleteRecu((int)$id),
            'pompe'               => $this->bdd()->deletePompe((int)$id),
            'reappro'             => $this->bdd()->deleteReappro((int)$id),
            'ligne_reappro'       => $this->bdd()->deleteLigneReappro($id),
            'valeurs_defaut'      => $this->bdd()->deleteValeursDefaut((int)$id),
            'fiche_incident'      => $this->bdd()->deleteFicheIncident((int)$id),
            'jour_fermeture'      => $this->bdd()->deleteJourFermeture((int)$id),
            'jour_semaine'        => $this->bdd()->deleteJourSemaine((int)$id),
            'horaire'             => $this->bdd()->deleteHoraire((int)$id),
            'bonus_cce'           => $this->bdd()->deleteBonusCCE((int)$id),
            'validation_transactions' => $this->bdd()->deleteValidationTransactions((int)$id),
            'validation_incidents'    => $this->bdd()->deleteValidationIncidents((int)$id),
            default               => throw new \RuntimeException("Suppression non supportée: $table"),
        });
    }
}
