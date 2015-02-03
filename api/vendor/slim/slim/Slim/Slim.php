<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.2.0
 * @package     Slim
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
namespace Slim;

// Ensure mcrypt constants are defined even if mcrypt extension is not loaded
if (!extension_loaded('mcrypt')) {
    define('MCRYPT_MODE_CBC', 0);
    define('MCRYPT_RIJNDAEL_256', 0);
}

/**
 * Slim
 * @package Slim
 * @author  Josh Lockhart
 * @since   1.0.0
 */
class Slim
{
    /**
     * @const string
     */
    const VERSION = '2.2.0';

    /**
     * @var array[\Slim]
     */
    protected static $apps = array();

    /**
     * @var string
     */
    protected $name;

    /**
     * @var array
     */
    protected $environment;

    /**
     * @var \Slim\Http\Request
     */
    protected $request;

    /**
     * @var \Slim\Http\Response
     */
    protected $response;

    /**
     * @var \Slim\Router
     */
    protected $router;

    /**
     * @var \Slim\View
     */
    protected $view;

    /**
     * @var array
     */
    protected $settings;

    /**
     * @var string
     */
    protected $mode;

    /**
     * @var array
     */
    protected $middleware;

    /**
     * @var mixed Callable to be invoked if application error
     */
    protected $error;

    /**
     * @var mixed Callable to be invoked if no matching routes are found
     */
    protected $notFound;

    /**
     * @var array
     */
    protected $hooks = array(
        'slim.before' => array(array()),
        'slim.before.router' => array(array()),
        'slim.before.dispatch' => array(array()),
        'slim.after.dispatch' => array(array()),
        'slim.after.router' => array(array()),
        'slim.after' => array(array())
    );

    /********************************************************************************
    * PSR-0 Autoloader
    *
    * Do not use if you are using Composer to autoload dependencies.
    *******************************************************************************/

    /**
     * Slim PSR-0 autoloader
     */
    public static function autoload($className)
    {
        $thisClass = str_replace(__NAMESPACE__.'\\', '', __CLASS__);

        $baseDir = __DIR__;

        if (substr($baseDir, -strlen($thisClass)) === $thisClass) {
            $baseDir = substr($baseDir, 0, -strlen($thisClass));
        }

        $className = ltrim($className, '\\');
        $fileName  = $baseDir;
        $namespace = '';
        if ($lastNsPos = strripos($className, '\\')) {
            $namespace = substr($className, 0, $lastNsPos);
            $className = substr($className, $lastNsPos + 1);
            $fileName  .= str_replace('\\', DIRECTORY_SEPARATOR, $namespace) . DIRECTORY_SEPARATOR;
        }
        $fileName .= str_replace('_', DIRECTORY_SEPARATOR, $className) . '.php';

        if (file_exists($fileName)) {
            require $fileName;
        }
    }

    /**
     * Register Slim's PSR-0 autoloader
     */
    public static function registerAutoloader()
    {
        spl_autoload_register(__NAMESPACE__ . "\\Slim::autoload");
    }

    /********************************************************************************
    * Instantiation and Configuration
    *******************************************************************************/

    /**
     * Constructor
     * @param  array $userSettings Associative array of application settings
     */
    public function __construct($userSettings = array())
    {
        // Setup Slim application
        $this->settings = array_merge(static::getDefaultSettings(), $userSettings);
        $this->environment = \Slim\Environment::getInstance();
        $this->request = new \Slim\Http\Request($this->environment);
        $this->response = new \Slim\Http\Response();
        $this->router = new \Slim\Router();
        $this->middleware = array($this);
        $this->add(new \Slim\Middleware\Flash());
        $this->add(new \Slim\Middleware\MethodOverride());

        // Determine application mode
        $this->getMode();

        // Setup view
        $this->view($this->config('view'));

        // Make default if first instance
        if (is_null(static::getInstance())) {
            $this->setName('default');
        }

        // Set default logger that writes to stderr (may be overridden with middleware)
        $logWriter = $this->config('log.writer');
        if (!$logWriter) {
            $logWriter = new \Slim\LogWriter($this->environment['slim.errors']);
        }
        $log = new \Slim\Log($logWriter);
        $log->setEnabled($this->config('log.enabled'));
        $log->setLevel($this->config('log.level'));
        $this->environment['slim.log'] = $log;
    }

    /**
     * Get application instance by name
     * @param  string    $name The name of the Slim application
     * @return \Slim|null
     */
    public static function getInstance($name = 'default')
    {
        return isset(static::$apps[$name]) ? static::$apps[$name] : null;
    }

