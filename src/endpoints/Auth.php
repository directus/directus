<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use function Directus\array_get;
use Directus\Authentication\Exception\UserWithEmailNotFoundException;
use Directus\Authentication\Sso\Social;
use Directus\Services\AuthService;
use Directus\Util\ArrayUtils;

class Auth extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->post('/authenticate', [$this, 'authenticate']);
        $app->post('/password/request', [$this, 'forgotPassword']);
        $app->get('/password/reset/{token}', [$this, 'resetPassword']);
        $app->post('/refresh', [$this, 'refresh']);
        $app->get('/sso', [$this, 'listSsoAuthServices']);
        $app->post('/sso/access_token', [$this, 'ssoAccessToken']);
        $app->get('/sso/{service}', [$this, 'ssoService']);
        $app->post('/sso/{service}', [$this, 'ssoAuthenticate']);
        $app->get('/sso/{service}/callback', [$this, 'ssoServiceCallback']);
    }

    /**
     * Sign In a new user, creating a new token
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function authenticate(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');

        $responseData = $authService->loginWithCredentials(
            $request->getParsedBodyParam('email'),
            $request->getParsedBodyParam('password')
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Sends a user a token to reset its password
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function forgotPassword(Request $request, Response $response)
    {
        $this->validateRequestPayload($request);
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');

        try {
            $authService->sendResetPasswordToken(
                $request->getParsedBodyParam('email')
            );
        } catch (\Exception $e) {
            $this->container->get('logger')->error($e);
        }

        return $this->responseWithData($request, $response, []);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function resetPassword(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');

        $authService->resetPasswordWithToken(
            $request->getAttribute('token')
        );

        return $this->responseWithData($request, $response, []);
    }

    /**
     * Refresh valid JWT token
     *
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function refresh(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');

        $responseData = $authService->refreshToken(
            $request->getParsedBodyParam('token')
        );

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function listSsoAuthServices(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');
        /** @var Social $externalAuth */
        $externalAuth = $this->container->get('external_auth');

        $services = [];
        foreach ($externalAuth->getAll() as $name => $provider) {
            $services[] = $authService->getSsoBasicInfo($name);
        }

        $responseData = ['data' => $services];

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function ssoService(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');
        $origin = $request->getReferer();
        $config = $this->container->get('config');
        $corsOptions = $config->get('cors', []);
        $allowedOrigins = ArrayUtils::get($corsOptions, 'origin');
        $session = $this->container->get('session');

        $responseData = $authService->getAuthenticationRequestInfo(
            $request->getAttribute('service')
        );

        if (\Directus\cors_is_origin_allowed($allowedOrigins, $origin)) {
            if (is_array($origin)) {
                $origin = array_shift($origin);
            }

            $session->set('sso_origin_url', $origin);
            $response = $response->withRedirect(array_get($responseData, 'data.authorization_url'));
        }

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function ssoAuthenticate(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');

        $responseData = $authService->authenticateWithSsoCode(
            $request->getAttribute('service'),
            $request->getParsedBody() ?: []
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
    public function ssoServiceCallback(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');
        $session = $this->container->get('session');
        // TODO: Implement a pull method
        $redirectUrl = $session->get('sso_origin_url');
        $session->remove('sso_origin_url');

        $responseData = [];
        $urlParams = [];
        try {
            $responseData = $authService->handleAuthenticationRequestCallback(
                $request->getAttribute('service'),
                !!$redirectUrl
            );

            $urlParams['request_token'] = array_get($responseData, 'data.token');
        } catch (\Exception $e) {
            if (!$redirectUrl) {
                throw $e;
            }

            if ($e instanceof UserWithEmailNotFoundException) {
                $urlParams['attributes'] = $e->getAttributes();
            }

            $urlParams['code'] = ($e instanceof \Directus\Exception\Exception) ? $e->getErrorCode() : 0;
            $urlParams['error'] = true;
        }

        if ($redirectUrl) {
            $redirectQueryString = parse_url($redirectUrl, PHP_URL_QUERY);
            $redirectUrlParts = explode('?', $redirectUrl);
            $redirectUrl = $redirectUrlParts[0];
            $redirectQueryParams = parse_str($redirectQueryString);
            if (is_array($redirectQueryParams)) {
                $urlParams = array_merge($redirectQueryParams, $urlParams);
            }

            $response = $response->withRedirect($redirectUrl . '?' . http_build_query($urlParams));
        }

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request $request
     * @param Response $response
     *
     * @return Response
     */
    public function ssoAccessToken(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');

        $responseData = $authService->authenticateWithSsoRequestToken(
            $request->getParsedBodyParam('request_token')
        );

        return $this->responseWithData($request, $response, $responseData);
    }
}
