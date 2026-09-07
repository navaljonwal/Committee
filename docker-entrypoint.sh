#!/bin/sh
set -e

echo "Starting ChitFund Pro container initialization..."

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

# Ensure full permissions for Apache (www-data)
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database
chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

# Clear stale cached configs
php artisan config:clear
php artisan cache:clear

# Run database migrations and seed default admin user
echo "Running database migrations..."
php artisan migrate --force

echo "Seeding database with default admin and sample data..."
php artisan db:seed --force

# Optimize routes and views
php artisan route:cache
php artisan view:cache

echo "Initialization complete. Starting Apache..."
exec apache2-foreground
