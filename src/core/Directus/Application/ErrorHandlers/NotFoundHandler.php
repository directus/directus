<?php

namespace Directus\Application\ErrorHandlers;

use Directus\Application\ErrorHandlers\ErrorHandler;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Exception\NotFoundException;

class NotFoundHandler extends ErrorHandler
{
    /**
     * @param Request $request
     * @param Response $response
     * @param \Exception|\Throwable $exception
     *
     * @return Response
     */
    public function __invoke(Request $request, Response $response, $exception = null)
    {
        $response = $response->withStatus(Response::HTTP_NOT_FOUND);

        $data = [
            'error' => [
                'code' => NotFoundException::ERROR_CODE,
                'message' => 'Not Found'
            ]
        ];

        $this->triggerResponseAction($request, $response, $data);

        return $response->withJson($data);
    }
}