    /**
     * Set Slim application name
     * @param  string $name The name of this Slim application
     */
    public function setName($name)
    {
        $this->name = $name;
        static::$apps[$name] = $this;
    }

    /**
     * Get Slim application name
     * @return string|null
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Get default application settings
     * @return array
     */
    public static function getDefaultSettings()
    {
        return array(
            // Application
            'mode' => 'development',
            // Debugging
            'debug' => true,
            // Logging
            'log.writer' => null,
            'log.level' => \Slim\Log::DEBUG,
            'log.enabled' => true,
            // View
            'templates.path' => './templates',
            'view' => '\Slim\View',
            // Cookies
            'cookies.lifetime' => '20 minutes',
            'cookies.path' => '/',
            'cookies.domain' => null,
            'cookies.secure' => false,
            'cookies.httponly' => false,
            // Encryption
            'cookies.secret_key' => 'CHANGE_ME',
            'cookies.cipher' => MCRYPT_RIJNDAEL_256,
            'cookies.cipher_mode' => MCRYPT_MODE_CBC,
            // HTTP
            'http.version' => '1.1'
        );
    }

    /**
     * Configure Slim Settings
     *
     * This method defines application settings and acts as a setter and a getter.
     *
     * If only one argument is specified and that argument is a string, the value
     * of the setting identified by the first argument will be returned, or NULL if
     * that setting does not exist.
     *
     * If only one argument is specified and that argument is an associative array,
     * the array will be merged into the existing application settings.
     *
     * If two arguments are provided, the first argument is the name of the setting
     * to be created or updated, and the second argument is the setting value.
     *
     * @param  string|array $name  If a string, the name of the setting to set or retrieve. Else an associated array of setting names and values
     * @param  mixed        $value If name is a string, the value of the setting identified by $name
     * @return mixed        The value of a setting if only one argument is a string
     */
    public function config($name, $value = null)
    {
        if (func_num_args() === 1) {
            if (is_array($name)) {
                $this->settings = array_merge($this->settings, $name);
            } else {
                return isset($this->settings[$name]) ? $this->settings[$name] : null;
            }
        } else {
            $this->settings[$name] = $value;
        }
    }

    /********************************************************************************
    * Application Modes
    *******************************************************************************/

    /**
     * Get application mode
     *
     * This method determines the application mode. It first inspects the $_ENV
     * superglobal for key `SLIM_MODE`. If that is not found, it queries
     * the `getenv` function. Else, it uses the application `mode` setting.
     *
     * @return string
     */
    public function getMode()
    {
        if (!isset($this->mode)) {
            if (isset($_ENV['SLIM_MODE'])) {
                $this->mode = $_ENV['SLIM_MODE'];
            } else {
                $envMode = getenv('SLIM_MODE');
                if ($envMode !== false) {
                    $this->mode = $envMode;
                } else {
                    $this->mode = $this->config('mode');
                }
            }
        }

        return $this->mode;
    }

    /**
     * Configure Slim for a given mode
     *
     * This method will immediately invoke the callable if
     * the specified mode matches the current application mode.
     * Otherwise, the callable is ignored. This should be called
     * only _after_ you initialize your Slim app.
     *
     * @param  string $mode
     * @param  mixed  $callable
     * @return void
     */
    public function configureMode($mode, $callable)
    {
        if ($mode === $this->getMode() && is_callable($callable)) {
            call_user_func($callable);
        }
    }

    /********************************************************************************
    * Logging
    *******************************************************************************/

    /**
     * Get application log
     * @return \Slim\Log
     */
    public function getLog()
    {
        return $this->environment['slim.log'];
    }

    /********************************************************************************
    * Routing
    *******************************************************************************/

    /**
     * Add GET|POST|PUT|DELETE route
     *
     * Adds a new route to the router with associated callable. This
     * route will only be invoked when the HTTP request's method matches
     * this route's method.
     *
     * ARGUMENTS:
     *
     * First:       string  The URL pattern (REQUIRED)
     * In-Between:  mixed   Anything that returns TRUE for `is_callable` (OPTIONAL)
     * Last:        mixed   Anything that returns TRUE for `is_callable` (REQUIRED)
     *
     * The first argument is required and must always be the
     * route pattern (ie. '/books/:id').
     *
     * The last argument is required and must always be the callable object
     * to be invoked when the route matches an HTTP request.
     *
     * You may also provide an unlimited number of in-between arguments;
     * each interior argument must be callable and will be invoked in the
     * order specified before the route's callable is invoked.
     *
     * USAGE:
     *
     * Slim::get('/foo'[, middleware, middleware, ...], callable);
     *
     * @param   array (See notes above)
     * @return  \Slim\Route
     */
    protected function mapRoute($args)
    {
        $pattern = array_shift($args);
        $callable = array_pop($args);
        $route = $this->router->map($pattern, $callable);
        if (count($args) > 0) {
            $route->setMiddleware($args);
        }

        return $route;
    }

