<?php

namespace Directus\Application\Http\Middleware;

use Directus\Api\Routes\Auth;
use Directus\Cache\Response as CacheResponse;
use Directus\Application\Http\Request;
use Directus\Application\Http\Response;
use Directus\Util\StringUtils;
use Slim\Http\Cookies;
use function Directus\get_directus_setting;
use function Directus\decrypt_static_token;
use function Directus\get_project_session_cookie_name;
use function Directus\get_request_authorization_token;
use Directus\Services\UserSessionService;
use Directus\Database\TableGateway\DirectusUserSessionsTableGateway;
use Directus\Util\DateTimeUtils;

class ResponseCacheMiddleware extends AbstractMiddleware
{
    /**
     * @param Request $request
     * @param Response $response
     * @param callable $next
     *
     * @return $this|Response
     */
    public function __invoke(Request $request, Response $response, callable $next)
    {
        $container = $this->container;
        $forceRefresh = false;

        /** @var CacheResponse $cache */
        $cache = $this->container->get('response_cache');

        if ($request->isGet()) {
            $parameters = $request->getQueryParams();
            ksort($parameters);

            $forceRefresh = (empty($parameters['refresh_cache'])) ? false : true;
            unset($parameters['refresh_cache']);

            $requestPath = $request->getUri()->getPath();

            $key = md5($container->get('acl')->getUserId() . '@' . $requestPath . '?' . http_build_query($parameters));
        } else if ($request->isPost() && StringUtils::endsWith($request->getUri()->getPath(), '/gql')) {
            // Handle caching for GraphQL query that are POST.
            // TODO:: Add support for ACL and Mutation
            $body = $request->getBody();
            $key = md5($body->getContents());
            $body->rewind();
        } else {
            $key = null;
        }

        $config = $container->get('config');
        if ($config->get('cache.enabled') && $key && !$forceRefresh && $cachedResponse = $cache->get($key)) {
            $body = new \Slim\Http\Body(fopen('php://temp', 'r+'));
            $body->write($cachedResponse['body']);
            $response = $response->withBody($body)->withHeaders($cachedResponse['headers']);
        } else {
            /** @var Response $response */
            $response = $next($request, $response);
            $body = $response->getBody();
            $body->rewind();
            $bodyContent = $body->getContents();
            $headers = $response->getHeaders();

            $cache->process($key, $bodyContent, $headers);
        }

        $authorizationTokenObject = get_request_authorization_token($request);

        $accessToken = null;
        try {
            if (!empty($authorizationTokenObject['token'])) {
                $userSessionService = new UserSessionService($container);
                $userSessionService->destroy([
                    'token_expired_at < ?' => DateTimeUtils::now()->toString()
                ]);

                //Use the common function for getting expiration time
                $auth=new Auth($this->container);
                $expiry = $auth->getSessionExpiryTime();

                switch ($authorizationTokenObject['type']) {
                    case DirectusUserSessionsTableGateway::TOKEN_COOKIE:
                        $accessToken = decrypt_static_token($authorizationTokenObject['token']);
                        $userSession = $userSessionService->find(['token' => $accessToken]);
                        $cookie = new Cookies();
                        $expiryAt = $userSession ? $expiry->format(\DateTime::COOKIE) : DateTimeUtils::now()->toString();
                        $cookie->set(
                            get_project_session_cookie_name($request),
                            [
                                'value' => $authorizationTokenObject['token'],
                                'expires' => $expiryAt,
                                'path' => '/',
                                'httponly' => true
                            ]
                        );

                        $cookieAsString = $cookie->toHeaders()[0];

                        $cookieAsString .= '; SameSite=' . $config->get('cookie.same_site');

                        if ($config->get('cookie.secure')) {
                            $cookieAsString .= '; Secure';
                        }

                        $response =  $response->withAddedHeader('Set-Cookie', $cookieAsString);
                        break;
                    default:
                        $userSession = $userSessionService->find(['token' => $authorizationTokenObject['token']]);
                        break;
                }
            }
            if (isset($userSession)) {
                $userSessionService->update($userSession['id'], ['token_expired_at' => $expiry->format('Y-m-d H:i:s')]);
            }
        } catch (\Exception $e) {
            $container->get('logger')->error($e->getMessage());
            $cookie = new Cookies();
            $cookie->set(
                get_project_session_cookie_name($request),
                [
                    'value' => $authorizationTokenObject['token'],
                    'expires' => DateTimeUtils::now()->toString(),
                    'path' => '/',
                    'httponly' => true
                ]
            );

            $cookieAsString = $cookie->toHeaders()[0];

            $cookieAsString .= '; SameSite=' . $config->get('cookie.same_site');

            if ($config->get('cookie.secure')) {
                $cookieAsString .= '; Secure';
            }

            $response =  $response->withAddedHeader('Set-Cookie', $cookieAsString);
        }

        $config = $container->get('config');
        if ($config->get('cors.credentials')) {
            $response = $response->withHeader('Access-Control-Allow-Credentials', 'true');
        }
        return $response;
    }
}
