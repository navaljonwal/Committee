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

# Ensure correct production config and 32-byte APP_KEY in .env
sed -i '/^APP_KEY=/d' /var/www/html/.env
echo "APP_KEY=${VALID_KEY}" >> /var/www/html/.env

sed -i '/^APP_ENV=/d' /var/www/html/.env
echo "APP_ENV=production" >> /var/www/html/.env

sed -i '/^APP_DEBUG=/d' /var/www/html/.env
echo "APP_DEBUG=false" >> /var/www/html/.env

sed -i '/^DB_CONNECTION=/d' /var/www/html/.env
echo "DB_CONNECTION=sqlite" >> /var/www/html/.env

sed -i '/^DB_DATABASE=/d' /var/www/html/.env
echo "DB_DATABASE=/var/www/html/database/database.sqlite" >> /var/www/html/.env

sed -i '/^SESSION_DRIVER=/d' /var/www/html/.env
echo "SESSION_DRIVER=file" >> /var/www/html/.env

sed -i '/^CACHE_STORE=/d' /var/www/html/.env
echo "CACHE_STORE=file" >> /var/www/html/.env

# Ensure SQLite file exists
mkdir -p /var/www/html/database
if [ ! -f /var/www/html/database/database.sqlite ]; then
    touch /var/www/html/database/database.sqlite
fi

# Ensure storage directories exist
mkdir -p /var/www/html/storage/framework/cache/data
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Ensure full write permissions for Apache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database /var/www/html/.env
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod 666 /var/www/html/.env

# Clear stale cached configs and re-cache
php artisan config:clear
php artisan cache:clear

# Run database migrations and seed default admin user
echo "Running database migrations..."
php artisan migrate --force

echo "Seeding database with default admin and sample data..."
php artisan db:seed --force

# Cache valid config, routes, and views
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Initialization complete. Starting Apache..."
exec apache2-foreground