    /**
     * Add generic route without associated HTTP method
     * @see    mapRoute()
     * @return \Slim\Route
     */
    public function map()
    {
        $args = func_get_args();

        return $this->mapRoute($args);
    }

    /**
     * Add GET route
     * @see    mapRoute()
     * @return \Slim\Route
     */
    public function get()
    {
        $args = func_get_args();

        return $this->mapRoute($args)->via(\Slim\Http\Request::METHOD_GET, \Slim\Http\Request::METHOD_HEAD);
    }

    /**
     * Add POST route
     * @see    mapRoute()
     * @return \Slim\Route
     */
    public function post()
    {
        $args = func_get_args();

        return $this->mapRoute($args)->via(\Slim\Http\Request::METHOD_POST);
    }

    /**
     * Add PUT route
     * @see    mapRoute()
     * @return \Slim\Route
     */
    public function put()
    {
        $args = func_get_args();

        return $this->mapRoute($args)->via(\Slim\Http\Request::METHOD_PUT);
    }

    /**
     * Add DELETE route
     * @see    mapRoute()
     * @return \Slim\Route
     */
    public function delete()
    {
        $args = func_get_args();

        return $this->mapRoute($args)->via(\Slim\Http\Request::METHOD_DELETE);
    }

    /**
     * Add OPTIONS route
     * @see    mapRoute()
     * @return \Slim\Route
     */
    public function options()
    {
        $args = func_get_args();

        return $this->mapRoute($args)->via(\Slim\Http\Request::METHOD_OPTIONS);
    }

    /**
     * Not Found Handler
     *
     * This method defines or invokes the application-wide Not Found handler.
     * There are two contexts in which this method may be invoked:
     *
     * 1. When declaring the handler:
     *
     * If the $callable parameter is not null and is callable, this
     * method will register the callable to be invoked when no
     * routes match the current HTTP request. It WILL NOT invoke the callable.
     *
     * 2. When invoking the handler:
     *
     * If the $callable parameter is null, Slim assumes you want
     * to invoke an already-registered handler. If the handler has been
     * registered and is callable, it is invoked and sends a 404 HTTP Response
     * whose body is the output of the Not Found handler.
     *
     * @param  mixed $callable Anything that returns true for is_callable()
     */
    public function notFound( $callable = null ) {
        if ( is_callable($callable) ) {
            $this->notFound = $callable;
        } else {
            ob_start();
            if ( is_callable($this->notFound) ) {
                call_user_func($this->notFound);
            } else {
                call_user_func(array($this, 'defaultNotFound'));
            }
            $this->halt(404, ob_get_clean());
        }
    }

    /**
     * Error Handler
     *
     * This method defines or invokes the application-wide Error handler.
     * There are two contexts in which this method may be invoked:
     *
     * 1. When declaring the handler:
     *
     * If the $argument parameter is callable, this
     * method will register the callable to be invoked when an uncaught
     * Exception is detected, or when otherwise explicitly invoked.
     * The handler WILL NOT be invoked in this context.
     *
     * 2. When invoking the handler:
     *
     * If the $argument parameter is not callable, Slim assumes you want
     * to invoke an already-registered handler. If the handler has been
     * registered and is callable, it is invoked and passed the caught Exception
     * as its one and only argument. The error handler's output is captured
     * into an output buffer and sent as the body of a 500 HTTP Response.
     *
     * @param  mixed $argument Callable|\Exception
     */
    public function error($argument = null)
    {
        if (is_callable($argument)) {
            //Register error handler
            $this->error = $argument;
        } else {
            //Invoke error handler
            $this->response->status(500);
            $this->response->body('');
            $this->response->write($this->callErrorHandler($argument));
            $this->stop();
        }
    }

