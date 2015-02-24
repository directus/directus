<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.2.0
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

/**
 * We use a mock application, instead of a Slim application.
 * so that we may easily test the Method Override middleware
 * in isolation.
 */
class CustomAppMethod
{
    protected $environment;

    public function __construct()
    {
        $this->environment = \Slim\Environment::getInstance();
    }

    public function &environment() {
        return $this->environment;
    }

    public function call()
    {
        //Do nothing
    }
}

class MethodOverrideTest extends PHPUnit_Framework_TestCase
{
    /**
     * Test overrides method as POST
     */
    public function testOverrideMethodAsPost()
    {
        \Slim\Environment::mock(array(
            'REQUEST_METHOD' => 'POST',
            'CONTENT_TYPE' => 'application/x-www-form-urlencoded',
            'CONENT_LENGTH' => 11,
            'slim.input' => '_METHOD=PUT'
        ));
        $app = new CustomAppMethod();
        $mw = new \Slim\Middleware\MethodOverride();
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        $env =& $app->environment();
        $this->assertEquals('PUT', $env['REQUEST_METHOD']);
        $this->assertTrue(isset($env['slim.method_override.original_method']));
        $this->assertEquals('POST', $env['slim.method_override.original_method']);
    }

    /**
     * Test does not override method if not POST
     */
    public function testDoesNotOverrideMethodIfNotPost()
    {
        \Slim\Environment::mock(array(
            'REQUEST_METHOD' => 'GET',
            'slim.input' => ''
        ));
        $app = new CustomAppMethod();
        $mw = new \Slim\Middleware\MethodOverride();
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        $env =& $app->environment();
        $this->assertEquals('GET', $env['REQUEST_METHOD']);
        $this->assertFalse(isset($env['slim.method_override.original_method']));
    }

    /**
     * Test does not override method if no method ovveride parameter
     */
    public function testDoesNotOverrideMethodAsPostWithoutParameter()
    {
        \Slim\Environment::mock(array(
            'REQUEST_METHOD' => 'POST',
            'REMOTE_ADDR' => '127.0.0.1',
            'SCRIPT_NAME' => '/foo/index.php', //<-- Physical
            'PATH_INFO' => '/bar', //<-- Virtual
            'QUERY_STRING' => 'foo=bar',
            'SERVER_NAME' => 'slim',
            'SERVER_PORT' => 80,
            'slim.url_scheme' => 'http',
            'slim.input' => '',
            'slim.errors' => fopen('php://stderr', 'w')
        ));
        $app = new CustomAppMethod();
        $mw = new \Slim\Middleware\MethodOverride();
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        $env =& $app->environment();
        $this->assertEquals('POST', $env['REQUEST_METHOD']);
        $this->assertFalse(isset($env['slim.method_override.original_method']));
    }

    /**
     * Test overrides method with X-Http-Method-Override header
     */
    public function testOverrideMethodAsHeader()
    {
        \Slim\Environment::mock(array(
            'REQUEST_METHOD' => 'POST',
            'CONTENT_TYPE' => 'application/json',
            'CONENT_LENGTH' => 0,
            'slim.input' => '',
            'X_HTTP_METHOD_OVERRIDE' => 'DELETE'
        ));
        $app = new CustomAppMethod();
        $mw = new \Slim\Middleware\MethodOverride();
        $mw->setApplication($app);
        $mw->setNextMiddleware($app);
        $mw->call();
        $env =& $app->environment();
        $this->assertEquals('DELETE', $env['REQUEST_METHOD']);
        $this->assertTrue(isset($env['slim.method_override.original_method']));
        $this->assertEquals('POST', $env['slim.method_override.original_method']);
    }
}
