<?php

namespace Directus\Application\ErrorHandlers;

use Directus\Application\ErrorHandlers\ErrorHandler;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Exception\MethodNotAllowedException;

class MethodNotAllowedHandler extends ErrorHandler
{
    /**
     * @param Request $request
     * @param Response $response
     * @param array $allowed methods
     *
     * @return Response
     */
    public function __invoke(Request $request, Response $response, $allowed)
    {
        $response = $response->withStatus(Response::HTTP_METHOD_NOT_ALLOWED);

        $data = [
            'error' => [
                'code' => MethodNotAllowedException::ERROR_CODE,
                'message' => 'Method Not Allowed'
            ]
        ];

        $this->triggerResponseAction($request, $response, $data);

        return $response->withJson($data);
    }
}