    /**
     * Call error handler
     *
     * This will invoke the custom or default error handler
     * and RETURN its output.
     *
     * @param  \Exception|null $argument
     * @return string
     */
    protected function callErrorHandler($argument = null)
    {
        ob_start();
        if ( is_callable($this->error) ) {
            call_user_func_array($this->error, array($argument));
        } else {
            call_user_func_array(array($this, 'defaultError'), array($argument));
        }

        return ob_get_clean();
    }

    /********************************************************************************
    * Application Accessors
    *******************************************************************************/

    /**
     * Get a reference to the Environment object
     * @return \Slim\Environment
     */
    public function environment()
    {
        return $this->environment;
    }

    /**
     * Get the Request object
     * @return \Slim\Http\Request
     */
    public function request()
    {
        return $this->request;
    }

    /**
     * Get the Response object
     * @return \Slim\Http\Response
     */
    public function response()
    {
        return $this->response;
    }

    /**
     * Get the Router object
     * @return \Slim\Router
     */
    public function router()
    {
        return $this->router;
    }

    /**
     * Get and/or set the View
     *
     * This method declares the View to be used by the Slim application.
     * If the argument is a string, Slim will instantiate a new object
     * of the same class. If the argument is an instance of View or a subclass
     * of View, Slim will use the argument as the View.
     *
     * If a View already exists and this method is called to create a
     * new View, data already set in the existing View will be
     * transferred to the new View.
     *
     * @param  string|\Slim\View $viewClass The name or instance of a \Slim\View subclass
     * @return \Slim\View
     */
    public function view($viewClass = null)
    {
        if (!is_null($viewClass)) {
            $existingData = is_null($this->view) ? array() : $this->view->getData();
            if ($viewClass instanceOf \Slim\View) {
                $this->view = $viewClass;
            } else {
                $this->view = new $viewClass();
            }
            $this->view->appendData($existingData);
            $this->view->setTemplatesDirectory($this->config('templates.path'));
        }

        return $this->view;
    }

    /********************************************************************************
    * Rendering
    *******************************************************************************/

    /**
     * Render a template
     *
     * Call this method within a GET, POST, PUT, DELETE, NOT FOUND, or ERROR
     * callable to render a template whose output is appended to the
     * current HTTP response body. How the template is rendered is
     * delegated to the current View.
     *
     * @param  string $template The name of the template passed into the view's render() method
     * @param  array  $data     Associative array of data made available to the view
     * @param  int    $status   The HTTP response status code to use (optional)
     */
    public function render($template, $data = array(), $status = null)
    {
        if (!is_null($status)) {
            $this->response->status($status);
        }
        $this->view->setTemplatesDirectory($this->config('templates.path'));
        $this->view->appendData($data);
        $this->view->display($template);
    }

    /********************************************************************************
    * HTTP Caching
    *******************************************************************************/

    /**
     * Set Last-Modified HTTP Response Header
     *
     * Set the HTTP 'Last-Modified' header and stop if a conditional
     * GET request's `If-Modified-Since` header matches the last modified time
     * of the resource. The `time` argument is a UNIX timestamp integer value.
     * When the current request includes an 'If-Modified-Since' header that
     * matches the specified last modified time, the application will stop
     * and send a '304 Not Modified' response to the client.
     *
     * @param  int                       $time The last modified UNIX timestamp
     * @throws \InvalidArgumentException If provided timestamp is not an integer
     */
    public function lastModified($time)
    {
        if (is_integer($time)) {
            $this->response['Last-Modified'] = date(DATE_RFC1123, $time);
            if ($time === strtotime($this->request->headers('IF_MODIFIED_SINCE'))) {
                $this->halt(304);
            }
        } else {
            throw new \InvalidArgumentException('Slim::lastModified only accepts an integer UNIX timestamp value.');
        }
    }

    /**
     * Set ETag HTTP Response Header
     *
     * Set the etag header and stop if the conditional GET request matches.
     * The `value` argument is a unique identifier for the current resource.
     * The `type` argument indicates whether the etag should be used as a strong or
     * weak cache validator.
     *
     * When the current request includes an 'If-None-Match' header with
     * a matching etag, execution is immediately stopped. If the request
     * method is GET or HEAD, a '304 Not Modified' response is sent.
     *
     * @param  string                    $value The etag value
     * @param  string                    $type  The type of etag to create; either "strong" or "weak"
     * @throws \InvalidArgumentException If provided type is invalid
     */
    public function etag($value, $type = 'strong')
    {
        //Ensure type is correct
        if (!in_array($type, array('strong', 'weak'))) {
            throw new \InvalidArgumentException('Invalid Slim::etag type. Expected "strong" or "weak".');
        }

        //Set etag value
        $value = '"' . $value . '"';
        if ($type === 'weak') $value = 'W/'.$value;
        $this->response['ETag'] = $value;

        //Check conditional GET
        if ($etagsHeader = $this->request->headers('IF_NONE_MATCH')) {
            $etags = preg_split('@\s*,\s*@', $etagsHeader);
            if (in_array($value, $etags) || in_array('*', $etags)) {
                $this->halt(304);
            }
        }
    }

