<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\ActivityService;
use Directus\Util\ArrayUtils;

class Activity extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->get('', [$this, 'all']);
        $app->get('/{id}', [$this, 'read']);
        $app->post('/comment', [$this, 'createComment']);
        $app->patch('/comment/{id}', [$this, 'updateComment']);
        $app->delete('/comment/{id}', [$this, 'deleteComment']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function all(Request $request, Response $response)
    {
        $service = new ActivityService($this->container);
        $responseData = $service->findAll($request->getQueryParams());

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function read(Request $request, Response $response)
    {
        $service = new ActivityService($this->container);
        $responseData = $service->findByIds(
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
    public function createComment(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new ActivityService($this->container);
        $responseData = $service->createComment(
            $request->getParsedBody() ?: [],
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
    public function updateComment(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new ActivityService($this->container);
        $responseData = $service->updateComment(
            $request->getAttribute('id'),
            $request->getParsedBodyParam('comment'),
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
    public function deleteComment(Request $request, Response $response)
    {
        $service = new ActivityService($this->container);
        $service->deleteComment(
            $request->getAttribute('id')
        );

        return $this->responseWithData($request, $response, []);
    }
}
