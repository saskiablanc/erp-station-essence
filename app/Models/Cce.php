<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;
use RuntimeException;

class Cce
{
    private const CODE_SECRET_LENGTH = 4;

    private Database $db;
    private ?bool $hasTransactionCardLink = null;
    private ?array $cachedSettings = null;

    public function __construct()
    {
        $this->db = Database::getInstance('courante');
    }

    public function create(array $data): array
    {
        $nom = $this->normalizeName((string) ($data['nom'] ?? ''), 'nom');
        $prenom = $this->normalizeName((string) ($data['prenom'] ?? ''), 'prenom');
        $email = $this->normalizeEmail((string) ($data['email'] ?? ''));
        $telephone = $this->normalizeTelephone((string) ($data['telephone'] ?? ''));
        $providedCodeSecret = array_key_exists('code_secret', $data)
            ? $this->normalizeProvidedCodeSecret($data['code_secret'])
            : null;
        $duplicate = $this->findDuplicateByContact($email, $telephone);
        if ($duplicate) {
            $duplicateEmail = (bool) ($duplicate['duplicate_email'] ?? false);
            $duplicateTelephone = (bool) ($duplicate['duplicate_telephone'] ?? false);
            if ($duplicateEmail && $duplicateTelephone) {
                throw new RuntimeException("L'adresse mail et le numéro de téléphone sont déjà utilisés");
            }
            if ($duplicateEmail) {
                throw new RuntimeException("L'adresse mail est déjà utilisée");
            }
            if ($duplicateTelephone) {
                throw new RuntimeException('Le numéro de téléphone est déjà utilisé');
            }
            throw new RuntimeException('Coordonnées déjà utilisées');
        }
        // Vérifie que la configuration CCE globale existe avant de créer la carte.
        $this->getGlobalSettings();
        $dateApport = date('Y-m-d');
        $montantApport = 0;
        $soldeClient = 0.0;

        $this->db->beginTransaction();

        try {
            $this->db->execute(
                'INSERT INTO `Client` (`nom`, `prenom`, `email`, `num_tel`)
                 VALUES (:nom, :prenom, :email, :num_tel)',
                [
                    'nom' => $nom,
                    'prenom' => $prenom,
                    'email' => $email,
                    'num_tel' => $telephone,
                ]
            );

            $idClient = (int) $this->db->lastInsertId();
            if ($idClient <= 0) {
                throw new RuntimeException('Création du client impossible');
            }

            $codeSecret = $providedCodeSecret ?? $this->generateDefaultCodeSecret();
            $codeSecretHash = $this->hashCodeSecret($codeSecret);

            $this->db->execute(
                'INSERT INTO `CarteCE`
                    (`id_client`, `code_secret`, `solde_client`, `date_dernier_apport`, `montant_dernier_apport`)
                 VALUES
                    (:id_client, :code_secret, :solde_client, :date_dernier_apport, :montant_dernier_apport)',
                [
                    'id_client' => $idClient,
                    'code_secret' => $codeSecretHash,
                    'solde_client' => $soldeClient,
                    'date_dernier_apport' => $dateApport,
                    'montant_dernier_apport' => $montantApport,
                ]
            );

            $idCarte = (int) $this->db->lastInsertId();
            if ($idCarte <= 0) {
                throw new RuntimeException('Création de la carte CCE impossible');
            }

            $this->db->commit();

            $created = [
                'id_carte_CE' => $idCarte,
                'id_client' => $idClient,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $email,
                'num_tel' => $telephone,
                'code_secret_masked' => str_repeat('*', self::CODE_SECRET_LENGTH),
                'solde_client' => number_format($soldeClient, 3, '.', ''),
                'date_dernier_apport' => $dateApport,
                'montant_dernier_apport' => $montantApport,
            ];

            return $this->attachCceSettings($created);
        } catch (\Throwable $e) {
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    public function findDuplicateClient(array $data): ?array
    {
        $email = $this->normalizeEmail((string) ($data['email'] ?? ''));
        $telephone = $this->normalizeTelephone((string) ($data['telephone'] ?? ''));

        return $this->findDuplicateByContact($email, $telephone);
    }

    public function findById(int $idCarte): ?array
    {
        $stmt = $this->db->query(
            'SELECT
                cc.id_carte_CE,
                cc.id_client,
                c.nom,
                c.prenom,
                c.email,
                c.num_tel,
                cc.solde_client,
                cc.date_dernier_apport,
                cc.montant_dernier_apport
             FROM `CarteCE` cc
             INNER JOIN `Client` c ON c.id_client = cc.id_client
             WHERE cc.id_carte_CE = :id
             LIMIT 1',
            ['id' => $idCarte]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return $this->attachCceSettings($row);
    }

    public function findOverviewById(int $idCarte): ?array
    {
        $cce = $this->findById($idCarte);
        if (!$cce) {
            return null;
        }

        return $this->withTransactions($cce);
    }

    public function findLatestOverview(): ?array
    {
        $stmt = $this->db->query(
            'SELECT
                cc.id_carte_CE,
                cc.id_client,
                c.nom,
                c.prenom,
                c.email,
                c.num_tel,
                cc.solde_client,
                cc.date_dernier_apport,
                cc.montant_dernier_apport
             FROM `CarteCE` cc
             INNER JOIN `Client` c ON c.id_client = cc.id_client
             ORDER BY cc.id_carte_CE DESC
             LIMIT 1'
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return $this->withTransactions($this->attachCceSettings($row));
    }

    public function findAllForScan(): array
    {
        $stmt = $this->db->query(
            'SELECT
                cc.id_carte_CE,
                c.nom,
                c.prenom,
                cc.solde_client
             FROM `CarteCE` cc
             INNER JOIN `Client` c ON c.id_client = cc.id_client
             ORDER BY cc.id_carte_CE DESC'
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    public function recharger(int $idCarte, float $montant): ?array
    {
        if ($montant <= 0) {
            throw new RuntimeException('Le montant doit être supérieur à 0');
        }

        $arrondi = round($montant, 3);
        $exists = $this->db->query(
            'SELECT 1 FROM `CarteCE` WHERE id_carte_CE = :id LIMIT 1',
            ['id' => $idCarte]
        )->fetchColumn();
        if (!$exists) {
            return null;
        }

        $settings = $this->getGlobalSettings();
        $montantMinimum = (float) ($settings['montant_min'] ?? 0);
        if ($arrondi < $montantMinimum) {
            throw new RuntimeException(
                sprintf('Le montant minimum de rechargement est de %.2f EUR', $montantMinimum)
            );
        }

        $bonusRule = $this->resolveBonusForAmount(
            $arrondi,
            is_array($settings['bonus_rules'] ?? null) ? $settings['bonus_rules'] : []
        );
        $bonus = (float) ($bonusRule['bonus'] ?? 0.0);
        $trancheBonus = (float) ($bonusRule['tranche'] ?? 0.0);

        $montantCredite = round($arrondi + $bonus, 3);
        $dateApport = date('Y-m-d');
        $dateHeureRecharge = date('Y-m-d H:i:s');

        $idTransactionRecharge = 0;

        $this->db->beginTransaction();
        try {
            $this->db->execute(
                'UPDATE `CarteCE`
                 SET solde_client = solde_client + :montant_credite,
                     date_dernier_apport = :date_dernier_apport,
                     montant_dernier_apport = :montant_entier
                 WHERE id_carte_CE = :id',
                [
                    'montant_credite' => $montantCredite,
                    'date_dernier_apport' => $dateApport,
                    'montant_entier' => (int) round($montant),
                    'id' => $idCarte,
                ]
            );

            if (!$this->hasTransactionCardLink()) {
                throw new RuntimeException('Table TransactionCCE introuvable');
            }

            $this->db->execute(
                'INSERT INTO `Transaction` (`prix_total`, `date_heure`)
                 VALUES (:prix_total, :date_heure)',
                [
                    'prix_total' => $montantCredite,
                    'date_heure' => $dateHeureRecharge,
                ]
            );

            $idTransactionRecharge = (int) $this->db->lastInsertId();
            if ($idTransactionRecharge <= 0) {
                throw new RuntimeException('Création de la transaction de rechargement impossible');
            }

            $this->db->execute(
                'INSERT INTO `TransactionCCE` (`id_transaction`, `id_carte_CE`)
                 VALUES (:id_transaction, :id_carte_CE)',
                [
                    'id_transaction' => $idTransactionRecharge,
                    'id_carte_CE' => $idCarte,
                ]
            );

            $this->db->commit();
        } catch (\Throwable $e) {
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }

        $cce = $this->findOverviewById($idCarte);
        if (!$cce) {
            return null;
        }

        $cce['rechargement'] = [
            'id_transaction' => $idTransactionRecharge,
            'montant_saisi' => $arrondi,
            'bonus_applique' => $bonus,
            'tranche_bonus' => $trancheBonus > 0 ? $trancheBonus : null,
            'montant_credite' => $montantCredite,
        ];

        return $cce;
    }

    public function debiter(int $idCarte, float $montant, array $idTransactions = []): ?array
    {
        if ($montant <= 0) {
            throw new RuntimeException('Le montant doit être supérieur à 0');
        }

        $arrondi = round($montant, 3);
        $idTransactions = $this->normalizeTransactionIds($idTransactions);

        $this->db->beginTransaction();
        try {
            $row = $this->db->query(
                'SELECT solde_client
                 FROM `CarteCE`
                 WHERE id_carte_CE = :id
                 LIMIT 1',
                ['id' => $idCarte]
            )->fetch(PDO::FETCH_ASSOC);

            if (!$row) {
                $this->db->rollBack();
                return null;
            }

            $solde = (float) ($row['solde_client'] ?? 0);
            if ($solde < $arrondi) {
                throw new RuntimeException('Solde CCE insuffisant');
            }

            $this->db->execute(
                'UPDATE `CarteCE`
                 SET solde_client = solde_client - :montant
                 WHERE id_carte_CE = :id',
                [
                    'montant' => $arrondi,
                    'id' => $idCarte,
                ]
            );

            if ($idTransactions !== []) {
                if (!$this->hasTransactionCardLink()) {
                    throw new RuntimeException('Table TransactionCCE introuvable');
                }

                foreach ($idTransactions as $idTransaction) {
                    $this->db->execute(
                        'INSERT IGNORE INTO `TransactionCCE` (`id_transaction`, `id_carte_CE`)
                         VALUES (:id_transaction, :id_carte_CE)',
                        [
                            'id_transaction' => $idTransaction,
                            'id_carte_CE' => $idCarte,
                        ]
                    );
                }
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            if ($this->db->getConnection()->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }

        return $this->findOverviewById($idCarte);
    }

    public function verifyCodeSecret(int $idCarte, mixed $providedCodeSecret): ?bool
    {
        $candidate = $this->normalizeProvidedCodeSecret($providedCodeSecret);

        $row = $this->db->query(
            'SELECT code_secret
             FROM `CarteCE`
             WHERE id_carte_CE = :id
             LIMIT 1',
            ['id' => $idCarte]
        )->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $stored = trim((string) ($row['code_secret'] ?? ''));
        if ($stored === '') {
            return false;
        }

        if ($this->looksLikePasswordHash($stored)) {
            $valid = password_verify($candidate, $stored);
            if ($valid && password_needs_rehash($stored, PASSWORD_BCRYPT)) {
                $this->db->execute(
                    'UPDATE `CarteCE` SET code_secret = :hash WHERE id_carte_CE = :id',
                    [
                        'hash' => $this->hashCodeSecret($candidate),
                        'id' => $idCarte,
                    ]
                );
            }
            return $valid;
        }

        // Compatibilité ascendante: migration silencieuse des anciens codes non hashés.
        $legacyNormalized = ltrim($candidate, '0');
        if ($legacyNormalized === '') {
            $legacyNormalized = '0';
        }
        $validLegacy = hash_equals($stored, $candidate) || hash_equals($stored, $legacyNormalized);
        if ($validLegacy) {
            $this->db->execute(
                'UPDATE `CarteCE` SET code_secret = :hash WHERE id_carte_CE = :id',
                [
                    'hash' => $this->hashCodeSecret($candidate),
                    'id' => $idCarte,
                ]
            );
            return true;
        }

        return false;
    }

    /**
     * @param array<int, mixed> $ids
     * @return array<int, int>
     */
    private function normalizeTransactionIds(array $ids): array
    {
        $normalized = [];

        foreach ($ids as $id) {
            $current = (int) $id;
            if ($current > 0) {
                $normalized[] = $current;
            }
        }

        return array_values(array_unique($normalized));
    }

    /**
     * @return array{columns: string[], rows: array<int, array<string, mixed>>}
     */
    public function findTransactionCceForCard(int $idCarte): array
    {
        $rows = [];

        if ($this->hasTransactionCardLink()) {
            $rows = $this->db->query(
                'SELECT
                    t.id_transaction,
                    CASE
                        WHEN te.id_transaction IS NULL THEN \'Rechargement de la carte CCE\'
                        ELSE c.libelle
                    END AS transaction_name,
                    CASE
                        WHEN te.id_transaction IS NULL THEN NULL
                        ELSE te.quantite_delivree
                    END AS quantite,
                    t.prix_total AS montant_total,
                    t.date_heure,
                    CASE
                        WHEN te.id_transaction IS NULL THEN \'rechargement\'
                        ELSE \'carburant\'
                    END AS transaction_kind
                 FROM `TransactionCCE` tcce
                 INNER JOIN `Transaction` t
                    ON t.id_transaction = tcce.id_transaction
                 LEFT JOIN `TransactionEnergie` te
                    ON te.id_transaction = t.id_transaction
                 LEFT JOIN `Energie` e
                    ON e.id_energie = te.id_energie
                   AND e.type_energie = \'carburant\'
                 LEFT JOIN `Carburant` c
                    ON c.id_energie = e.id_energie
                 WHERE tcce.id_carte_CE = :id_carte
                   AND (te.id_transaction IS NULL OR e.id_energie IS NOT NULL)
                 ORDER BY t.date_heure DESC, t.id_transaction DESC',
                ['id_carte' => $idCarte]
            )->fetchAll(PDO::FETCH_ASSOC) ?: [];
        }

        return [
            'columns' => ['id_transaction', 'transaction_name', 'quantite', 'montant_total', 'date_heure', 'transaction_kind'],
            'rows' => $rows,
        ];
    }

    private function normalizeName(string $value, string $field): string
    {
        $value = trim((string) preg_replace('/\s+/', ' ', $value));

        if ($value === '') {
            throw new RuntimeException("Le champ {$field} est requis");
        }

        if (mb_strlen($value) > 50) {
            throw new RuntimeException("Le champ {$field} est trop long");
        }

        return $value;
    }

    private function normalizeEmail(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            throw new RuntimeException('Le champ email est requis');
        }

        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Adresse mail invalide');
        }

        if (strlen($value) > 100) {
            throw new RuntimeException('Adresse mail trop longue');
        }

        return $value;
    }

    private function normalizeTelephone(string $value): string
    {
        $value = preg_replace('/\s+/', '', trim($value));

        if ($value === '') {
            throw new RuntimeException('Le numéro de téléphone est requis');
        }

        if (!preg_match('/^\+?[0-9().-]{6,20}$/', $value)) {
            throw new RuntimeException('Numéro de téléphone invalide');
        }

        if (strlen($value) > 20) {
            throw new RuntimeException('Numéro de téléphone trop long');
        }

        return $value;
    }

    private function findDuplicateByContact(string $email, string $telephone): ?array
    {
        $stmt = $this->db->query(
            'SELECT
                id_client,
                nom,
                prenom,
                email,
                num_tel
             FROM `Client`
             WHERE email = :email
                OR num_tel = :num_tel
             ORDER BY id_client ASC',
            [
                'email' => $email,
                'num_tel' => $telephone,
            ]
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        if ($rows === []) {
            return null;
        }

        $duplicateEmail = false;
        $duplicateTelephone = false;

        foreach ($rows as $row) {
            if (strcasecmp((string) ($row['email'] ?? ''), $email) === 0) {
                $duplicateEmail = true;
            }
            if ((string) ($row['num_tel'] ?? '') === $telephone) {
                $duplicateTelephone = true;
            }
        }

        $first = $rows[0];
        $first['duplicate_email'] = $duplicateEmail;
        $first['duplicate_telephone'] = $duplicateTelephone;

        return $first;
    }

    private function getGlobalSettings(): array
    {
        if ($this->cachedSettings !== null) {
            return $this->cachedSettings;
        }

        $stmt = $this->db->query(
            'SELECT id_parametre, montant_min
             FROM `ParametresCCE`
             ORDER BY id_parametre ASC
             LIMIT 1'
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new RuntimeException('Aucun paramètre CCE disponible');
        }

        $rules = $this->findBonusRules();
        $settings = [
            'id_parametre' => (int) ($row['id_parametre'] ?? 0),
            'montant_min' => (float) ($row['montant_min'] ?? 0),
            'bonus_rules' => $rules,
            // Compatibilité front existant.
            'bonus_100' => $this->findBonusForTranche($rules, 100.0),
            'bonus_200' => $this->findBonusForTranche($rules, 200.0),
        ];

        $this->cachedSettings = $settings;
        return $settings;
    }

    /**
     * @return array<int, array{tranche: float, montant_bonus: float}>
     */
    private function findBonusRules(): array
    {
        $stmt = $this->db->query(
            'SELECT
                tranche,
                montant_bonus
             FROM `BonusCCE`
             ORDER BY tranche ASC, id_bonus ASC'
        );

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        $rules = [];
        foreach ($rows as $row) {
            $tranche = round((float) ($row['tranche'] ?? 0), 2);
            $montantBonus = round((float) ($row['montant_bonus'] ?? 0), 2);
            if ($tranche <= 0 || $montantBonus < 0) {
                continue;
            }

            $rules[] = [
                'tranche' => $tranche,
                'montant_bonus' => $montantBonus,
            ];
        }

        return $rules;
    }

    private function findBonusForTranche(array $rules, float $target): float
    {
        foreach ($rules as $rule) {
            if (abs(((float) ($rule['tranche'] ?? 0)) - $target) < 0.0001) {
                return (float) ($rule['montant_bonus'] ?? 0);
            }
        }

        return 0.0;
    }

    /**
     * @param array<int, array{tranche: float, montant_bonus: float}> $rules
     * @return array{tranche: float, bonus: float}
     */
    private function resolveBonusForAmount(float $amount, array $rules): array
    {
        $selectedTranche = 0.0;
        $selectedBonus = 0.0;

        foreach ($rules as $rule) {
            $tranche = (float) ($rule['tranche'] ?? 0);
            $bonus = (float) ($rule['montant_bonus'] ?? 0);

            if ($amount >= $tranche && $tranche >= $selectedTranche) {
                $selectedTranche = $tranche;
                $selectedBonus = $bonus;
            }
        }

        return [
            'tranche' => round($selectedTranche, 2),
            'bonus' => round($selectedBonus, 3),
        ];
    }

    private function attachCceSettings(array $cce): array
    {
        $settings = $this->getGlobalSettings();
        $cce['id_parametre'] = $settings['id_parametre'] ?? null;
        $cce['montant_min'] = $settings['montant_min'] ?? 0.0;
        $cce['bonus_100'] = $settings['bonus_100'] ?? 0.0;
        $cce['bonus_200'] = $settings['bonus_200'] ?? 0.0;
        $cce['bonus_rules'] = $settings['bonus_rules'] ?? [];
        return $cce;
    }

    private function normalizeProvidedCodeSecret(mixed $value): string
    {
        $raw = preg_replace('/\s+/', '', trim((string) $value));
        if ($raw === '') {
            throw new RuntimeException('Code secret requis');
        }
        if (!preg_match('/^\d{' . self::CODE_SECRET_LENGTH . '}$/', $raw)) {
            throw new RuntimeException(
                'Le code secret doit contenir exactement ' . self::CODE_SECRET_LENGTH . ' chiffres.'
            );
        }

        return $raw;
    }

    private function generateDefaultCodeSecret(): string
    {
        return str_pad((string) random_int(0, (10 ** self::CODE_SECRET_LENGTH) - 1), self::CODE_SECRET_LENGTH, '0', STR_PAD_LEFT);
    }

    private function hashCodeSecret(string $codeSecret): string
    {
        $hash = password_hash($codeSecret, PASSWORD_BCRYPT);
        if (!is_string($hash) || $hash === '') {
            throw new RuntimeException('Impossible de sécuriser le code CCE');
        }
        return $hash;
    }

    private function looksLikePasswordHash(string $value): bool
    {
        return str_starts_with($value, '$2y$') || str_starts_with($value, '$2a$') || str_starts_with($value, '$2b$');
    }

    private function withTransactions(array $cce): array
    {
        $transactions = $this->findTransactionsForCard((int) $cce['id_carte_CE']);

        $cce['transactions'] = $transactions;
        $cce['transactions_count'] = count($transactions);
        $cce['transactions_preview'] = array_slice($transactions, 0, 1);

        return $cce;
    }

    private function findTransactionsForCard(int $idCarte): array
    {
        if (!$this->hasTransactionCardLink()) {
            return [];
        }

        $stmt = $this->db->query(
            'SELECT
                t.id_transaction,
                t.prix_total,
                t.date_heure
             FROM `Transaction` t
             INNER JOIN `TransactionCCE` tcce ON tcce.id_transaction = t.id_transaction
             WHERE tcce.id_carte_CE = :id_carte_CE
             ORDER BY t.date_heure DESC, t.id_transaction DESC',
            ['id_carte_CE' => $idCarte]
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    private function hasTransactionCardLink(): bool
    {
        if ($this->hasTransactionCardLink !== null) {
            return $this->hasTransactionCardLink;
        }

        $stmt = $this->db->query("SHOW TABLES LIKE 'TransactionCCE'");
        $this->hasTransactionCardLink = (bool) $stmt->fetchColumn();
        return $this->hasTransactionCardLink;
    }

}
