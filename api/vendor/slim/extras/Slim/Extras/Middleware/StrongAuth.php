<?php
/**
 * Strong Authentication
 *
 * Use this middleware with your Slim Framework application
 * to require HTTP basic auth for all routes.
 *
 * @author Andrew Smith <a.smith@silentworks.co.uk>
 * @version 1.0
 * @copyright 2012 Andrew Smith
 *
 * USAGE
 * 
 * $app = new \Slim\Slim();
 * $app->add(new \Slim\Extras\Middleware\StrongAuth(array('provider' => 'PDO', 'pdo' => new PDO('sqlite:memory'))));
 *
 * MIT LICENSE
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
namespace Slim\Extras\Middleware;

class StrongAuth extends \Slim\Middleware
{
    /**
     * @var array
     */
    protected $settings = array(
        'login.url' => '/',
        'auth.type' => 'http',
        'realm' => 'Protected Area',
    );

    /**
     * Constructor
     *
     * @param   array  $config   Configuration for Strong and Login Details
     * @param   \Strong\Strong $strong
     * @return  void
     */
    public function __construct(array $config = array(), \Strong\Strong $strong = null)
    {
        $this->config = array_merge($this->settings, $config);
        $this->auth = (!empty($strong)) ? $strong : \Strong\Strong::factory($this->config);
    }

    /**
     * Call
     *
     * @return void
     */
    public function call()
    {
        $req = $this->app->request();

        // Authentication Initialised
        switch ($this->config['auth.type']) {
            case 'form':
                $this->formAuth($this->auth, $req);
                break;
            default:
                $this->httpAuth($this->auth, $req);
                break;
        }
    }

    /**
     * Form based authentication
     *
     * @param \Strong\Strong $auth
     * @param object $req
     */
    private function formAuth($auth, $req)
    {
        $app = $this->app;
        $config = $this->config;
        $this->app->hook('slim.before.router', function () use ($app, $auth, $req, $config) {
            $secured_urls = isset($config['security.urls']) && is_array($config['security.urls']) ? $config['security.urls'] : array();
            foreach ($secured_urls as $surl) {
                $patternAsRegex = $surl['path'];
                if (substr($surl['path'], -1) === '/') {
                    $patternAsRegex = $patternAsRegex . '?';
                }
                $patternAsRegex = '@^' . $patternAsRegex . '$@';

                if (preg_match($patternAsRegex, $req->getPathInfo())) {
                    if (!$auth->loggedIn()) {
                        if ($req->getPath() !== $config['login.url']) {
                            $app->redirect($config['login.url']);
                        }
                    }
                }
            }
        });

        $this->next->call();
    }

    /**
     * HTTPAuth based authentication
     *
     * This method will check the HTTP request headers for previous authentication. If
     * the request has already authenticated, the next middleware is called. Otherwise,
     * a 401 Authentication Required response is returned to the client.
     *
     * @param \Strong\Strong $auth
     * @param object $req
     */
    private function httpAuth($auth, $req)
    {
        $res = $this->app->response();
        $authUser = $req->headers('PHP_AUTH_USER');
        $authPass = $req->headers('PHP_AUTH_PW');

        if ($authUser && $authPass && $auth->login($authUser, $authPass)) {
            $this->next->call();
        } else {
            $res->status(401);
            $res->header('WWW-Authenticate', sprintf('Basic realm="%s"', $this->config['realm']));
        }
    }
}
