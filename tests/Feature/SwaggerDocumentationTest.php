<?php

it('serves the Swagger UI', function (): void {
    $this->get(route('swagger'))
        ->assertOk()
        ->assertSee('swagger-ui');
});

it('serves the OpenAPI definition', function (): void {
    $this->get(route('openapi'))
        ->assertOk()
        ->assertHeader('content-type', 'application/yaml; charset=UTF-8');

    expect(file_get_contents(resource_path('openapi/openapi.yaml')))
        ->toContain('openapi: 3.1.0');
});