    /**
     * Set Expires HTTP response header
     *
     * The `Expires` header tells the HTTP client the time at which
     * the current resource should be considered stale. At that time the HTTP
     * client will send a conditional GET request to the server; the server
     * may return a 200 OK if the resource has changed, else a 304 Not Modified
     * if the resource has not changed. The `Expires` header should be used in
     * conjunction with the `etag()` or `lastModified()` methods above.
     *
     * @param string|int    $time   If string, a time to be parsed by `strtotime()`;
     *                              If int, a UNIX timestamp;
     */
    public function expires($time)
    {
        if (is_string($time)) {
            $time = strtotime($time);
        }
        $this->response['Expires'] = gmdate(DATE_RFC1123, $time);
    }

    /********************************************************************************
    * HTTP Cookies
    *******************************************************************************/

    /**
     * Set unencrypted HTTP cookie
     *
     * @param string     $name      The cookie name
     * @param string     $value     The cookie value
     * @param int|string $time      The duration of the cookie;
     *                                  If integer, should be UNIX timestamp;
     *                                  If string, converted to UNIX timestamp with `strtotime`;
     * @param string     $path      The path on the server in which the cookie will be available on
     * @param string     $domain    The domain that the cookie is available to
     * @param bool       $secure    Indicates that the cookie should only be transmitted over a secure
     *                              HTTPS connection to/from the client
     * @param bool       $httponly  When TRUE the cookie will be made accessible only through the HTTP protocol
     */
    public function setCookie($name, $value, $time = null, $path = null, $domain = null, $secure = null, $httponly = null)
    {
        $this->response->setCookie($name, array(
            'value' => $value,
            'expires' => is_null($time) ? $this->config('cookies.lifetime') : $time,
            'path' => is_null($path) ? $this->config('cookies.path') : $path,
            'domain' => is_null($domain) ? $this->config('cookies.domain') : $domain,
            'secure' => is_null($secure) ? $this->config('cookies.secure') : $secure,
            'httponly' => is_null($httponly) ? $this->config('cookies.httponly') : $httponly
        ));
    }

    /**
     * Get value of unencrypted HTTP cookie
     *
     * Return the value of a cookie from the current HTTP request,
     * or return NULL if cookie does not exist. Cookies created during
     * the current request will not be available until the next request.
     *
     * @param  string      $name
     * @return string|null
     */
    public function getCookie($name)
    {
        return $this->request->cookies($name);
    }

    /**
     * Set encrypted HTTP cookie
     *
     * @param string    $name       The cookie name
     * @param mixed     $value      The cookie value
     * @param mixed     $expires    The duration of the cookie;
     *                                  If integer, should be UNIX timestamp;
     *                                  If string, converted to UNIX timestamp with `strtotime`;
     * @param string    $path       The path on the server in which the cookie will be available on
     * @param string    $domain     The domain that the cookie is available to
     * @param bool      $secure     Indicates that the cookie should only be transmitted over a secure
     *                              HTTPS connection from the client
     * @param  bool     $httponly   When TRUE the cookie will be made accessible only through the HTTP protocol
     */
    public function setEncryptedCookie($name, $value, $expires = null, $path = null, $domain = null, $secure = null, $httponly = null)
    {
        $expires = is_null($expires) ? $this->config('cookies.lifetime') : $expires;
        if (is_string($expires)) {
            $expires = strtotime($expires);
        }
        $secureValue = \Slim\Http\Util::encodeSecureCookie(
            $value,
            $expires,
            $this->config('cookies.secret_key'),
            $this->config('cookies.cipher'),
            $this->config('cookies.cipher_mode')
        );
        $this->setCookie($name, $secureValue, $expires, $path, $domain, $secure, $httponly);
    }

