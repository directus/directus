<?php

namespace Directus\Api\Routes;

use Directus\Application\Application;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Application\Route;
use function Directus\array_get;
use function Directus\get_directus_setting;
use function Directus\get_project_session_cookie_name;
use function Directus\get_request_authorization_token;
use function Directus\encrypt_static_token;
use function Directus\decrypt_static_token;
use Directus\Authentication\Exception\UserWithEmailNotFoundException;
use Directus\Authentication\Exception\SsoNotAllowedException;
use Directus\Authentication\Sso\Social;
use Directus\Services\AuthService;
use Directus\Services\UsersService;
use Directus\Services\UserSessionService;
use Directus\Util\ArrayUtils;
use Slim\Http\Cookies;
use Directus\Database\TableGateway\DirectusUserSessionsTableGateway;
use Directus\Mail\Exception\MailNotSentException;

class Auth extends Route
{
    /**
     * @param Application $app
     */
    public function __invoke(Application $app)
    {
        $app->post('/authenticate', [$this, 'authenticate']);
        $app->get('/sessions', [$this, 'userSessions']);
        $app->post('/logout', [$this, 'logout']);
        $app->post('/logout/{user}', [$this, 'logoutFromAll']);
        $app->post('/logout/{user}/{id}', [$this, 'logoutFromOne']);
        $app->post('/password/request', [$this, 'forgotPassword']);
        $app->post('/password/reset', [$this, 'resetPassword']);
        $app->post('/refresh', [$this, 'refresh']);
        $app->get('/sso', [$this, 'listSsoAuthServices']);
        $app->post('/sso/access_token', [$this, 'ssoAccessToken']);
        $app->get('/sso/{service}', [$this, 'ssoService']);
        $app->post('/sso/{service}', [$this, 'ssoAuthenticate']);
        $app->get('/sso/{service}/callback', [$this, 'ssoServiceCallback']);
        $app->get('/check', [$this, 'check']);
    }

