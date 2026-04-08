<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\ArchiveTransactions;
use App\Core\Controller;
use App\Core\Database;
use App\Models\Bdd;
use Throwable;

class BddController extends Controller
{
    private function bdd(string $profile = 'courante'): Bdd { return new Bdd($profile); }

    private function availableProfiles(): array
    {
        static $cachedProfiles = null;
        if (is_array($cachedProfiles)) {
            return $cachedProfiles;
        }

        if (!defined('CONFIG_PATH')) {
            $cachedProfiles = ['courante'];
            return $cachedProfiles;
        }

        $configFile = rtrim((string) CONFIG_PATH, '/\\') . '/database.php';
        if (!is_file($configFile)) {
            $cachedProfiles = ['courante'];
            return $cachedProfiles;
        }

        $configs = require $configFile;
        if (!is_array($configs)) {
            $cachedProfiles = ['courante'];
            return $cachedProfiles;
        }

        $declaredProfiles = [];
        foreach ($configs as $name => $cfg) {
            if (!is_string($name) || !is_array($cfg)) continue;
            if (isset($cfg['driver']) && isset($cfg['dbname'])) {
                $declaredProfiles[] = $name;
            }
        }

        if (empty($declaredProfiles)) {
            $cachedProfiles = ['courante'];
            return $cachedProfiles;
        }

        $profiles = [];
        foreach (array_values(array_unique($declaredProfiles)) as $profileName) {
            try {
                Database::getInstance($profileName)->query('SELECT 1');
                $profiles[] = $profileName;
            } catch (Throwable) {
                // Profil ignoré si la connexion n'est pas possible (droits, DB absente, etc.)
            }
        }

        if (empty($profiles)) {
            $profiles = ['courante'];
        }

        $cachedProfiles = $profiles;
        return $cachedProfiles;
    }

    private function resolveProfile(bool $write = false): string
    {
        $requested = trim((string) ($_GET['profile'] ?? 'courante'));
        if ($requested === '') {
            $requested = 'courante';
        }

        $available = $this->availableProfiles();
        if (!in_array($requested, $available, true)) {
            throw new \RuntimeException("Profil base de données inconnu : $requested");
        }

        if ($write && $requested !== 'courante') {
            throw new \RuntimeException("Le profil archive est en lecture seule.");
        }

        return $requested;
    }

    private function resolveYear(): ?int
    {
        $raw = trim((string) ($_GET['year'] ?? ''));
        if ($raw === '') {
            return null;
        }
        if (!preg_match('/^\d{4}$/', $raw)) {
            throw new \RuntimeException("Année invalide : $raw");
        }

        $year = (int) $raw;
        if ($year < 1970 || $year > 2100) {
            throw new \RuntimeException("Année invalide : $raw");
        }
        return $year;
    }

    private function wrap(callable $fn): void
    {
        try {
            $this->requireGerant();
            ArchiveTransactions::runIfNeeded();
            $this->json($fn());
        }
        catch (Throwable $e) { $this->jsonError($e->getMessage()); }
    }
    private function wrapVoid(callable $fn): void
    {
        try {
            $this->requireGerant();
            ArchiveTransactions::runIfNeeded();
            $fn();
            $this->json(['ok' => true]);
        }
        catch (Throwable $e) { $this->jsonError($e->getMessage()); }
    }

    public function getProfiles(): void
    {
        $this->wrap(fn() => ['profiles' => $this->availableProfiles()]);
    }

    private function schemaTableDependencies(): array
    {
        return [
            'article' => ['Article'],
            'produit' => ['Produit'],
            'energie' => ['Energie'],
            'carburant' => ['Carburant'],
            'electricite' => ['Electricite'],
            'stock' => ['Stock'],
            'client' => ['Client'],
            'cce' => ['CarteCE'],
            'connexion' => ['Connexion'],
            'transaction' => ['Transaction'],
            'transaction_cce' => ['TransactionCCE'],
            'transaction_produit' => ['TransactionProduit'],
            'transaction_energie' => ['TransactionEnergie'],
            'recu' => ['Recu'],
            'pompe' => ['Pompe'],
            'reappro' => ['Reapprovisionnement'],
            'ligne_reappro' => ['LigneReappro'],
            'valeurs_defaut' => ['ValeursDefautReappro'],
            'fiche_incident' => ['FicheIncident'],
            'jour_fermeture' => ['JourFermeture'],
            'jour_semaine' => ['JourSemaine'],
            'horaire' => ['Horaire'],
            'params_cce' => ['ParametresCCE'],
            'bonus_cce' => ['BonusCCE'],
            'validation_transactions' => ['ValidationTransactions'],
            'validation_incidents' => ['ValidationIncidents'],
        ];
    }

    private function tableDataKey(string $table): string
    {
        return match ($table) {
            'produit' => 'produits',
            'client'  => 'clients',
            'cce'     => 'cartes',
            default   => 'rows',
        };
    }

