<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use Directus\Services\UtilsService;

class Utils extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->post('/hash', [$this, 'hash']);
        $app->post('/hash/match', [$this, 'matchHash']);
        $app->post('/random/string', [$this, 'randomString']);
        $app->get('/2fa_secret', [$this, 'generate2FASecret']);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function hash(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new UtilsService($this->container);

        $options = $request->getParsedBodyParam('options', []);
        if (!is_array($options)) {
            $options = [$options];
        }

        $responseData = $service->hashString(
            $request->getParsedBodyParam('string'),
            $request->getParsedBodyParam('hasher', 'core'),
            $options
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function matchHash(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new UtilsService($this->container);

        $options = $request->getParsedBodyParam('options', []);
        if (!is_array($options)) {
            $options = [$options];
        }

        $responseData = $service->verifyHashString(
            $request->getParsedBodyParam('string'),
            $request->getParsedBodyParam('hash'),
            $request->getParsedBodyParam('hasher', 'core'),
            $options
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function randomString(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        $service = new UtilsService($this->container);
        $responseData = $service->randomString(
            $request->getParsedBodyParam('length', 32),
            $request->getParsedBodyParam('options')
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /** Endpoint to generate a 2FA secret
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function generate2FASecret(Request $request, Response $response)
    {
        $service = new UtilsService($this->container);
        $responseData = $service->generate2FASecret();
        return $this->responseWithData($request, $response, $responseData);
    }
}
