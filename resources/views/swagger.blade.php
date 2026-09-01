<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Pehlione HTTP API documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
        <style>
            body { margin: 0; background: #f7f7f8; }
            .topbar { display: none; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
            window.addEventListener('load', () => {
                window.ui = SwaggerUIBundle({
                    url: @json(route('openapi', absolute: false)),
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    displayRequestDuration: true,
                    persistAuthorization: true,
                    requestInterceptor: (request) => {
                        const token = document.cookie
                            .split('; ')
                            .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
                            ?.split('=').slice(1).join('=');

                        if (token && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
                            request.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
                        }

                        return request;
                    },
                });
            });
        </script>
    </body>
</html>