    /**
     * Get value of encrypted HTTP cookie
     *
     * Return the value of an encrypted cookie from the current HTTP request,
     * or return NULL if cookie does not exist. Encrypted cookies created during
     * the current request will not be available until the next request.
     *
     * @param  string       $name
     * @return string|false
     */
    public function getEncryptedCookie($name, $deleteIfInvalid = true)
    {
        $value = \Slim\Http\Util::decodeSecureCookie(
            $this->request->cookies($name),
            $this->config('cookies.secret_key'),
            $this->config('cookies.cipher'),
            $this->config('cookies.cipher_mode')
        );
        if ($value === false && $deleteIfInvalid) {
            $this->deleteCookie($name);
        }

        return $value;
    }

    /**
     * Delete HTTP cookie (encrypted or unencrypted)
     *
     * Remove a Cookie from the client. This method will overwrite an existing Cookie
     * with a new, empty, auto-expiring Cookie. This method's arguments must match
     * the original Cookie's respective arguments for the original Cookie to be
     * removed. If any of this method's arguments are omitted or set to NULL, the
     * default Cookie setting values (set during Slim::init) will be used instead.
     *
     * @param string    $name       The cookie name
     * @param string    $path       The path on the server in which the cookie will be available on
     * @param string    $domain     The domain that the cookie is available to
     * @param bool      $secure     Indicates that the cookie should only be transmitted over a secure
     *                              HTTPS connection from the client
     * @param  bool     $httponly   When TRUE the cookie will be made accessible only through the HTTP protocol
     */
    public function deleteCookie($name, $path = null, $domain = null, $secure = null, $httponly = null)
    {
        $this->response->deleteCookie($name, array(
            'domain' => is_null($domain) ? $this->config('cookies.domain') : $domain,
            'path' => is_null($path) ? $this->config('cookies.path') : $path,
            'secure' => is_null($secure) ? $this->config('cookies.secure') : $secure,
            'httponly' => is_null($httponly) ? $this->config('cookies.httponly') : $httponly
        ));
    }

    /********************************************************************************
    * Helper Methods
    *******************************************************************************/

    /**
     * Get the absolute path to this Slim application's root directory
     *
     * This method returns the absolute path to the Slim application's
     * directory. If the Slim application is installed in a public-accessible
     * sub-directory, the sub-directory path will be included. This method
     * will always return an absolute path WITH a trailing slash.
     *
     * @return string
     */
    public function root()
    {
        return rtrim($_SERVER['DOCUMENT_ROOT'], '/') . rtrim($this->request->getRootUri(), '/') . '/';
    }

    /**
     * Clean current output buffer
     */
    protected function cleanBuffer()
    {
        if (ob_get_level() !== 0) {
            ob_clean();
        }
    }

    /**
     * Stop
     *
     * The thrown exception will be caught in application's `call()` method
     * and the response will be sent as is to the HTTP client.
     *
     * @throws \Slim\Exception\Stop
     */
    public function stop()
    {
        throw new \Slim\Exception\Stop();
    }

    /**
     * Halt
     *
     * Stop the application and immediately send the response with a
     * specific status and body to the HTTP client. This may send any
     * type of response: info, success, redirect, client error, or server error.
     * If you need to render a template AND customize the response status,
     * use the application's `render()` method instead.
     *
     * @param  int      $status     The HTTP response status
     * @param  string   $message    The HTTP response body
     */
    public function halt($status, $message = '')
    {
        $this->cleanBuffer();
        $this->response->status($status);
        $this->response->body($message);
        $this->stop();
    }

    /**
     * Pass
     *
     * The thrown exception is caught in the application's `call()` method causing
     * the router's current iteration to stop and continue to the subsequent route if available.
     * If no subsequent matching routes are found, a 404 response will be sent to the client.
     *
     * @throws \Slim\Exception\Pass
     */
    public function pass()
    {
        $this->cleanBuffer();
        throw new \Slim\Exception\Pass();
    }

    /**
     * Set the HTTP response Content-Type
     * @param  string   $type   The Content-Type for the Response (ie. text/html)
     */
    public function contentType($type)
    {
        $this->response['Content-Type'] = $type;
    }

    /**
     * Set the HTTP response status code
     * @param  int      $status     The HTTP response status code
     */
    public function status($code)
    {
        $this->response->status($code);
    }

    /**
     * Get the URL for a named route
     * @param  string               $name       The route name
     * @param  array                $params     Associative array of URL parameters and replacement values
     * @throws \RuntimeException    If named route does not exist
     * @return string
     */
    public function urlFor($name, $params = array())
    {
        return $this->request->getRootUri() . $this->router->urlFor($name, $params);
    }

