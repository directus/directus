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
        throw new NotInstalledException('This instance of the Directus API has not been configured properly. Read More at: https://github.com/directus');
    }
}
