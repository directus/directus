<?php

$basePath =  realpath(__DIR__ . '/../');

require $basePath . '/vendor/autoload.php';

// Creates a simple endpoint to test the server rewriting
// If the server responds "pong" it means the rewriting works
// NOTE: The API requires the default project to be configured to properly works
//       It should work without the default project being configured
if (!file_exists($basePath . '/config/api.php')) {
    return \Directus\create_default_app($basePath);
}

// Get Environment name
$projectName = \Directus\get_api_project_from_request();

// All "globals" endpoints requires the project name beforehand
// Otherwise there's not way to tell which database to connect to
// It returns 401 Unauthorized error to any endpoint except /server/ping
if (!$projectName) {
    return \Directus\create_unknown_project_app($basePath);
}

$configFilePath = \Directus\create_config_path($basePath, $projectName);
if (!file_exists($configFilePath)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => [
            'error' => 8,
            'message' => 'API Environment Configuration Not Found: ' . $projectName
        ]
    ]);
    exit;
}

$maintenanceFlagPath = \Directus\create_maintenanceflag_path($basePath);
if (file_exists($maintenanceFlagPath)) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => [
            'error' => 21,
            'message' => 'This API instance is currently down for maintenance. Please try again later.'
        ]
    ]);
    exit;
}

$app = \Directus\create_app($basePath, require $configFilePath);

// ----------------------------------------------------------------------------
//

// =============================================================================
// Error reporting
// -----------------------------------------------------------------------------
// Possible values:
//
//  'production' => error suppression
//  'development' => no error suppression
//  'staging' => no error suppression
//
// =============================================================================

$errorReporting = E_ALL;
$displayErrors = 1;
if ($app->getConfig()->get('app.env', 'development') === 'production') {
    $displayErrors = $errorReporting = 0;
}

error_reporting($errorReporting);
ini_set('display_errors', $displayErrors);

// =============================================================================
// Timezone
// =============================================================================
date_default_timezone_set(\Directus\get_default_timezone());

$container = $app->getContainer();

\Directus\register_global_hooks($app);
\Directus\register_extensions_hooks($app);

$app->getContainer()->get('hook_emitter')->run('application.boot', $app);

// TODO: Implement a way to register middleware with a name
//       Allowing the app to add multiple into one
//       Ex: $app->add(['auth', 'cors']);
//       Or better yet combine multiple into one
//       $middleware = ['global' => ['cors', 'ip'];
//       Ex: $app->add(['global', 'auth']);
$middleware = [
    'table_gateway' => new \Directus\Application\Http\Middleware\TableGatewayMiddleware($app->getContainer()),
    'rate_limit_ip' => new \Directus\Application\Http\Middleware\IpRateLimitMiddleware($app->getContainer()),
    'ip' => new RKA\Middleware\IpAddress(),
    'proxy' => new \Directus\Application\Http\Middleware\ProxyMiddleware(),
    'cors' => new \Directus\Application\Http\Middleware\CorsMiddleware($app->getContainer()),
    'auth' => new \Directus\Application\Http\Middleware\AuthenticationMiddleware($app->getContainer()),
    'auth_user' => new \Directus\Application\Http\Middleware\AuthenticatedMiddleware($app->getContainer()),
    'auth_admin' => new \Directus\Application\Http\Middleware\AdminOnlyMiddleware($app->getContainer()),
    'auth_optional' => new \Directus\Application\Http\Middleware\AuthenticationOptionalMiddleware($app->getContainer()),
    'auth_ignore_origin' => new \Directus\Application\Http\Middleware\AuthenticationIgnoreOriginMiddleware($app->getContainer()),
    'rate_limit_user' => new \Directus\Application\Http\Middleware\UserRateLimitMiddleware($app->getContainer()),
];

$app->add($middleware['rate_limit_ip'])
    ->add($middleware['proxy'])
    ->add($middleware['ip'])
    ->add($middleware['cors']);

$app->get('/', \Directus\Api\Routes\Home::class)
    ->add($middleware['rate_limit_user'])
    ->add($middleware['auth_user'])
    ->add($middleware['auth'])
    ->add($middleware['auth_ignore_origin'])
    ->add($middleware['table_gateway']);

