<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Database;
use PDO;
use RuntimeException;

class Cce
{
    private Database $db;
    private ?bool $hasTransactionCardLink = null;
    private ?int $defaultParametreId = null;

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
        $idParametre = $this->getDefaultParametreId();
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

            $codeSecret = $this->generateUniqueCodeSecret();

            $this->db->execute(
                'INSERT INTO `CarteCE`
                    (`id_client`, `code_secret`, `solde_client`, `date_dernier_apport`, `montant_dernier_apport`, `id_parametre`)
                 VALUES
                    (:id_client, :code_secret, :solde_client, :date_dernier_apport, :montant_dernier_apport, :id_parametre)',
                [
                    'id_client' => $idClient,
                    'code_secret' => $codeSecret,
                    'solde_client' => $soldeClient,
                    'date_dernier_apport' => $dateApport,
                    'montant_dernier_apport' => $montantApport,
                    'id_parametre' => $idParametre,
                ]
            );

            $idCarte = (int) $this->db->lastInsertId();
            if ($idCarte <= 0) {
                throw new RuntimeException('Création de la carte CCE impossible');
            }

            $this->db->commit();

            return [
                'id_carte_CE' => $idCarte,
                'id_client' => $idClient,
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $email,
                'num_tel' => $telephone,
                'code_secret' => $codeSecret,
                'solde_client' => number_format($soldeClient, 3, '.', ''),
                'date_dernier_apport' => $dateApport,
                'montant_dernier_apport' => $montantApport,
                'id_parametre' => $idParametre,
            ];
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
                cc.code_secret,
                cc.solde_client,
                cc.date_dernier_apport,
                cc.montant_dernier_apport,
                cc.id_parametre,
                p.montant_min,
                p.bonus_100,
                p.bonus_200
             FROM `CarteCE` cc
             INNER JOIN `Client` c ON c.id_client = cc.id_client
             INNER JOIN `ParametreCCE` p ON p.id_parametre = cc.id_parametre
             WHERE cc.id_carte_CE = :id
             LIMIT 1',
            ['id' => $idCarte]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
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
                cc.code_secret,
                cc.solde_client,
                cc.date_dernier_apport,
                cc.montant_dernier_apport,
                cc.id_parametre,
                p.montant_min,
                p.bonus_100,
                p.bonus_200
             FROM `CarteCE` cc
             INNER JOIN `Client` c ON c.id_client = cc.id_client
             INNER JOIN `ParametreCCE` p ON p.id_parametre = cc.id_parametre
             ORDER BY cc.id_carte_CE DESC
             LIMIT 1'
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return null;
        }

        return $this->withTransactions($row);
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
            throw new RuntimeException('Le montant doit être superieur à 0');
        }

        $arrondi = round($montant, 3);
        $parametres = $this->findParametresForCard($idCarte);
        if (!$parametres) {
            return null;
        }

        $montantMinimum = (float) ($parametres['montant_min'] ?? 0);
        if ($arrondi < $montantMinimum) {
            throw new RuntimeException(
                sprintf('Le montant minimum de rechargement est de %.2f EUR', $montantMinimum)
            );
        }

        $bonus = 0.0;
        $bonus100 = (float) ($parametres['bonus_100'] ?? 0);
        $bonus200 = (float) ($parametres['bonus_200'] ?? 0);
        if ($arrondi >= 200.0 && $bonus200 > 0) {
            $bonus = round($bonus200, 3);
        } elseif ($arrondi >= 100.0 && $bonus100 > 0) {
            $bonus = round($bonus100, 3);
        }

        $montantCredite = round($arrondi + $bonus, 3);
        $dateApport = date('Y-m-d');

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

        $cce = $this->findOverviewById($idCarte);
        if (!$cce) {
            return null;
        }

        $cce['rechargement'] = [
            'montant_saisi' => $arrondi,
            'bonus_applique' => $bonus,
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
        if (!$this->hasTransactionCardLink()) {
            throw new RuntimeException('Table TransactionCCE introuvable');
        }

        $columnsStmt = $this->db->query('SHOW COLUMNS FROM `Transaction`');
        $columns = $columnsStmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        if ($columns === []) {
            return ['columns' => [], 'rows' => []];
        }

        $transactionPk = null;
        $selectedColumns = [];

        foreach ($columns as $column) {
            $field = trim((string) ($column['Field'] ?? ''));
            if ($field === '') {
                continue;
            }

            $extra = strtolower(trim((string) ($column['Extra'] ?? '')));
            if ($transactionPk === null && str_contains($extra, 'auto_increment')) {
                $transactionPk = $field;
            }

            $selectedColumns[] = $field;
        }

        if ($transactionPk === null) {
            foreach ($selectedColumns as $column) {
                if (strcasecmp($column, 'id_transaction') === 0) {
                    $transactionPk = $column;
                    break;
                }
            }
        }

        if ($transactionPk === null) {
            throw new RuntimeException('Colonne id_transaction introuvable dans Transaction');
        }

        if ($selectedColumns === []) {
            return ['columns' => [], 'rows' => []];
        }

        $selectSql = implode(
            ', ',
            array_map(
                static fn (string $column): string => sprintf(
                    't.`%s` AS `%s`',
                    str_replace('`', '``', $column),
                    str_replace('`', '``', $column)
                ),
                $selectedColumns
            )
        );

        $orderColumn = null;
        foreach (['date_heure', 'horodatage', 'date_transaction', 'id_transaction'] as $candidate) {
            foreach ($selectedColumns as $column) {
                if (strcasecmp($column, $candidate) === 0) {
                    $orderColumn = $column;
                    break 2;
                }
            }
        }

        $query = sprintf(
            'SELECT %s
             FROM `Transaction` t
             INNER JOIN `TransactionCCE` tcce ON tcce.id_transaction = t.`%s`
             WHERE tcce.id_carte_CE = :id_carte%s',
            $selectSql,
            str_replace('`', '``', $transactionPk),
            $orderColumn !== null
                ? sprintf(' ORDER BY t.`%s` DESC', str_replace('`', '``', $orderColumn))
                : ''
        );

        $rows = $this->db->query($query, ['id_carte' => $idCarte])->fetchAll(PDO::FETCH_ASSOC) ?: [];
        return ['columns' => $selectedColumns, 'rows' => $rows];
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
            throw new RuntimeException('Le numéro de telephone est requis');
        }

        if (!preg_match('/^\+?[0-9().-]{6,20}$/', $value)) {
            throw new RuntimeException('Numéro de telephone invalide');
        }

        if (strlen($value) > 20) {
            throw new RuntimeException('Numéro de telephone trop long');
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

    private function getDefaultParametreId(): int
    {
        if ($this->defaultParametreId !== null) {
            return $this->defaultParametreId;
        }

        $stmt = $this->db->query(
            'SELECT id_parametre
             FROM `ParametreCCE`
             ORDER BY id_parametre ASC
             LIMIT 1'
        );
        $id = (int) $stmt->fetchColumn();
        if ($id <= 0) {
            throw new RuntimeException('Aucun paramètre CCE disponible');
        }

        $this->defaultParametreId = $id;
        return $id;
    }

    private function findParametresForCard(int $idCarte): ?array
    {
        $stmt = $this->db->query(
            'SELECT
                p.id_parametre,
                p.bonus_100,
                p.bonus_200,
                p.montant_min
             FROM `CarteCE` c
             INNER JOIN `ParametreCCE` p ON p.id_parametre = c.id_parametre
             WHERE c.id_carte_CE = :id
             LIMIT 1',
            ['id' => $idCarte]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private function generateUniqueCodeSecret(): int
    {
        for ($attempt = 0; $attempt < 25; $attempt++) {
            $code = random_int(1000, 9999);
            $stmt = $this->db->query(
                'SELECT 1 FROM `CarteCE` WHERE code_secret = :code LIMIT 1',
                ['code' => $code]
            );

            if (!$stmt->fetchColumn()) {
                return $code;
            }
        }

        throw new RuntimeException('Génération du code secret impossible');
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
