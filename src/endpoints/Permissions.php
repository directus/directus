<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use function Directus\regex_numeric_ids;
use Directus\Services\PermissionsService;
use Directus\Util\ArrayUtils;

class Permissions extends Route
{
    public function __invoke(Application $app)
    {
        $app->post('', [$this, 'create']);
        $app->get('/{id:' . regex_numeric_ids() . '}', [$this, 'read']);
        $app->get('/me', [$this, 'readUser']);
        $app->get('/me/{collection}', [$this, 'readUserCollection']);
        $app->patch('/{id:' . regex_numeric_ids() . '}', [$this, 'update']);
        $app->patch('', [$this, 'update']);
        $app->delete('/{id}', [$this, 'delete']);
        $app->get('', [$this, 'all']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function create(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $payload = $request->getParsedBody();
        if (isset($payload[0]) && is_array($payload[0])) {
            return $this->batch($request, $response);
        }

        $service = new PermissionsService($this->container);
        $responseData = $service->create(
            $payload,
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
    public function read(Request $request, Response $response)
    {
        $service = new PermissionsService($this->container);

        $responseData = $service->findByIds(
            $request->getAttribute('id'),
            ArrayUtils::pick($request->getQueryParams(), ['fields', 'meta'])
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Fetch authenticated user permissions
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function readUser(Request $request, Response $response)
    {
        $service = new PermissionsService($this->container);
        $responseData = $service->getUserPermissions();

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Fetch authenticated user permission of a given collection
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function readUserCollection(Request $request, Response $response)
    {
        $service = new PermissionsService($this->container);
        $responseData = $service->getUserCollectionPermissions($request->getAttribute('collection'));

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function update(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $payload = $request->getParsedBody();
        if (isset($payload[0]) && is_array($payload[0])) {
            return $this->batch($request, $response);
        }

        $id = $request->getAttribute('id');
        if (strpos($id, ',') !== false) {
            return $this->batch($request, $response);
        }

        $service = new PermissionsService($this->container);
        $responseData = $service->update(
            $request->getAttribute('id'),
            $payload,
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
    public function delete(Request $request, Response $response)
    {
        $service = new PermissionsService($this->container);
        $service->delete(
            $request->getAttribute('id'),
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, []);
    }
    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function all(Request $request, Response $response)
    {
        $service = new PermissionsService($this->container);
        $responseData = $service->findAll(
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws \Exception
     */
    protected function batch(Request $request, Response $response)
    {
        $permissionService = new PermissionsService($this->container);

        $collection = $request->getAttribute('collection');
        $permissionService->throwErrorIfSystemTable($collection);

        $payload = $request->getParsedBody();
        $params = $request->getQueryParams();

        $responseData = null;
        if ($request->isPost()) {
            $responseData = $permissionService->batchCreate($payload, $params);
        } else if ($request->isPatch()) {
            if ($request->getAttribute('id')) {
                $ids = explode(',', $request->getAttribute('id'));
                $responseData = $permissionService->batchUpdateWithIds($ids, $payload, $params);
            } else {
                $responseData = $permissionService->batchUpdate($payload, $params);
            }
        } else if ($request->isDelete()) {
            $ids = explode(',', $request->getAttribute('id'));
            $permissionService->batchDeleteWithIds($ids, $params);
        }

        return $this->responseWithData($request, $response, $responseData);
    }
}