    /**
     * Redirect
     *
     * This method immediately redirects to a new URL. By default,
     * this issues a 302 Found response; this is considered the default
     * generic redirect response. You may also specify another valid
     * 3xx status code if you want. This method will automatically set the
     * HTTP Location header for you using the URL parameter.
     *
     * @param  string   $url        The destination URL
     * @param  int      $status     The HTTP redirect status code (optional)
     */
    public function redirect($url, $status = 302)
    {
        $this->response->redirect($url, $status);
        $this->halt($status);
    }

    /********************************************************************************
    * Flash Messages
    *******************************************************************************/

    /**
     * Set flash message for subsequent request
     * @param  string   $key
     * @param  mixed    $value
     */
    public function flash($key, $value)
    {
        if (isset($this->environment['slim.flash'])) {
            $this->environment['slim.flash']->set($key, $value);
        }
    }

    /**
     * Set flash message for current request
     * @param  string   $key
     * @param  mixed    $value
     */
    public function flashNow($key, $value)
    {
        if (isset($this->environment['slim.flash'])) {
            $this->environment['slim.flash']->now($key, $value);
        }
    }

    /**
     * Keep flash messages from previous request for subsequent request
     */
    public function flashKeep()
    {
        if (isset($this->environment['slim.flash'])) {
            $this->environment['slim.flash']->keep();
        }
    }

    /********************************************************************************
    * Hooks
    *******************************************************************************/

    /**
     * Assign hook
     * @param  string   $name       The hook name
     * @param  mixed    $callable   A callable object
     * @param  int      $priority   The hook priority; 0 = high, 10 = low
     */
    public function hook($name, $callable, $priority = 10)
    {
        if (!isset($this->hooks[$name])) {
            $this->hooks[$name] = array(array());
        }
        if (is_callable($callable)) {
            $this->hooks[$name][(int) $priority][] = $callable;
        }
    }

    /**
     * Invoke hook
     * @param  string   $name       The hook name
     * @param  mixed    $hookArgs   (Optional) Argument for hooked functions
     */
    public function applyHook($name, $hookArg = null)
    {
        if (!isset($this->hooks[$name])) {
            $this->hooks[$name] = array(array());
        }
        if (!empty($this->hooks[$name])) {
            // Sort by priority, low to high, if there's more than one priority
            if (count($this->hooks[$name]) > 1) {
                ksort($this->hooks[$name]);
            }
            foreach ($this->hooks[$name] as $priority) {
                if (!empty($priority)) {
                    foreach ($priority as $callable) {
                        call_user_func($callable, $hookArg);
                    }
                }
            }
        }
    }

    /**
     * Get hook listeners
     *
     * Return an array of registered hooks. If `$name` is a valid
     * hook name, only the listeners attached to that hook are returned.
     * Else, all listeners are returned as an associative array whose
     * keys are hook names and whose values are arrays of listeners.
     *
     * @param  string     $name     A hook name (Optional)
     * @return array|null
     */
    public function getHooks($name = null)
    {
        if (!is_null($name)) {
            return isset($this->hooks[(string) $name]) ? $this->hooks[(string) $name] : null;
        } else {
            return $this->hooks;
        }
    }

    /**
     * Clear hook listeners
     *
     * Clear all listeners for all hooks. If `$name` is
     * a valid hook name, only the listeners attached
     * to that hook will be cleared.
     *
     * @param  string   $name   A hook name (Optional)
     */
    public function clearHooks($name = null)
    {
        if (!is_null($name) && isset($this->hooks[(string) $name])) {
            $this->hooks[(string) $name] = array(array());
        } else {
            foreach ($this->hooks as $key => $value) {
                $this->hooks[$key] = array(array());
            }
        }
    }

    /********************************************************************************
    * Middleware
    *******************************************************************************/

    /**
     * Add middleware
     *
     * This method prepends new middleware to the application middleware stack.
     * The argument must be an instance that subclasses Slim_Middleware.
     *
     * @param \Slim\Middleware
     */
    public function add(\Slim\Middleware $newMiddleware)
    {
        $newMiddleware->setApplication($this);
        $newMiddleware->setNextMiddleware($this->middleware[0]);
        array_unshift($this->middleware, $newMiddleware);
    }

    /********************************************************************************
    * Runner
    *******************************************************************************/