    private function emptyTablePayload(string $table): array
    {
        return [$this->tableDataKey($table) => []];
    }

    private function isArchiveYearEligible(int $year): bool
    {
        return $year <= ((int) date('Y') - 1);
    }

    private function getPhysicalTables(string $profile): array
    {
        $rows = Database::getInstance($profile)
            ->query('SHOW TABLES')
            ->fetchAll(\PDO::FETCH_NUM) ?: [];

        $tables = [];
        foreach ($rows as $row) {
            $name = isset($row[0]) ? trim((string) $row[0]) : '';
            if ($name !== '') {
                $tables[] = strtolower($name);
            }
        }

        return array_values(array_unique($tables));
    }

    public function getAvailableTables(): void
    {
        $this->wrap(function () {
            $profile = $this->resolveProfile(false);
            $physical = $this->getPhysicalTables($profile);
            $available = [];
            foreach ($this->schemaTableDependencies() as $schema => $deps) {
                $ok = true;
                foreach ($deps as $dep) {
                    if (!in_array(strtolower($dep), $physical, true)) {
                        $ok = false;
                        break;
                    }
                }
                if ($ok) {
                    $available[] = $schema;
                }
            }

            return ['tables' => $available];
        });
    }

    // ── Dispatch générique ────────────────────────────────
    public function getTable(string $table): void
    {
        $this->wrap(function() use ($table) {
            $profile = $this->resolveProfile(false);
            $bdd = $this->bdd($profile);
            $year = $this->resolveYear();
            if ($profile === 'archive' && $year !== null && !$this->isArchiveYearEligible($year)) {
                return $this->emptyTablePayload($table);
            }
            return match($table) {
            'article'             => $bdd->getArticle($year),
            'produit'             => $bdd->getProduit($year),
            'energie'             => $bdd->getEnergie($year),
            'carburant'           => $bdd->getCarburant($year),
            'electricite'         => $bdd->getElectricite($year),
            'stock'               => $bdd->getStock($year),
            'client'              => $bdd->getClient($year),
            'cce'                 => $bdd->getCarteCCE($year),
            'connexion'           => $bdd->getConnexion($year),
            'transaction'         => $bdd->getTransaction($year),
            'transaction_cce'     => $bdd->getTransactionCCE($year),
            'transaction_produit' => $bdd->getTransactionProduit($year),
            'transaction_energie' => $bdd->getTransactionEnergie($year),
            'recu'                => $bdd->getRecu($year),
            'pompe'               => $bdd->getPompe($year),
            'reappro'             => $bdd->getReappro($year),
            'ligne_reappro'       => $bdd->getLigneReappro($year),
            'valeurs_defaut'      => $bdd->getValeursDefaut($year),
            'fiche_incident'      => $bdd->getFicheIncident($year),
            'jour_fermeture'      => $bdd->getJourFermeture($year),
            'jour_semaine'        => $bdd->getJourSemaine($year),
            'horaire'             => $bdd->getHoraire($year),
            'params_cce'          => $bdd->getParamsCCE($year),
            'bonus_cce'           => $bdd->getBonusCCE($year),
            'validation_transactions' => $bdd->getValidationTransactions($year),
            'validation_incidents'    => $bdd->getValidationIncidents($year),
            default               => throw new \RuntimeException("Table inconnue: $table"),
            };
        });
    }

    public function getRecuDetail(string $id): void
    {
        $this->wrap(function() use ($id) {
            $profile = $this->resolveProfile(false);
            return $this->bdd($profile)->getRecuDetail((int)$id);
        });
    }

    public function addTable(string $table): void
    {
        $d = $this->body();
        $this->wrap(function() use ($table, $d) {
            $profile = $this->resolveProfile(true);
            $bdd = $this->bdd($profile);
            return match($table) {
            'article'             => $bdd->addArticle($d),
            'produit'             => $bdd->addProduit($d),
            'energie'             => $bdd->addEnergie($d),
            'carburant'           => $bdd->addCarburant($d),
            'electricite'         => $bdd->addElectricite($d),
            'stock'               => $bdd->addStock($d),
            'client'              => $bdd->addClient($d),
            'connexion'           => $bdd->addConnexion($d),
            'transaction'         => $bdd->addTransaction($d),
            'transaction_cce'     => $bdd->addTransactionCCE($d),
            'transaction_produit' => $bdd->addTransactionProduit($d),
            'transaction_energie' => $bdd->addTransactionEnergie($d),
            'recu'                => $bdd->addRecu($d),
            'pompe'               => $bdd->addPompe($d),
            'reappro'             => $bdd->addReappro($d),
            'ligne_reappro'       => $bdd->addLigneReappro($d),
            'valeurs_defaut'      => $bdd->addValeursDefaut($d),
            'fiche_incident'      => $bdd->addFicheIncident($d),
            'jour_fermeture'      => $bdd->addJourFermeture($d),
            'jour_semaine'        => $bdd->addJourSemaine($d),
            'horaire'             => $bdd->addHoraire($d),
            'bonus_cce'           => $bdd->addBonusCCE($d),
            'validation_transactions' => $bdd->addValidationTransactions($d),
            'validation_incidents'    => $bdd->addValidationIncidents($d),
            default               => throw new \RuntimeException("Ajout non supporté: $table"),
            };
        });
    }

