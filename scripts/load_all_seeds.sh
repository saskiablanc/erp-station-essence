#!/bin/bash

# Script pour charger toutes les données de test (seeds) dans la base de données
# Usage: ./scripts/load_all_seeds.sh

set -e  # Arrêter en cas d'erreur

echo "=========================================="
echo "Chargement des données de test"
echo "=========================================="
echo ""

# Vérifier que Docker est lancé
if ! docker ps | grep -q station_db_courante; then
    echo "Erreur : La base de données n'est pas lancée"
    echo "Lancez d'abord : make docker-up"
    exit 1
fi

# Compter le nombre de fichiers seed
seed_count=$(ls -1 database/seeds/*.sql 2>/dev/null | wc -l | tr -d ' ')

if [ "$seed_count" -eq 0 ]; then
    echo "Aucun fichier seed trouvé dans database/seeds/"
    echo "Créez des fichiers .sql dans ce dossier pour ajouter des données de test"
    exit 0
fi

echo "Fichiers seed trouvés : $seed_count"
echo ""

# Charger chaque fichier seed
for seed in database/seeds/*.sql; do
    if [ -f "$seed" ]; then
        filename=$(basename "$seed")
        echo "Chargement de $filename..."
        
        docker exec -i station_db_courante mysql \
            -ustation_user \
            -pstation_pass_secure \
            StationCourante < "$seed"
        
        echo "  -> OK"
    fi
done

echo ""
echo "=========================================="
echo "Toutes les données de test chargées"
echo "=========================================="