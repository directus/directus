<?php

namespace Directus\Application\ErrorHandlers;

use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Exception\NotInstalledException;

class NotInstalledNotFoundHandler
{
    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws NotInstalledException
     */
    public function __invoke(Request $request, Response $response)
    {
        throw new NotInstalledException('This Directus API instance has not been configured. Install via the Directus App (eg: /admin) or read more about configuration at: https://docs.directus.io/getting-started/installation.html#configure');
    }
}
