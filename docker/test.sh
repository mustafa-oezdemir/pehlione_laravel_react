#!/bin/sh
set -eu

# Compose injects runtime service settings. Remove them so phpunit.xml can
# provide the isolated SQLite, array session, queue, cache, and mail drivers.
unset APP_ENV APP_KEY APP_DEBUG APP_URL
unset CACHE_STORE SESSION_DRIVER QUEUE_CONNECTION
unset DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD
unset MAIL_MAILER MAIL_HOST MAIL_PORT MAIL_ENCRYPTION

exec php artisan test "$@"
