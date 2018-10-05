<?php

namespace Directus\Application\ErrorHandlers;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Exception\NotFoundException;

class NotFoundHandler
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
            ->withStatus(Response::HTTP_NOT_FOUND)
            ->withJson(['error' => [
                'code' => NotFoundException::ERROR_CODE,
                'message' => 'Not Found'
            ]]);
    }
}
