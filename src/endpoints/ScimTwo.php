<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\ScimService;

class ScimTwo extends Route
{
    /**
     * @var ScimService
     */
    protected $service;

    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        // Users
        $app->post('/Users', [$this, 'createUser'])->setName('scim_v2_create_user');
        $app->get('/Users/{id}', [$this, 'oneUser'])->setName('scim_v2_read_user');
        $app->map(['PUT', 'PATCH'], '/Users/{id}', [$this, 'updateUser'])->setName('scim_v2_update_user');
        $app->get('/Users', [$this, 'listUsers'])->setName('scim_v2_list_users');

        // Groups
        $app->post('/Groups', [$this, 'createGroup'])->setName('scim_v2_create_group');
        $app->get('/Groups', [$this, 'listGroups'])->setName('scim_v2_list_groups');
        $app->get('/Groups/{id}', [$this, 'oneGroup'])->setName('scim_v2_read_group');
        $app->map(['PUT', 'PATCH'], '/Groups/{id}', [$this, 'updateGroup'])->setName('scim_v2_update_group');
        $app->delete('/Groups/{id}', [$this, 'deleteGroup'])->setName('scim_v2_delete_group');
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function createUser(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = $this->getService();
        $response->setHeader('Content-Type', 'application/scim+json');

        $responseData = $service->createUser(
            $request->getParsedBody()
        );

        $response = $response->withStatus(201);

        return $this->responseScimWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function createGroup(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = $this->getService();
        $response->setHeader('Content-Type', 'application/scim+json');

        $responseData = $service->createGroup(
            $request->getParsedBody()
        );

        $response = $response->withStatus(201);

        return $this->responseScimWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function updateUser(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = $this->getService();
        $response->setHeader('Content-Type', 'application/scim+json');

        $responseData = $service->updateUser(
            $request->getAttribute('id'),
            $request->getParsedBody()
        );

        return $this->responseScimWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function updateGroup(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = $this->getService();
        $response->setHeader('Content-Type', 'application/scim+json');

        $responseData = $service->updateGroup(
            $request->getAttribute('id'),
            $request->getParsedBody()
        );

        return $this->responseScimWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function oneUser(Request $request, Response $response)
    {
        $service = $this->getService();
        $response->setHeader('Content-Type', 'application/scim+json');

        $responseData = $service->findUser(
            $request->getAttribute('id')
        );

        return $this->responseScimWithData(
            $request,
            $response,
            $responseData
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function oneGroup(Request $request, Response $response)
    {
        $service = $this->getService();
        $response->setHeader('Content-Type', 'application/scim+json');

        $responseData = $service->findGroup(
            $request->getAttribute('id')
        );

        return $this->responseScimWithData(
            $request,
            $response,
            $responseData
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function listUsers(Request $request, Response $response)
    {
        $response->setHeader('Content-Type', 'application/scim+json');
        $responseData = $this->getService()->findAllUsers($request->getQueryParams());

        return $this->responseScimWithData(
            $request,
            $response,
            $responseData
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function listGroups(Request $request, Response $response)
    {
        $response->setHeader('Content-Type', 'application/scim+json');
        $responseData = $this->getService()->findAllGroups($request->getQueryParams());

        return $this->responseScimWithData(
            $request,
            $response,
            $responseData
        );
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function deleteGroup(Request $request, Response $response)
    {
        $response->setHeader('Content-Type', 'application/scim+json');
        $this->getService()->deleteGroup($request->getAttribute('id'));

        return $this->responseScimWithData(
            $request,
            $response,
            []
        );
    }

    /**
     * Gets the users service
     *
     * @return ScimService
     */
    protected function getService()
    {
        if (!$this->service) {
            $this->service = new ScimService($this->container);
        }

        return $this->service;
    }
}
