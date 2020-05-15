<?php

namespace Directus\Application\Http\Middleware;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Database\SchemaService;
use Directus\Database\TableGateway\BaseTableGateway;
use Directus\Database\TableGatewayFactory;

class TableGatewayMiddleware extends AbstractMiddleware
{
    public function __invoke(Request $request, Response $response, callable $next)
    {
        $container = $this->container;

        // tablegateway dependency
        SchemaService::setAclInstance($container->get('acl'));
        SchemaService::setConnectionInstance($container->get('database'));
        SchemaService::setConfig($container->get('config'));
        BaseTableGateway::setHookEmitter($container->get('hook_emitter'));
        BaseTableGateway::setContainer($container);
        TableGatewayFactory::setContainer($container);

        return $next($request, $response);
    }
}
