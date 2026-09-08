#!/bin/sh
set -e

echo "Starting ChitFund Pro container initialization..."

VALID_KEY="base64:GzW9WCh4BHyq8L3dpvZeFYB2swWpTfUQJ9j6DRPZv04="

# Ensure .env exists in container
if [ ! -f /var/www/html/.env ]; then
    if [ -f /var/www/html/.env.example ]; then
        cp /var/www/html/.env.example /var/www/html/.env
    else
        touch /var/www/html/.env
    fi
fi

TARGET_APP_KEY="${APP_KEY:-$VALID_KEY}"
sed -i '/^APP_KEY=/d' /var/www/html/.env
echo "APP_KEY=${TARGET_APP_KEY}" >> /var/www/html/.env

sed -i '/^APP_ENV=/d' /var/www/html/.env
echo "APP_ENV=${APP_ENV:-production}" >> /var/www/html/.env

sed -i '/^APP_DEBUG=/d' /var/www/html/.env
echo "APP_DEBUG=${APP_DEBUG:-false}" >> /var/www/html/.env

TARGET_APP_URL="${APP_URL:-https://chitfund-pro.onrender.com}"
sed -i '/^APP_URL=/d' /var/www/html/.env
echo "APP_URL=${TARGET_APP_URL}" >> /var/www/html/.env

# Auto-detect database connection from DB_CONNECTION, DATABASE_URL, or DB_HOST
TARGET_DB_CONN="${DB_CONNECTION:-}"
if [ -z "$TARGET_DB_CONN" ]; then
    if [ -n "$DATABASE_URL" ] || [ -n "$DB_URL" ]; then
        TARGET_DB_CONN="pgsql"
    elif [ -n "$DB_HOST" ]; then
        TARGET_DB_CONN="pgsql"
    else
        TARGET_DB_CONN="sqlite"
    fi
fi

sed -i '/^DB_CONNECTION=/d' /var/www/html/.env
echo "DB_CONNECTION=${TARGET_DB_CONN}" >> /var/www/html/.env

if [ "$TARGET_DB_CONN" = "pgsql" ] || [ "$TARGET_DB_CONN" = "mysql" ]; then
    echo "Configuring external database connection: ${TARGET_DB_CONN}"
    [ -n "$DB_HOST" ] && sed -i '/^DB_HOST=/d' /var/www/html/.env && echo "DB_HOST=${DB_HOST}" >> /var/www/html/.env
    [ -n "$DB_PORT" ] && sed -i '/^DB_PORT=/d' /var/www/html/.env && echo "DB_PORT=${DB_PORT}" >> /var/www/html/.env
    [ -n "$DB_DATABASE" ] && sed -i '/^DB_DATABASE=/d' /var/www/html/.env && echo "DB_DATABASE=${DB_DATABASE}" >> /var/www/html/.env
    [ -n "$DB_USERNAME" ] && sed -i '/^DB_USERNAME=/d' /var/www/html/.env && echo "DB_USERNAME=${DB_USERNAME}" >> /var/www/html/.env
    [ -n "$DB_PASSWORD" ] && sed -i '/^DB_PASSWORD=/d' /var/www/html/.env && echo "DB_PASSWORD=${DB_PASSWORD}" >> /var/www/html/.env

    URL="${DATABASE_URL:-$DB_URL}"
    if [ -n "$URL" ]; then
        sed -i '/^DB_URL=/d' /var/www/html/.env
        echo "DB_URL=${URL}" >> /var/www/html/.env
        sed -i '/^DATABASE_URL=/d' /var/www/html/.env
        echo "DATABASE_URL=${URL}" >> /var/www/html/.env
    fi

    TARGET_SSL="${DB_SSLMODE:-require}"
    sed -i '/^DB_SSLMODE=/d' /var/www/html/.env
    echo "DB_SSLMODE=${TARGET_SSL}" >> /var/www/html/.env
else
    TARGET_DB_FILE="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    sed -i '/^DB_DATABASE=/d' /var/www/html/.env
    echo "DB_DATABASE=${TARGET_DB_FILE}" >> /var/www/html/.env

    # Ensure SQLite directory and file exist
    mkdir -p "$(dirname "$TARGET_DB_FILE")"
    if [ ! -f "$TARGET_DB_FILE" ]; then
        touch "$TARGET_DB_FILE"
    fi
fi

sed -i '/^SESSION_DRIVER=/d' /var/www/html/.env
echo "SESSION_DRIVER=${SESSION_DRIVER:-file}" >> /var/www/html/.env

sed -i '/^CACHE_STORE=/d' /var/www/html/.env
echo "CACHE_STORE=${CACHE_STORE:-file}" >> /var/www/html/.env

# Ensure storage directories exist
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache
mkdir -p /var/www/html/database

# Ensure full write permissions for Apache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database /var/www/html/.env
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod 666 /var/www/html/.env

# Discover packages with runtime environment
php artisan package:discover --ansi || true

# Clear stale cached configs, views, and routes
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force || echo "Migration notice (continuing)"

# Ensure admin user exists (idempotent, does not overwrite real data)
echo "Ensuring admin user exists..."
php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder --force || echo "Seeder notice (continuing)"

# Cache valid config, routes, and views
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

echo "Initialization complete. Starting Apache..."
exec apache2-foreground