$app->group('/projects', function () use ($middleware) {
    $this->post('', \Directus\Api\Routes\ProjectsCreate::class);

    $this->delete('/{name}', \Directus\Api\Routes\ProjectsDelete::class)
        ->add($middleware['auth_admin'])
        ->add($middleware['auth'])
        ->add($middleware['auth_ignore_origin']);
})->add($middleware['table_gateway']);

$app->group('/{project}', function () use ($middleware) {
    $this->get('/', \Directus\Api\Routes\ProjectHome::class)
        ->add($middleware['auth_user'])
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['auth_optional'])
        ->add($middleware['table_gateway']);
    $this->post('/update', \Directus\Api\Routes\ProjectUpdate::class)
        ->add($middleware['auth_admin'])
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/activity', \Directus\Api\Routes\Activity::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/auth', \Directus\Api\Routes\Auth::class)
        ->add($middleware['table_gateway']);
    $this->group('/fields', \Directus\Api\Routes\Fields::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/files', \Directus\Api\Routes\Files::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/items', \Directus\Api\Routes\Items::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/collection_presets', \Directus\Api\Routes\CollectionPresets::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/permissions', \Directus\Api\Routes\Permissions::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/relations', \Directus\Api\Routes\Relations::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/revisions', \Directus\Api\Routes\Revisions::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/roles', \Directus\Api\Routes\Roles::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/settings', \Directus\Api\Routes\Settings::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/collections', \Directus\Api\Routes\Collections::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/users', \Directus\Api\Routes\Users::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/scim', function () {
        $this->group('/v2', \Directus\Api\Routes\ScimTwo::class);
    })->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/utils', \Directus\Api\Routes\Utils::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
    $this->group('/mail', \Directus\Api\Routes\Mail::class)
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);

    $this->group('/custom', function () {
        $endpointsList = \Directus\get_custom_endpoints('public/extensions/custom/endpoints');

        foreach ($endpointsList as $name => $endpoints) {
            \Directus\create_group_route_from_array($this, $name, $endpoints);
        }
    })
    ->add($middleware['auth'])
    ->add($middleware['table_gateway']);

    $this->group('/pages', function () {
        $endpointsList = \Directus\get_custom_endpoints('public/extensions/core/pages', true);

        foreach ($endpointsList as $name => $endpoints) {
            \Directus\create_group_route_from_array($this, $name, $endpoints);
        }
    })
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);

    $this->group('/interfaces', function () {
        $endpointsList = \Directus\get_custom_endpoints('public/extensions/core/interfaces', true);

        foreach ($endpointsList as $name => $endpoints) {
            \Directus\create_group_route_from_array($this, $name, $endpoints);
        }
    })
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);

    $this->group('/gql', \Directus\Api\Routes\GraphQL::class)
        ->add($middleware['auth_admin'])
        ->add($middleware['rate_limit_user'])
        ->add($middleware['auth'])
        ->add($middleware['table_gateway']);
});

$app->group('/interfaces', \Directus\Api\Routes\Interfaces::class)
    ->add($middleware['rate_limit_user'])
    ->add($middleware['auth_user'])
    ->add($middleware['auth'])
    ->add($middleware['auth_ignore_origin'])
    ->add($middleware['table_gateway']);
$app->group('/layouts', \Directus\Api\Routes\Layouts::class)
    ->add($middleware['rate_limit_user'])
    ->add($middleware['auth_user'])
    ->add($middleware['auth'])
    ->add($middleware['auth_ignore_origin'])
    ->add($middleware['table_gateway']);
$app->group('/pages', \Directus\Api\Routes\Pages::class)
    ->add($middleware['rate_limit_user'])
    ->add($middleware['auth_user'])
    ->add($middleware['auth'])
    ->add($middleware['auth_ignore_origin'])
    ->add($middleware['table_gateway']);
$app->group('/server', \Directus\Api\Routes\Server::class);
$app->group('/types', \Directus\Api\Routes\Types::class)
    ->add($middleware['rate_limit_user'])
    ->add($middleware['auth_user'])
    ->add($middleware['auth'])
    ->add($middleware['auth_ignore_origin'])
    ->add($middleware['table_gateway']);

$app->add(new \Directus\Application\Http\Middleware\ResponseCacheMiddleware($app->getContainer()));

return $app;
