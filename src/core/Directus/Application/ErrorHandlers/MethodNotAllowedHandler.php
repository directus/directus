<?php

namespace Directus\Application\ErrorHandlers;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Exception\MethodNotAllowedException;

class MethodNotAllowedHandler
{
    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function __invoke(Request $request, Response $response)
    {
        return $response
            ->withStatus(Response::HTTP_METHOD_NOT_ALLOWED)
            ->withJson(['error' => [
                'code' => MethodNotAllowedException::ERROR_CODE,
                'message' => 'Method Not Allowed'
            ]]);
    }
}
