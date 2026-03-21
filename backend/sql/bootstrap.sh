#!/bin/bash
set -e

# Default values if not provided via Env Vars
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-test}"
DB_PASSWORD="${DB_PASSWORD:-test123}"
DB_NAME="${DB_NAME:-startup101_db}"

# Resolve the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Starting Database Bootstrap..."
echo "Target: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# Function to execute SQL file
run_sql() {
    local file=$1
    echo "📄 Executing $file..."
    PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -v ON_ERROR_STOP=1 \
        -f "$file"
}

# 1. Extensions
run_sql "$SCRIPT_DIR/extensions.sql"

# 2. Schema
run_sql "$SCRIPT_DIR/schema.sql"

# 3. Seeds
run_sql "$SCRIPT_DIR/seed-skills.sql"
run_sql "$SCRIPT_DIR/seed-roles-domains.sql"

echo "✅ Database bootstrap completed successfully!"