    public function putTable(string $table, string $id): void
    {
        $d = $this->body();
        $this->wrap(function() use ($table, $id, $d) {
            $profile = $this->resolveProfile(true);
            $bdd = $this->bdd($profile);
            return match($table) {
            'article'             => $bdd->updateArticle((int)$id, $d),
            'produit'             => $bdd->updateProduit($id, $d),
            'energie'             => $bdd->updateEnergie((int)$id, $d),
            'carburant'           => $bdd->updateCarburant((int)$id, $d),
            'electricite'         => $bdd->updateElectricite((int)$id, $d),
            'stock'               => $bdd->updateStock((int)$id, $d),
            'client'              => $bdd->updateClient((int)$id, $d),
            'cce'                 => $bdd->updateCarteCCE((int)$id, $d),
            'connexion'           => $bdd->updateConnexion((int)$id, $d),
            'transaction'         => $bdd->updateTransaction((int)$id, $d),
            'transaction_cce'     => $bdd->updateTransactionCCE($id, $d),
            'transaction_produit' => $bdd->updateTransactionProduit((int)$id, $d),
            'transaction_energie' => $bdd->updateTransactionEnergie((int)$id, $d),
            'recu'                => $bdd->updateRecu((int)$id, $d),
            'pompe'               => $bdd->updatePompe((int)$id, $d),
            'reappro'             => $bdd->updateReappro((int)$id, $d),
            'ligne_reappro'       => $bdd->updateLigneReappro($id, $d),
            'valeurs_defaut'      => $bdd->updateValeursDefaut((int)$id, $d),
            'fiche_incident'      => $bdd->updateFicheIncident((int)$id, $d),
            'jour_fermeture'      => $bdd->updateJourFermeture((int)$id, $d),
            'jour_semaine'        => $bdd->updateJourSemaine((int)$id, $d),
            'horaire'             => $bdd->updateHoraire((int)$id, $d),
            'params_cce'          => $bdd->updateParamsCCE((int)$id, $d),
            'bonus_cce'           => $bdd->updateBonusCCE((int)$id, $d),
            'validation_transactions' => $bdd->updateValidationTransactions((int)$id, $d),
            'validation_incidents'    => $bdd->updateValidationIncidents((int)$id, $d),
            default               => throw new \RuntimeException("Modification non supportée: $table"),
            };
        });
    }

    public function delTable(string $table, string $id): void
    {
        $this->wrapVoid(function() use ($table, $id) {
            $profile = $this->resolveProfile(true);
            $bdd = $this->bdd($profile);
            match($table) {
            'article'             => $bdd->deleteArticle((int)$id),
            'produit'             => $bdd->deleteProduit($id),
            'energie'             => $bdd->deleteEnergie((int)$id),
            'carburant'           => $bdd->deleteCarburant((int)$id),
            'electricite'         => $bdd->deleteElectricite((int)$id),
            'stock'               => $bdd->deleteStock((int)$id),
            'client'              => $bdd->deleteClient((int)$id),
            'cce'                 => $bdd->deleteCarteCCE((int)$id),
            'connexion'           => $bdd->deleteConnexion((int)$id),
            'transaction'         => $bdd->deleteTransaction((int)$id),
            'transaction_cce'     => $bdd->deleteTransactionCCE($id),
            'transaction_produit' => $bdd->deleteTransactionProduit((int)$id),
            'transaction_energie' => $bdd->deleteTransactionEnergie((int)$id),
            'recu'                => $bdd->deleteRecu((int)$id),
            'pompe'               => $bdd->deletePompe((int)$id),
            'reappro'             => $bdd->deleteReappro((int)$id),
            'ligne_reappro'       => $bdd->deleteLigneReappro($id),
            'valeurs_defaut'      => $bdd->deleteValeursDefaut((int)$id),
            'fiche_incident'      => $bdd->deleteFicheIncident((int)$id),
            'jour_fermeture'      => $bdd->deleteJourFermeture((int)$id),
            'jour_semaine'        => $bdd->deleteJourSemaine((int)$id),
            'horaire'             => $bdd->deleteHoraire((int)$id),
            'bonus_cce'           => $bdd->deleteBonusCCE((int)$id),
            'validation_transactions' => $bdd->deleteValidationTransactions((int)$id),
            'validation_incidents'    => $bdd->deleteValidationIncidents((int)$id),
            default               => throw new \RuntimeException("Suppression non supportée: $table"),
            };
        });
    }
}