    /**
     * Sign In a new user, creating a new token.
     *
     * @param Request  $request
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
            $request->getParsedBodyParam('password'),
            $request->getParsedBodyParam('otp'),
            $request->getParam('mode')
        );

        if (isset($responseData['data']) && isset($responseData['data']['user'])) {
            switch ($request->getParam('mode')) {
                case DirectusUserSessionsTableGateway::TOKEN_COOKIE:
                    $response = $this->storeCookieSession($request, $response, $responseData['data']);
                    break;
                case DirectusUserSessionsTableGateway::TOKEN_JWT:
                default:
                    $this->storeJwtSession($responseData['data']);
            }
            $responseData['data']['user'] = ArrayUtils::omit($responseData['data']['user'], ['password', 'token', 'email_notifications', 'last_access_on', 'last_page']);
        }
        $responseData['data'] = !empty($responseData['data']) ? $responseData['data'] : null;

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Return the session history of given user.
     *
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function userSessions(Request $request, Response $response)
    {
        $responseData = [];
        $authorizationTokenObject = get_request_authorization_token($request);
        if (isset($authorizationTokenObject['type'])) {
            $accessToken = $authorizationTokenObject['type'] == DirectusUserSessionsTableGateway::TOKEN_COOKIE ? decrypt_static_token($authorizationTokenObject['token']) : $authorizationTokenObject['token'];
            $userSessionService = new UserSessionService($this->container);
            $userSession = $userSessionService->find(['token' => $accessToken]);
            if ($userSession) {
                $responseData = $userSessionService->findAll(['user' => $userSession['user']]);
            }
        }

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Returns boolean that indicates if current session is active or not
     *
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function check(Request $request, Response $response)
    {
        $authenticated = false;
        $authorizationTokenObject = get_request_authorization_token($request);
        if (isset($authorizationTokenObject['type'])) {
            $accessToken = $authorizationTokenObject['type'] == DirectusUserSessionsTableGateway::TOKEN_COOKIE ? decrypt_static_token($authorizationTokenObject['token']) : $authorizationTokenObject['token'];
            $userSessionService = new UserSessionService($this->container);
            $userSession = $userSessionService->find(['token' => $accessToken]);
            if ($userSession) {
                $authenticated = true;
            }
        }

        return $this->responseWithData($request, $response, [
            'data' => [
                'authenticated' => $authenticated,
            ]
        ]);
    }

    /**
     * Generate cookie token and store it into user sessions table.
     *
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function storeCookieSession($request, $response, $data)
    {
        $config = $this->container->get('config');
        $authorizationTokenObject = get_request_authorization_token($request);
        $expiry= $this->getSessionExpiryTime();
        $userSessionService = new UserSessionService($this->container);

        if (!empty($authorizationTokenObject['token'])) {
            $accessToken = decrypt_static_token($authorizationTokenObject['token']);
            $userSessionObject = $userSessionService->find(['token' => $accessToken]);
            $sessionToken = $userSessionObject['token'];
        } else {
            $userSession = $userSessionService->create([
                'user' => $data['user']['id'],
                'token' => $data['user']['token'],
                'token_type' => DirectusUserSessionsTableGateway::TOKEN_COOKIE,
                'token_expired_at' => $expiry->format('Y-m-d H:i:s'),
            ]);
            $sessionToken = $data['user']['token'].'-'.$userSession;
            $userSessionService->update($userSession, ['token' => $sessionToken]);
        }

        $cookie = new Cookies();
        $cookie->set(
            get_project_session_cookie_name($request),
            [
                'value' => encrypt_static_token($sessionToken),
                'expires' => $expiry->format(\DateTime::COOKIE),
                'path' => '/',
                'httponly' => true,
            ]
        );

        $cookieAsString = $cookie->toHeaders()[0];

        $cookieAsString .= '; SameSite=' . $config->get('cookie.same_site');

        if ($config->get('cookie.secure')) {
            $cookieAsString .= '; Secure';
        }

        return  $response->withAddedHeader('Set-Cookie', $cookieAsString);
    }

    /**
     * Generate jwt token and store login entry into user sessions table.
     *
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function storeJwtSession($data){
        $expiry= $this->getSessionExpiryTime();

        $userSessionService = new UserSessionService($this->container);
        $userSessionService->create([
            'user' => $data['user']['id'],
            'token' => $data['token'],
            'token_type' => DirectusUserSessionsTableGateway::TOKEN_JWT,
            'token_expired_at' => $expiry->format('Y-m-d H:i:s'),
        ]);
    }

    /**
     * Logout user's current session.
     *
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function logout(Request $request, Response $response)
    {
        $authorizationTokenObject = get_request_authorization_token($request);
        $accessToken = $authorizationTokenObject['type'] == DirectusUserSessionsTableGateway::TOKEN_COOKIE ? decrypt_static_token($authorizationTokenObject['token']) : $authorizationTokenObject['token'];
        $userSessionService = new UserSessionService($this->container);
        $userSessionService->destroy(['token' => $accessToken]);

        return $this->responseWithData($request, $response, []);
    }

    /**
     * Logout from user's all session.
     *
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function logoutFromAll(Request $request, Response $response)
    {
        $userSessionService = new UserSessionService($this->container);
        $responseData = $userSessionService->destroy(['user' => $request->getAttribute('user')]);

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Logout from user's particular session.
     *
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function logoutFromOne(Request $request, Response $response)
    {
        $userSessionService = new UserSessionService($this->container);
        $responseData = $userSessionService->destroy([
            'id' => $request->getAttribute('id'),
            'user' => $request->getAttribute('user'),
        ]);

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * Sends a user a token to reset its password.
     *
     * @param Request  $request
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
                $request->getParsedBodyParam('email'),
                $request->getParsedBodyParam('reset_url')
            );
        } catch (\Exception $e) {
            $this->container->get('logger')->error($e->getMessage());
            if (!empty($e->getCode())) {
                throw $e;
            }
            throw new MailNotSentException();
        }

        return $this->responseWithData($request, $response, []);
    }

    /**
     * @param Request  $request
     * @param Response $response
     *
     * @return Response
     */
    public function resetPassword(Request $request, Response $response)
    {
        /** @var AuthService $authService */
        $authService = $this->container->get('services')->get('auth');

        $authService->resetPasswordWithToken(
            $request->getParsedBodyParam('token'),
            $request->getParsedBodyParam('password')
        );

        return $this->responseWithData($request, $response, []);
    }

