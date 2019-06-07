<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Database\Schema\SchemaManager;
use Directus\Database\TableGateway\DirectusUsersTableGateway;
use Directus\Services\RevisionsService;
use Directus\Services\UsersService;

class Users extends Route
{
    /** @var $usersGateway DirectusUsersTableGateway */
    protected $usersGateway;

    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->get('', [$this, 'all']);
        $app->post('', [$this, 'create']);
        $app->get('/{id}', [$this, 'read']);
        $app->post('/invite', [$this, 'invite']);
        $app->map(['GET', 'POST'], '/invite/{token}', [$this, 'acceptInvitation']);
        $app->patch('/{id}', [$this, 'update']);
        $app->delete('/{id}', [$this, 'delete']);

        // Revisions
        $app->get('/{id}/revisions', [$this, 'userRevisions']);
        $app->get('/{id}/revisions/{offset}', [$this, 'oneUserRevision']);

        // Tracking
        $app->patch('/{id}/tracking/page', [$this, 'trackPage']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function all(Request $request, Response $response)
    {
        $service = new UsersService($this->container);
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
     */
    public function create(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new UsersService($this->container);
        $responseData = $service->create(
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
    public function read(Request $request, Response $response)
    {
        $service = new UsersService($this->container);
        $responseData = $service->findByIds(
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
    public function invite(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new UsersService($this->container);

        $responseData = $service->invite(
            $request->getParsedBodyParam('email'),
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
        $service = new UsersService($this->container);
        $responseData = $service->update(
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
    public function delete(Request $request, Response $response)
    {
        $service = new UsersService($this->container);
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
    public function userRevisions(Request $request, Response $response)
    {
        $service = new RevisionsService($this->container);
        $responseData = $service->findAllByItem(
            SchemaManager::COLLECTION_USERS,
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
    public function oneUserRevision(Request $request, Response $response)
    {
        $service = new RevisionsService($this->container);
        $responseData = $service->findOneByItemOffset(
            SchemaManager::COLLECTION_USERS,
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
    public function trackPage(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new UsersService($this->container);
        $responseData = $service->updateLastPage(
            $request->getAttribute('id'),
            $request->getParsedBodyParam('last_page'),
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
    public function acceptInvitation(Request $request, Response $response)
    {
        $service = new UsersService($this->container);
        $responseData = $service->enableUserWithInvitation(
            $request->getAttribute('token')
        );

        return $this->responseWithData($request, $response, $responseData);
    }
}
