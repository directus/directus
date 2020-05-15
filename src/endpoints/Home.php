<?php

namespace Directus\Api\Routes;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;

class Home extends Route
{
    public function __invoke(Request $request, Response $response)
    {
        $response = $response->withRedirect('./admin/');
        return $this->responseWithData($request, $response, []);
    }
}
