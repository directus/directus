<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Database\Schema\DataTypes;

class Types extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->get('', [$this, 'all']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function all(Request $request, Response $response)
    {
        $responseData = [
            'data' => array_values(array_map(function ($type) {
                return ['name' => $type];
            }, DataTypes::getAllTypes()))
        ];

        return $this->responseWithData($request, $response, $responseData);
    }
}
