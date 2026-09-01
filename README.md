<div align="center">
  <img src="public/logo.svg" alt="Pehlione" width="96">
  <h1>Pehlione Commerce</h1>
  <p>A modern product catalog, ordering, and operations experience.</p>

  <p>
    <img src="https://img.shields.io/badge/Laravel-12-FF2D20?logo=laravel&logoColor=white" alt="Laravel 12">
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827" alt="React 19">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5">
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
    <img src="https://img.shields.io/badge/license-MIT-22C55E" alt="MIT License">
  </p>
</div>

## About

Pehlione Commerce is a Laravel and Inertia-powered React application that brings the e-commerce journey together from product discovery to fulfillment. Customers can browse products, manage their cart, and complete checkout, while internal teams can track order preparation, shipping, and email activity through role-aware dashboards.

### Highlights

- Category-based catalog with detailed product pages
- Authentication, email verification, and two-factor security
- Persistent carts, address management, and discount codes
- Simulated PayPal, card, Klarna, and Sofort payment options
- Order preparation and shipping workflows
- Role-aware dashboards for Admin, Employee, Kunden, Marketing, Lager, and Vertrieb
- Built-in documentation and email activity center
- Responsive interface with light and dark themes

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | PHP 8.4, Laravel 12, Fortify, Pest 4 |
| Frontend | React 19, TypeScript, Inertia 2, Tailwind CSS 4 |
| UI | Radix UI, Headless UI, Lucide Icons |
| Data | MySQL 8.4 with Docker or SQLite locally |
| Tooling | Vite 7, Wayfinder, ESLint, Prettier, Pint |

## Quick start with Docker

You only need Docker Desktop and Docker Compose.

```bash
docker compose up --build
```

On the first start, dependencies are installed in the image, the database is migrated, and demo data is seeded automatically.

| Service | URL |
| --- | --- |
| Pehlione | http://localhost:8000 |
| Swagger UI | http://localhost:8000/swagger |
| OpenAPI YAML | http://localhost:8000/openapi.yaml |
| MailHog | http://localhost:8025 |
| MySQL | `localhost:3306` |

Run the stack in the background and follow the application logs:

```bash
docker compose up --build -d
docker compose logs -f laravel
```

Stop the containers with `docker compose down`. To remove the persistent MySQL data and start from a clean database:

```bash
docker compose down --volumes
```

> `--volumes` permanently removes the local MySQL volume created by this project.

### Docker configuration

The stack works without extra configuration. To customize ports or development credentials, add these optional values to the root `.env` file:

```dotenv
PEHLIONE_APP_PORT=8000
PEHLIONE_APP_KEY=base64:cGVobGlvbmUtbG9jYWwtZGV2ZWxvcG1lbnQta2V5ISE=
PEHLIONE_DB_PORT=3306
PEHLIONE_DB_DATABASE=pehlione
PEHLIONE_DB_USERNAME=pehlione
PEHLIONE_DB_PASSWORD=secret
PEHLIONE_DB_ROOT_PASSWORD=root
PEHLIONE_MAILHOG_HTTP_PORT=8025
PEHLIONE_MAILHOG_SMTP_PORT=1025
```

The `PEHLIONE_` prefix prevents Compose settings from colliding with Laravel's own database and mail variables.

## Local installation

Requirements: PHP 8.2–8.4, Composer 2, Node.js 22+, and npm.

```bash
git clone <repository-url>
cd pehlione_laravel_react

composer install
npm install

cp .env.example .env
php artisan key:generate
php artisan migrate --seed
```

On Windows PowerShell, replace `cp` with:

```powershell
Copy-Item .env.example .env
```

Start Laravel, the queue worker, and Vite together:

```bash
composer dev
```

The application is available at `http://localhost:8000` by default. For the local SQLite setup, make sure `database/database.sqlite` exists before running migrations.

## Demo accounts

The database seeder creates the following development accounts:

| Role | Email | Password |
| --- | --- | --- |
| Test user | `test@example.com` | `password` |
| Customer | `kunden@pehlione.com` | `D0cker` |
| Marketing | `marketing@pehlione.com` | `D0cker` |
| Warehouse | `lager@pehlione.com` | `D0cker` |
| Sales | `vertrieb@pehlione.com` | `D0cker` |
| Admin | `admin@pehlione.com` | `D0cker` |

> These accounts are intended for development and demonstrations only. Never use them in production.

## Development commands

```bash
# Laravel, queue worker, and Vite
composer dev

# Backend test suite
composer test

# Production frontend bundle
npm run build

# TypeScript validation
npm run types

# Code quality
npm run lint
npm run format:check
vendor/bin/pint
```

Run Artisan commands or tests inside the application container:

```bash
docker compose exec laravel php artisan about
docker compose exec laravel sh docker/test.sh
```

## HTTP routes and Swagger

The complete Laravel and Fortify route surface is described by the OpenAPI 3.1 file at [`resources/openapi/openapi.yaml`](resources/openapi/openapi.yaml). With the application running, open `http://localhost:8000/swagger` for Swagger UI or download the raw definition from `http://localhost:8000/openapi.yaml`.

These endpoints use Laravel's cookie-based web session rather than bearer tokens. In Swagger UI, first execute `GET /login` to initialize the session and XSRF cookies, then execute `POST /login` with a seeded account. The UI automatically copies the XSRF cookie into the request header for POST, PATCH, PUT, and DELETE operations. Swagger UI assets are loaded from unpkg, so the interactive page needs internet access; the YAML endpoint remains available offline.

[`request.http`](request.http) is a runnable smoke-test collection for all application, authentication, settings, Fortify, health, and local-storage routes. It is written for the JetBrains HTTP Client:

1. Start the application with `docker compose up --build` or `composer dev`.
2. Open `request.http` and run requests from top to bottom so the client retains the session cookies.
3. Adjust the variables at the top when testing existing cart items, orders, mail logs, or storage files. The cart and checkout requests capture `cartItemId` and `orderId` automatically when their setup calls succeed.
4. Review requests marked `MUTATING` or `DESTRUCTIVE` before running them. The final registration/account-deletion pair uses a disposable timestamped user.

For a machine-verifiable route inventory, run:

```bash
docker compose exec laravel php artisan route:list
```

## Project structure

```text
app/                 Laravel domain, HTTP, and service layers
database/            Migrations, factories, and seed data
resources/js/        Inertia React pages and components
resources/css/       Tailwind styles
resources/views/     Blade entry point and email templates
resources/openapi/   OpenAPI 3.1 route definition
routes/              Web, authentication, and settings routes
tests/               Pest feature and unit tests
docker/              Container startup scripts
request.http         Session-aware route smoke-test collection
```

## Email testing

All email is routed to MailHog in the Docker environment. Open `http://localhost:8025` to inspect order and verification messages without connecting to an external SMTP provider.

## Contributing

1. Create a short, descriptive branch.
2. Add tests for behavior changes.
3. Run `composer test`, `npm run types`, and `npm run format:check`.
4. Describe the change and any required migration or environment setup in the pull request.

## License

This project is available under the [MIT License](LICENSE).
