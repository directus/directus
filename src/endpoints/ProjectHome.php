<?php

namespace Directus\Api\Routes;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Permissions\Acl;
use Directus\Services\ServerService;

class ProjectHome extends Route
{
    public function __invoke(Request $request, Response $response)
    {
        /** @var Acl $acl */
        $acl = $this->container->get('acl');
        
        $service = new ServerService($this->container);
        if ($acl->getUserId()) {
            $responseData = $service->findAllInfo(false);
        } else {
            $responseData = [
                'data' => [
                    'api' => array_merge(['requires2FA' => false],$service->getPublicInfo())
                ]
            ];
        }
        
        return $this->responseWithData($request, $response, $responseData);
    }
}
