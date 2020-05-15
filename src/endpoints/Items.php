<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\ItemsService;
use Directus\Services\RevisionsService;

class Items extends Route
{
    public function __invoke(Application $app)
    {
        $app->get('/{collection}', [$this, 'all']);
        $app->post('/{collection}', [$this, 'create']);
        $app->patch('/{collection}', [$this, 'update']);
        $app->get('/{collection}/{id}', [$this, 'read']);
        $app->patch('/{collection}/{id}', [$this, 'update']);
        $app->delete('/{collection}/{id}', [$this, 'delete']);

        // Revisions
        $app->get('/{collection}/{id}/revisions', [$this, 'itemRevisions']);
        $app->get('/{collection}/{id}/revisions/{offset}', [$this, 'oneItemRevision']);
        $app->patch('/{collection}/{id}/revert/{revision}', [$this, 'itemRevert']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function all(Request $request, Response $response)
    {
        $itemsService = new ItemsService($this->container);

        $collection = $request->getAttribute('collection');
        $itemsService->throwErrorIfSystemTable($collection);

        $params = $request->getQueryParams();
        $responseData = $itemsService->findAll($collection, $params);

        return $this->responseWithData($request, $response, $responseData);
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

        $itemsService = new ItemsService($this->container);
        $collection = $request->getAttribute('collection');
        $itemsService->throwErrorIfSystemTable($collection);

        $responseData = $itemsService->createItem(
            $collection,
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
        $itemsService = new ItemsService($this->container);
        $collection = $request->getAttribute('collection');
        $itemsService->throwErrorIfSystemTable($collection);

        $responseData = $itemsService->findByIds(
            $collection,
            $request->getAttribute('id'),
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
    public function update(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $itemsService = new ItemsService($this->container);
        $collection = $request->getAttribute('collection');
        $itemsService->throwErrorIfSystemTable($collection);

        $payload = $request->getParsedBody();
        if (isset($payload[0]) && is_array($payload[0])) {
            return $this->batch($request, $response);
        }

        $id = $request->getAttribute('id');

        if (strpos($id, ',') !== false) {
            return $this->batch($request, $response);
        }

        $params = $request->getQueryParams();
        $responseData = $itemsService->update($collection, $id, $payload, $params);

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
        $itemsService = new ItemsService($this->container);
        $collection = $request->getAttribute('collection');
        $itemsService->throwErrorIfSystemTable($collection);

        $id = $request->getAttribute('id');
        if (strpos($id, ',') !== false) {
            return $this->batch($request, $response);
        }

        $itemsService->delete($collection, $request->getAttribute('id'), $request->getQueryParams());

        return $this->responseWithData($request, $response, []);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function itemRevisions(Request $request, Response $response)
    {
        $service = new RevisionsService($this->container);
        $responseData = $service->findAllByItem(
            $request->getAttribute('collection'),
            $request->getAttribute('id'),
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
    public function oneItemRevision(Request $request, Response $response)
    {
        $service = new RevisionsService($this->container);
        $responseData = $service->findOneByItemOffset(
            $request->getAttribute('collection'),
            $request->getAttribute('id'),
            $request->getAttribute('offset'),
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
    public function itemRevert(Request $request, Response $response)
    {
        $service = new RevisionsService($this->container);
        $responseData = $service->revert(
            $request->getAttribute('collection'),
            $request->getAttribute('id'),
            $request->getAttribute('revision'),
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
        $itemsService = new ItemsService($this->container);

        $collection = $request->getAttribute('collection');
        $itemsService->throwErrorIfSystemTable($collection);

        $payload = $request->getParsedBody();
        $params = $request->getQueryParams();

        $responseData = null;
        if ($request->isPost()) {
            $responseData = $itemsService->batchCreate($collection, $payload, $params);
        } else if ($request->isPatch()) {
            if ($request->getAttribute('id')) {
                $ids = explode(',', $request->getAttribute('id'));
                $responseData = $itemsService->batchUpdateWithIds($collection, $ids, $payload, $params);
            } else {
                $responseData = $itemsService->batchUpdate($collection, $payload, $params);
            }
        } else if ($request->isDelete()) {
            $ids = explode(',', $request->getAttribute('id'));
            $itemsService->batchDeleteWithIds($collection, $ids, $params);
        }

        return $this->responseWithData($request, $response, $responseData);
    }
}
