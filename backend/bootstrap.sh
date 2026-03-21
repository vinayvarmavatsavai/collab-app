#!/bin/bash

# Configuration
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DB_NAME=${DATABASE_NAME:-"startup101_db"}
DB_USER=${DATABASE_USER:-"postgres"}
DB_HOST=${DATABASE_HOST:-"127.0.0.1"}
DB_PORT=${DATABASE_PORT:-"5432"}
DB_PASS=${DATABASE_PASSWORD:-"password"}

export PGPASSWORD=$DB_PASS

echo "============================================="
echo "🚀 Bootstrapping database from scratch..."
echo "============================================="

echo "🔥 Wiping schema on $DB_NAME..."
psql -U postgres -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"
psql -U postgres -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -U postgres -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;"
psql -U postgres -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -U postgres -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
psql -U postgres -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO $DB_USER;"

# Array of SQL files to run in order
SQL_FILES=(
    "schema.sql"
)

# Loop through and apply each file
for file in "${SQL_FILES[@]}"; do
    FILE_PATH="./sql/$file"
    
    if [ -f "$FILE_PATH" ]; then
        echo "⏳ Applying $file..."
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "$FILE_PATH"
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully applied $file"
        else
            echo "❌ Error applying $file. Stopping bootstrap."
            exit 1
        fi
    else
        echo "❌ File not found: $FILE_PATH"
        exit 1
    fi
done

echo "============================================="
echo "🤖 Generating and inserting REAL embeddings via Ollama..."
echo "============================================="
npx ts-node -r tsconfig-paths/register src/seed.ts

if [ $? -eq 0 ]; then
    echo "✅ Successfully seeded LLM embeddings!"
else
    echo "❌ Error during LLM seeding string. Stopping bootstrap."
    exit 1
fi

echo "============================================="
echo "🎉 Database bootstrap complete!"
echo "============================================="
