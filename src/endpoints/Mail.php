<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\MailService;

class Mail extends Route
{
    public function __invoke(Application $app)
    {
        $app->post('', [$this, 'send']);
    }

    public function send(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $mailService = new MailService($this->container);
        $mailService->send($request->getParsedBody());

        return $this->responseWithData($request, $response, []);
    }
}
