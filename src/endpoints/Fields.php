<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Database\Exception\FieldNotFoundException;
use Directus\Database\Exception\CollectionNotFoundException;
use Directus\Exception\ErrorException;
use Directus\Exception\UnauthorizedException;
use Directus\Services\TablesService;
use Directus\Services\PermissionsService;
use Directus\Util\ArrayUtils;
use Directus\Util\StringUtils;
use Directus\Database\Schema\DataTypes;
use Directus\Exception\SQLException;

class Fields extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->post('/{collection}', [$this, 'create']);
        $app->get('/{collection}/{field}', [$this, 'read']);
        $app->patch('/{collection}/{field}', [$this, 'update']);
        $app->patch('/{collection}', [$this, 'update']);
        $app->delete('/{collection}/{field}', [$this, 'delete']);
        $app->get('/{collection}', [$this, 'allByCollection']);
        $app->get('', [$this, 'all']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws UnauthorizedException
     */
    public function create(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new TablesService($this->container);
        $payload = $request->getParsedBody();
        $field = ArrayUtils::pull($payload, 'field');

        try {
            $responseData = $service->addColumn(
                $request->getAttribute('collection'),
                $field,
                $payload,
                $request->getQueryParams()
            );
        } catch (\Exception $e) {
            throw new SQLException($e->getMessage());
        }

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws FieldNotFoundException
     * @throws CollectionNotFoundException
     * @throws UnauthorizedException
     */
    public function read(Request $request, Response $response)
    {
        $collectionName = $request->getAttribute('collection');
        $fieldName = $request->getAttribute('field');
        $fieldsName = StringUtils::csv((string) $fieldName);

        $service = new TablesService($this->container);
        if (count($fieldsName) > 1) {
            $responseData = $service->findFields($collectionName, $fieldsName, $request->getQueryParams());
        } else {
            $responseData = $service->findField($collectionName, $fieldName, $request->getQueryParams());
        }

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws UnauthorizedException
     */
    public function update(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new TablesService($this->container);
        $field = $request->getAttribute('field');
        $payload = $request->getParsedBody();

        if (
            (isset($payload[0]) && is_array($payload[0]))
            || strpos($field, ',') > 0
        ) {
            return $this->batch($request, $response);
        }

        try {

            $responseData = $service->changeColumn(
                $request->getAttribute('collection'),
                $request->getAttribute('field'),
                $request->getParsedBody(),
                $request->getQueryParams()
            );
        } catch (\Exception $e) {
            throw new SQLException($e->getMessage());
        }

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Get all fields that belong to a given collection
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws CollectionNotFoundException
     * @throws UnauthorizedException
     */
    public function allByCollection(Request $request, Response $response)
    {
        $service = new TablesService($this->container);
        $responseData = $service->findAllFieldsByCollection(
            $request->getAttribute('collection'),
            $request->getQueryParams()
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Get all fields across the system
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     *
     * @throws CollectionNotFoundException
     * @throws UnauthorizedException
     */
    public function all(Request $request, Response $response)
    {
        $service = new TablesService($this->container);
        $responseData = $service->findAllFields(
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
     * @throws ErrorException
     * @throws UnauthorizedException
     */
    public function delete(Request $request, Response $response)
    {

        $service = new TablesService($this->container);

        $field = $service->getFieldObject($request->getAttribute('collection'), $request->getAttribute('field'));

        $service->deleteField(
            $request->getAttribute('collection'),
            $request->getAttribute('field'),
            $request->getQueryParams()
        );

        /**
         * If the field is status then remove the status related permission.
         */

        if (DataTypes::isStatusType($field->getType())) {
            $permissionService = new PermissionsService($this->container);
            $filter['filter']['collection'] = $request->getAttribute('collection');
            $filter['filter']['status']['neq'] = "";
            $collectionsPermission  = $permissionService->findAll($filter);
            $permissionId = array_column($collectionsPermission['data'], 'id');
            $permissionService->batchDeleteWithIds($permissionId);
        }

        return $this->responseWithData($request, $response, []);
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
        $tablesService = new TablesService($this->container);

        $collection = $request->getAttribute('collection');
        $tablesService->throwErrorIfSystemTable($collection);

        $payload = $request->getParsedBody();
        $params = $request->getQueryParams();

        if ($fields = $request->getAttribute('field')) {
            $ids = explode(',', $fields);
            $responseData = $tablesService->batchUpdateFieldWithIds($collection, $ids, $payload, $params);
        } else {
            $responseData = $tablesService->batchUpdateField($collection, $payload, $params);
        }

        return $this->responseWithData($request, $response, $responseData);
    }
}
