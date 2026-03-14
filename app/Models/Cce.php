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
                    (`id_client`, `code_secret`, `solde_client`, `date_dernier_apport`, `montant_dernier_apport`)
                 VALUES
                    (:id_client, :code_secret, :solde_client, :date_dernier_apport, :montant_dernier_apport)',
                [
                    'id_client' => $idClient,
                    'code_secret' => $codeSecret,
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
        $nom = $this->normalizeName((string) ($data['nom'] ?? ''), 'nom');
        $prenom = $this->normalizeName((string) ($data['prenom'] ?? ''), 'prenom');
        $email = $this->normalizeEmail((string) ($data['email'] ?? ''));
        $telephone = $this->normalizeTelephone((string) ($data['telephone'] ?? ''));

        $stmt = $this->db->query(
            'SELECT
                id_client,
                nom,
                prenom,
                email,
                num_tel
             FROM `Client`
             WHERE nom = :nom
               AND prenom = :prenom
               AND email = :email
               AND num_tel = :num_tel
             LIMIT 1',
            [
                'nom' => $nom,
                'prenom' => $prenom,
                'email' => $email,
                'num_tel' => $telephone,
            ]
        );

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
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
                cc.montant_dernier_apport
             FROM `CarteCE` cc
             INNER JOIN `Client` c ON c.id_client = cc.id_client
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

        return $this->withTransactions($row);
    }

    public function recharger(int $idCarte, float $montant): ?array
    {
        if ($montant <= 0) {
            throw new RuntimeException('Le montant doit être superieur à 0');
        }

        $arrondi = round($montant, 3);
        $dateApport = date('Y-m-d');

        $this->db->execute(
            'UPDATE `CarteCE`
             SET solde_client = solde_client + :montant,
                 date_dernier_apport = :date_dernier_apport,
                 montant_dernier_apport = :montant_entier
             WHERE id_carte_CE = :id',
            [
                'montant' => $arrondi,
                'date_dernier_apport' => $dateApport,
                'montant_entier' => (int) round($montant),
                'id' => $idCarte,
            ]
        );

        return $this->findOverviewById($idCarte);
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
                id_transaction,
                prix_total,
                date_heure
             FROM `Transaction`
             WHERE id_carte_CE = :id_carte_CE
             ORDER BY date_heure DESC, id_transaction DESC',
            ['id_carte_CE' => $idCarte]
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    }

    private function hasTransactionCardLink(): bool
    {
        if ($this->hasTransactionCardLink !== null) {
            return $this->hasTransactionCardLink;
        }

        $stmt = $this->db->query('SHOW COLUMNS FROM `Transaction`');
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($columns as $column) {
            if (trim((string) ($column['Field'] ?? '')) === 'id_carte_CE') {
                $this->hasTransactionCardLink = true;
                return true;
            }
        }

        $this->hasTransactionCardLink = false;
        return false;
    }
}