    /**
     * Refresh valid JWT token.
     *
     * @param Request  $request
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
     * @param Request  $request
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
     * @param Request  $request
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
        $session->set('mode', $request->getParam('mode'));
        $session->set('redirect_url', $request->getParam('redirect_url'));
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
     * @param Request  $request
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
     * @param Request  $request
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
        $mode = $session->get('mode');
        $redirectUrl = $session->get('redirect_url') ? $session->get('redirect_url') : $session->get('sso_origin_url');
        $responseData = [];
        $urlParams = [];

        try {
            $responseData = $authService->handleAuthenticationRequestCallback(
                $request->getAttribute('service'),
                true,
                $mode
            );

            if (isset($responseData['data']) && isset($responseData['data']['user'])) {
                $usersService = new UsersService($this->container);
                $tfa_enforced = $usersService->has2FAEnforced($responseData['data']['user']['id']);
                if ($tfa_enforced || !empty($responseData['data']['user']['2fa_secret'])) {
                    throw new SsoNotAllowedException();
                }

                switch ($mode) {
                    case DirectusUserSessionsTableGateway::TOKEN_COOKIE:
                        $response = $this->storeCookieSession($request, $response, $responseData['data']);
                        break;
                    default:
                        $this->storeJwtSession($responseData['data']);
                        $urlParams['request_token'] = array_get($responseData, 'data.token');
                }
            }
        } catch (\Exception $e) {
            if (!$redirectUrl) {
                throw $e;
            }

            if ($e instanceof UserWithEmailNotFoundException) {
                $urlParams['attributes'] = $e->getAttributes();
            }

            $urlParams['code'] = ($e instanceof \Directus\Exception\Exception) ? $e->getErrorCode() : -1;
            $urlParams['error'] = true;

            // Log error to the error file if it's not coming from Directus. This allows the user to debug
            // errors coming from the service provider
            if ($e instanceof \Directus\Exception\Exception === false) {
                $this->container->get('logger')->error($e);
            }
        }

        if ($redirectUrl) {
            $redirectQueryString = parse_url($redirectUrl, PHP_URL_QUERY);
            $redirectUrlParts = explode('?', $redirectUrl);
            $redirectUrl = $redirectUrlParts[0];
            parse_str($redirectQueryString, $redirectQueryParams);
            if (is_array($redirectQueryParams)) {
                $urlParams = array_merge($redirectQueryParams, $urlParams);
            }

            $urlToRedirect = !empty($urlParams) ? $redirectUrl.'?'.http_build_query($urlParams) : $redirectUrl;
            $response = $response->withRedirect($urlToRedirect);
        } else {
            $response = $response->withRedirect($redirectUrl);
        }

        $session->remove('mode');
        $session->remove('redirect_url');

        return $this->responseWithData($request, $response, $responseData);
    }

    /**
     * @param Request  $request
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

     /**
     *
     * Returns session expiration time
     *
     * @return Response
     */
    public function getSessionExpiryTime()
    {
        $expirationMinutes =  get_directus_setting('auto_sign_out');

        if($expirationMinutes == NULL || $expirationMinutes == '' || $expirationMinutes <= 0){
            //If auto sign out value is null or blank set the cookie expiry time to 10 years
            $expiry = new \DateTimeImmutable('now + 10 years');;
        } else {
            $expiry = new \DateTimeImmutable('now + '.$expirationMinutes.'minutes');
        }

        return $expiry;
    }
}
