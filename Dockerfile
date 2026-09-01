FROM composer:2 AS composer

FROM node:22-bookworm-slim AS node

FROM php:8.4-cli-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends git libsqlite3-dev libzip-dev unzip \
    && docker-php-ext-install -j"$(nproc)" bcmath pcntl pdo_mysql pdo_sqlite zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer /usr/bin/composer /usr/local/bin/composer
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN cp .env.example .env \
    && composer install --no-interaction --prefer-dist --optimize-autoloader \
    && npm run build \
    && npm cache clean --force \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/pehlione-entrypoint

EXPOSE 8000

ENTRYPOINT ["sh", "/usr/local/bin/pehlione-entrypoint"]
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public", "docker/server.php"]
