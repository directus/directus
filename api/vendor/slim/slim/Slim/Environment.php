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

/**
 * Environment
 *
 * This class creates and returns a key/value array of common
 * environment variables for the current HTTP request.
 *
 * This is a singleton class; derived environment variables will
 * be common across multiple Slim applications.
 *
 * This class matches the Rack (Ruby) specification as closely
 * as possible. More information available below.
 *
 * @package Slim
 * @author  Josh Lockhart
 * @since   1.6.0
 */
class Environment implements \ArrayAccess, \IteratorAggregate
{
    /**
     * @var array
     */
    protected $properties;

    /**
     * @var \Slim\Environment
     */
    protected static $environment;

    /**
     * Get environment instance (singleton)
     *
     * This creates and/or returns an environment instance (singleton)
     * derived from $_SERVER variables. You may override the global server
     * variables by using `\Slim\Environment::mock()` instead.
     *
     * @param  bool             $refresh Refresh properties using global server variables?
     * @return \Slim\Environment
     */
    public static function getInstance($refresh = false)
    {
        if (is_null(self::$environment) || $refresh) {
            self::$environment = new self();
        }

        return self::$environment;
    }

    /**
     * Get mock environment instance
     *
     * @param  array       $userSettings
     * @return \Slim\Environment
     */
    public static function mock($userSettings = array())
    {
        self::$environment = new self(array_merge(array(
            'REQUEST_METHOD' => 'GET',
            'SCRIPT_NAME' => '',
            'PATH_INFO' => '',
            'QUERY_STRING' => '',
            'SERVER_NAME' => 'localhost',
            'SERVER_PORT' => 80,
            'ACCEPT' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'ACCEPT_LANGUAGE' => 'en-US,en;q=0.8',
            'ACCEPT_CHARSET' => 'ISO-8859-1,utf-8;q=0.7,*;q=0.3',
            'USER_AGENT' => 'Slim Framework',
            'REMOTE_ADDR' => '127.0.0.1',
            'slim.url_scheme' => 'http',
            'slim.input' => '',
            'slim.errors' => @fopen('php://stderr', 'w')
        ), $userSettings));

        return self::$environment;
    }

    /**
     * Constructor (private access)
     *
     * @param  array|null $settings If present, these are used instead of global server variables
     */
    private function __construct($settings = null)
    {
        if ($settings) {
            $this->properties = $settings;
        } else {
            $env = array();

            //The HTTP request method
            $env['REQUEST_METHOD'] = $_SERVER['REQUEST_METHOD'];

            //The IP
            $env['REMOTE_ADDR'] = $_SERVER['REMOTE_ADDR'];

            /**
             * Application paths
             *
             * This derives two paths: SCRIPT_NAME and PATH_INFO. The SCRIPT_NAME
             * is the real, physical path to the application, be it in the root
             * directory or a subdirectory of the public document root. The PATH_INFO is the
             * virtual path to the requested resource within the application context.
             *
             * With htaccess, the SCRIPT_NAME will be an absolute path (without file name);
             * if not using htaccess, it will also include the file name. If it is "/",
             * it is set to an empty string (since it cannot have a trailing slash).
             *
             * The PATH_INFO will be an absolute path with a leading slash; this will be
             * used for application routing.
             */
            if (strpos($_SERVER['REQUEST_URI'], $_SERVER['SCRIPT_NAME']) === 0) {
                $env['SCRIPT_NAME'] = $_SERVER['SCRIPT_NAME']; //Without URL rewrite
            } else {
                $env['SCRIPT_NAME'] = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']) ); //With URL rewrite
            }
            $env['PATH_INFO'] = substr_replace($_SERVER['REQUEST_URI'], '', 0, strlen($env['SCRIPT_NAME']));
            if (strpos($env['PATH_INFO'], '?') !== false) {
                $env['PATH_INFO'] = substr_replace($env['PATH_INFO'], '', strpos($env['PATH_INFO'], '?')); //query string is not removed automatically
            }
            $env['SCRIPT_NAME'] = rtrim($env['SCRIPT_NAME'], '/');
            $env['PATH_INFO'] = '/' . ltrim($env['PATH_INFO'], '/');

            //The portion of the request URI following the '?'
            $env['QUERY_STRING'] = isset($_SERVER['QUERY_STRING']) ? $_SERVER['QUERY_STRING'] : '';

            //Name of server host that is running the script
            $env['SERVER_NAME'] = $_SERVER['SERVER_NAME'];

            //Number of server port that is running the script
            $env['SERVER_PORT'] = $_SERVER['SERVER_PORT'];

            //HTTP request headers
            $specialHeaders = array('CONTENT_TYPE', 'CONTENT_LENGTH', 'PHP_AUTH_USER', 'PHP_AUTH_PW', 'PHP_AUTH_DIGEST', 'AUTH_TYPE');
            foreach ($_SERVER as $key => $value) {
                $value = is_string($value) ? trim($value) : $value;
                if (strpos($key, 'HTTP_') === 0) {
                    $env[substr($key, 5)] = $value;
                } elseif (strpos($key, 'X_') === 0 || in_array($key, $specialHeaders)) {
                    $env[$key] = $value;
                }
            }

            //Is the application running under HTTPS or HTTP protocol?
            $env['slim.url_scheme'] = empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off' ? 'http' : 'https';

            //Input stream (readable one time only; not available for mutipart/form-data requests)
            $rawInput = @file_get_contents('php://input');
            if (!$rawInput) {
                $rawInput = '';
            }
            $env['slim.input'] = $rawInput;

            //Error stream
            $env['slim.errors'] = fopen('php://stderr', 'w');

            $this->properties = $env;
        }
    }

    /**
     * Array Access: Offset Exists
     */
    public function offsetExists($offset)
    {
        return isset($this->properties[$offset]);
    }

    /**
     * Array Access: Offset Get
     */
    public function offsetGet($offset)
    {
        if (isset($this->properties[$offset])) {
            return $this->properties[$offset];
        } else {
            return null;
        }
    }

    /**
     * Array Access: Offset Set
     */
    public function offsetSet($offset, $value)
    {
        $this->properties[$offset] = $value;
    }

    /**
     * Array Access: Offset Unset
     */
    public function offsetUnset($offset)
    {
        unset($this->properties[$offset]);
    }

    /**
     * IteratorAggregate
     *
     * @return \ArrayIterator
     */
    public function getIterator()
    {
        return new \ArrayIterator($this->properties);
    }
}
