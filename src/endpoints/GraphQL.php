<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\GraphQLService;

class GraphQL extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->post('', [$this, 'index']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function index(Request $request, Response $response)
    {

        $graphQLService = new GraphQLService($this->container);
        $rawInput = $request->getBody();
        $responseData = $graphQLService->index(
            $rawInput
        );

        return $this->responseWithData($request, $response, $responseData);
    }
}
