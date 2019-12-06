<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Exception\Exception;
use Directus\Services\FoldersService;
use Directus\Util\ArrayUtils;

class Folders extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->get('', [$this, 'allFolders']);
        $app->post('', [$this, 'createFolder']);
        $app->get('/{id:[0-9]+}', [$this, 'readFolder']);
        $app->patch('/{id:[0-9]+}', [$this, 'updateFolder']);
        $app->delete('/{id:[0-9]+}', [$this, 'deleteFolder']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function allFolders(Request $request, Response $response)
    {
        $service = new FoldersService($this->container);
        $responseData = $service->findAllFolders(
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function createFolder(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new FoldersService($this->container);
        $responseData = $service->createFolder(
            $request->getParsedBody(),
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function readFolder(Request $request, Response $response)
    {
        $service = new FoldersService($this->container);
        $responseData = $service->findFolderByIds(
            $request->getAttribute('id'),
            ArrayUtils::pick($request->getQueryParams(), ['fields', 'meta'])
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function updateFolder(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new FoldersService($this->container);
        $responseData = $service->updateFolder(
            $request->getAttribute('id'),
            $request->getParsedBody(),
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, $responseData);
    }


    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function deleteFolder(Request $request, Response $response)
    {
        $service = new FoldersService($this->container);
        $service->deleteFolder(
            $request->getAttribute('id'),
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, []);
    }
}