    /**
     * Run
     *
     * This method invokes the middleware stack, including the core Slim application;
     * the result is an array of HTTP status, header, and body. These three items
     * are returned to the HTTP client.
     */
    public function run()
    {
        set_error_handler(array('\Slim\Slim', 'handleErrors'));

        //Apply final outer middleware layers
        $this->add(new \Slim\Middleware\PrettyExceptions());

        //Invoke middleware and application stack
        $this->middleware[0]->call();

        //Fetch status, header, and body
        list($status, $header, $body) = $this->response->finalize();

        //Send headers
        if (headers_sent() === false) {
            //Send status
            if (strpos(PHP_SAPI, 'cgi') === 0) {
                header(sprintf('Status: %s', \Slim\Http\Response::getMessageForCode($status)));
            } else {
                header(sprintf('HTTP/%s %s', $this->config('http.version'), \Slim\Http\Response::getMessageForCode($status)));
            }

            //Send headers
            foreach ($header as $name => $value) {
                $hValues = explode("\n", $value);
                foreach ($hValues as $hVal) {
                    header("$name: $hVal", false);
                }
            }
        }

        //Send body
        echo $body;

        restore_error_handler();
    }

    /**
     * Call
     *
     * This method finds and iterates all route objects that match the current request URI.
     */
    public function call()
    {
        try {
            if (isset($this->environment['slim.flash'])) {
                $this->view()->setData('flash', $this->environment['slim.flash']);
            }
            $this->applyHook('slim.before');
            ob_start();
            $this->applyHook('slim.before.router');
            $dispatched = false;
            $matchedRoutes = $this->router->getMatchedRoutes($this->request->getMethod(), $this->request->getResourceUri());
            foreach ($matchedRoutes as $route) {
                try {
                    $this->applyHook('slim.before.dispatch');
                    $dispatched = $this->router->dispatch($route);
                    $this->applyHook('slim.after.dispatch');
                    if ($dispatched) {
                        break;
                    }
                } catch (\Slim\Exception\Pass $e) {
                    continue;
                }
            }
            if (!$dispatched) {
               $this->notFound();
            }
            $this->applyHook('slim.after.router');
            $this->stop();
        } catch (\Slim\Exception\Stop $e) {
            $this->response()->write(ob_get_clean());
            $this->applyHook('slim.after');
        } catch (\Exception $e) {
            if ($this->config('debug')) {
                throw $e;
            } else {
                try {
                    $this->error($e);
                } catch (\Slim\Exception\Stop $e) {
                    // Do nothing
                }
            }
        }
    }

    /********************************************************************************
    * Error Handling and Debugging
    *******************************************************************************/

    /**
     * Convert errors into ErrorException objects
     *
     * This method catches PHP errors and converts them into \ErrorException objects;
     * these \ErrorException objects are then thrown and caught by Slim's
     * built-in or custom error handlers.
     *
     * @param  int            $errno   The numeric type of the Error
     * @param  string         $errstr  The error message
     * @param  string         $errfile The absolute path to the affected file
     * @param  int            $errline The line number of the error in the affected file
     * @return true
     * @throws \ErrorException
     */
    public static function handleErrors($errno, $errstr = '', $errfile = '', $errline = '')
    {
        if (error_reporting() & $errno) {
            throw new \ErrorException($errstr, $errno, 0, $errfile, $errline);
        }

        return true;
    }

    /**
     * Generate diagnostic template markup
     *
     * This method accepts a title and body content to generate an HTML document layout.
     *
     * @param  string   $title  The title of the HTML template
     * @param  string   $body   The body content of the HTML template
     * @return string
     */
    protected static function generateTemplateMarkup($title, $body)
    {
        return sprintf("<html><head><title>%s</title><style>body{margin:0;padding:30px;font:12px/1.5 Helvetica,Arial,Verdana,sans-serif;}h1{margin:0;font-size:48px;font-weight:normal;line-height:48px;}strong{display:inline-block;width:65px;}</style></head><body><h1>%s</h1>%s</body></html>", $title, $title, $body);
    }

    /**
     * Default Not Found handler
     */
    protected function defaultNotFound()
    {
        echo static::generateTemplateMarkup('404 Page Not Found', '<p>The page you are looking for could not be found. Check the address bar to ensure your URL is spelled correctly. If all else fails, you can visit our home page at the link below.</p><a href="' . $this->request->getRootUri() . '/">Visit the Home Page</a>');
    }

    /**
     * Default Error handler
     */
    protected function defaultError($e)
    {
        $this->getLog()->error($e);
        echo self::generateTemplateMarkup('Error', '<p>A website error has occured. The website administrator has been notified of the issue. Sorry for the temporary inconvenience.</p>');
    }
}
