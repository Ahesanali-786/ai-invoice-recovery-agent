#!/bin/bash
set -e

echo "Starting AI Recovery Agent deployment..."

# Set proper permissions
chown -R www-data:www-data /var/www/html/storage
chmod -R 775 /var/www/html/storage

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    cd /var/www/html && php artisan key:generate --ansi
fi

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
until mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p"$DB_PASSWORD" -e "SELECT 1" 2>/dev/null; do
    echo "MySQL not ready yet, waiting..."
    sleep 3
done
echo "MySQL is ready!"

# Run migrations
echo "Running database migrations..."
cd /var/www/html && php artisan migrate --force --ansi

# Cache configuration for production
echo "Caching configuration..."
cd /var/www/html && php artisan config:cache --ansi 2>/dev/null || true
cd /var/www/html && php artisan route:cache --ansi 2>/dev/null || true
cd /var/www/html && php artisan view:cache --ansi 2>/dev/null || true

echo "Starting Apache..."
exec apache2-foreground
