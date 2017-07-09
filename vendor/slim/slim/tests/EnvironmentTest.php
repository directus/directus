<?php
/**
 * Slim - a micro PHP 5 framework
 *
 * @author      Josh Lockhart <info@slimframework.com>
 * @copyright   2011 Josh Lockhart
 * @link        http://www.slimframework.com
 * @license     http://www.slimframework.com/license
 * @version     2.6.1
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

class EnvironmentTest extends PHPUnit_Framework_TestCase
{
    /**
     * Default server settings assume the Slim app is installed
     * in a subdirectory `foo/` directly beneath the public document
     * root directory; URL rewrite is disabled; requested app
     * resource is GET `/bar/xyz` with three query params.
     *
     * These only provide a common baseline for the following
     * tests; tests are free to override these values.
     */
    public function setUp()
    {
        $_SERVER['DOCUMENT_ROOT'] = '/var/www';
        $_SERVER['SCRIPT_FILENAME'] = '/var/www/foo/index.php';
        $_SERVER['SERVER_NAME'] = 'slim';
        $_SERVER['SERVER_PORT'] = '80';
        $_SERVER['SCRIPT_NAME'] = '/foo/index.php';
        $_SERVER['REQUEST_URI'] = '/foo/index.php/bar/xyz';
        $_SERVER['PATH_INFO'] = '/bar/xyz';
        $_SERVER['REQUEST_METHOD'] = 'GET';
        $_SERVER['QUERY_STRING'] = 'one=1&two=2&three=3';
        $_SERVER['HTTPS'] = '';
        $_SERVER['REMOTE_ADDR'] = '127.0.0.1';
        unset($_SERVER['CONTENT_TYPE'], $_SERVER['CONTENT_LENGTH']);
    }

    /**
     * Test mock environment
     *
     * This should return the custom values where specified
     * and the default values otherwise.
     */
    public function testMockEnvironment()
    {
        $env = \Slim\Environment::mock(array(
            'REQUEST_METHOD' => 'PUT'
        ));
        $env2 = \Slim\Environment::getInstance();
        $this->assertSame($env, $env2);
        $this->assertInstanceOf('\Slim\Environment', $env);
        $this->assertEquals('PUT', $env['REQUEST_METHOD']);
        $this->assertEquals(80, $env['SERVER_PORT']);
        $this->assertNull($env['foo']);
    }

    /**
     * Test sets HTTP method
     */
    public function testSetsHttpMethod()
    {
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('GET', $env['REQUEST_METHOD']);
    }

    /**
     * Test parses script name and path info
     *
     * Pre-conditions:
     * URL Rewrite is disabled;
     * App installed in subdirectory;
     */
    public function testParsesPathsWithoutUrlRewriteInSubdirectory()
    {
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/bar/xyz', $env['PATH_INFO']);
        $this->assertEquals('/foo/index.php', $env['SCRIPT_NAME']);
    }

    /**
     * Test parses script name and path info
     *
     * Pre-conditions:
     * URL Rewrite is disabled;
     * App installed in root directory;
     */
    public function testParsesPathsWithoutUrlRewriteInRootDirectory()
    {
        $_SERVER['SCRIPT_FILENAME'] = '/var/www/index.php';
        $_SERVER['REQUEST_URI'] = '/index.php/bar/xyz';
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/bar/xyz', $env['PATH_INFO']);
        $this->assertEquals('/index.php', $env['SCRIPT_NAME']);
    }

    /**
     * Test parses script name and path info
     *
     * Pre-conditions:
     * URL Rewrite disabled;
     * App installed in root directory;
     * Requested resource is "/";
     */
    public function testParsesPathsWithoutUrlRewriteInRootDirectoryForAppRootUri()
    {
        $_SERVER['SCRIPT_FILENAME'] = '/var/www/index.php';
        $_SERVER['REQUEST_URI'] = '/index.php';
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        unset($_SERVER['PATH_INFO']);
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/', $env['PATH_INFO']);
        $this->assertEquals('/index.php', $env['SCRIPT_NAME']);
    }

    /**
     * Test parses script name and path info
     *
     * Pre-conditions:
     * URL Rewrite enabled;
     * App installed in subdirectory;
     */
    public function testParsesPathsWithUrlRewriteInSubdirectory()
    {
        $_SERVER['SCRIPT_NAME'] = '/foo/index.php';
        $_SERVER['REQUEST_URI'] = '/foo/bar/xyz';
        unset($_SERVER['PATH_INFO']);
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/bar/xyz', $env['PATH_INFO']);
        $this->assertEquals('/foo', $env['SCRIPT_NAME']);
    }

    /**
     * Test parses script name and path info
     *
     * Pre-conditions:
     * URL Rewrite enabled;
     * App installed in root directory;
     */
    public function testParsesPathsWithUrlRewriteInRootDirectory()
    {
        $_SERVER['SCRIPT_FILENAME'] = '/var/www/index.php';
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        $_SERVER['REQUEST_URI'] = '/bar/xyz';
        unset($_SERVER['PATH_INFO']);
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/bar/xyz', $env['PATH_INFO']);
        $this->assertEquals('', $env['SCRIPT_NAME']);
    }

    /**
     * Test parses script name and path info
     *
     * Pre-conditions:
     * URL Rewrite enabled;
     * App installed in root directory;
     * Requested resource is "/"
     */
    public function testParsesPathsWithUrlRewriteInRootDirectoryForAppRootUri()
    {
        $_SERVER['SCRIPT_FILENAME'] = '/var/www/index.php';
        $_SERVER['REQUEST_URI'] = '/';
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        unset($_SERVER['PATH_INFO']);
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/', $env['PATH_INFO']);
        $this->assertEquals('', $env['SCRIPT_NAME']);
    }

    /**
     * Test parses query string
     *
     * Pre-conditions:
     * $_SERVER['QUERY_STRING'] exists and is not empty;
     */
    public function testParsesQueryString()
    {
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('one=1&two=2&three=3', $env['QUERY_STRING']);
    }

    /**
     * Test removes query string from PATH_INFO when using URL Rewrite
     *
     * Pre-conditions:
     * $_SERVER['QUERY_STRING'] exists and is not empty;
     * URL Rewrite enabled;
     */
    public function testRemovesQueryStringFromPathInfo()
    {
        $_SERVER['SCRIPT_NAME'] = '/foo/index.php';
        $_SERVER['REQUEST_URI'] = '/foo/bar/xyz?one=1&two=2&three=3';
        unset($_SERVER['PATH_INFO']);
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/bar/xyz', $env['PATH_INFO']);
    }

    /**
     * Test environment's PATH_INFO retains URL encoded characters (e.g. #)
     *
     * In earlier version, \Slim\Environment would use PATH_INFO instead
     * of REQUEST_URI to determine the root URI and resource URI.
     * Unfortunately, the server would URL decode the PATH_INFO string
     * before it was handed to PHP. This prevented certain URL-encoded
     * characters like the octothorpe from being delivered correctly to
     * the Slim application environment. This test ensures the
     * REQUEST_URI is used instead and parsed as expected.
     */
    public function testPathInfoRetainsUrlEncodedCharacters()
    {
        $_SERVER['SCRIPT_FILENAME'] = '/var/www/index.php';
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        $_SERVER['REQUEST_URI'] = '/foo/%23bar'; //<-- URL-encoded "#bar"
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('/foo/%23bar', $env['PATH_INFO']);
    }

    /**
     * Test parses query string
     *
     * Pre-conditions:
     * $_SERVER['QUERY_STRING'] does not exist;
     */
    public function testParsesQueryStringThatDoesNotExist()
    {
        unset($_SERVER['QUERY_STRING']);
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('', $env['QUERY_STRING']);
    }

    /**
     * Test SERVER_NAME is not empty
     */
    public function testServerNameIsNotEmpty()
    {
        $env = \Slim\Environment::getInstance(true);
        $this->assertFalse(empty($env['SERVER_NAME']));
    }

    /**
     * Test SERVER_PORT is not empty
     */
    public function testServerPortIsNotEmpty()
    {
        $env = \Slim\Environment::getInstance(true);
        $this->assertFalse(empty($env['SERVER_PORT']));
    }

    /**
     * Test unsets HTTP_CONTENT_TYPE and HTTP_CONTENT_LENGTH
     *
     * Pre-conditions:
     * HTTP_CONTENT_TYPE is sent with HTTP request;
     * HTTP_CONTENT_LENGTH is sent with HTTP request;
     */
    public function testUnsetsContentTypeAndContentLength()
    {
        $_SERVER['HTTP_CONTENT_LENGTH'] = 150;
        $env = \Slim\Environment::getInstance(true);
        $this->assertFalse(isset($env['HTTP_CONTENT_LENGTH']));
    }

    /**
     * Test sets special request headers if not empty
     *
     * Pre-conditions:
     * CONTENT_TYPE, CONTENT_LENGTH, X_REQUESTED_WITH are sent in client HTTP request;
     * CONTENT_TYPE, CONTENT_LENGTH, X_REQUESTED_WITH are not empty;
     */
    public function testSetsSpecialHeaders()
    {
        $_SERVER['CONTENT_TYPE'] = 'text/csv';
        $_SERVER['CONTENT_LENGTH'] = '100';
        $_SERVER['HTTP_X_REQUESTED_WITH'] = 'XmlHttpRequest';
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('text/csv', $env['CONTENT_TYPE']);
        $this->assertEquals('100', $env['CONTENT_LENGTH']);
        $this->assertEquals('XmlHttpRequest', $env['HTTP_X_REQUESTED_WITH']);
    }

    /**
     * Tests X-HTTP-Method-Override is allowed through unmolested.
     *
     * Pre-conditions:
     * X_HTTP_METHOD_OVERRIDE is sent in client HTTP request;
     * X_HTTP_METHOD_OVERRIDE is not empty;
     */
    public function testSetsHttpMethodOverrideHeader() {
        $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] = 'DELETE';
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('DELETE', $env['HTTP_X_HTTP_METHOD_OVERRIDE']);
    }

    /**
     * Test detects HTTPS
     *
     * Pre-conditions:
     * $_SERVER['HTTPS'] is set to a non-empty value;
     */
    public function testHttps()
    {
        $_SERVER['HTTPS'] = 1;
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('https', $env['slim.url_scheme']);
    }

    /**
     * Test detects not HTTPS
     *
     * Pre-conditions:
     * $_SERVER['HTTPS'] is set to an empty value;
     */
    public function testNotHttps()
    {
        $_SERVER['HTTPS'] = '';
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('http', $env['slim.url_scheme']);
    }

    /**
     * Test detects not HTTPS on IIS
     *
     * Pre-conditions:
     * $_SERVER['HTTPS'] is set to "off";
     */
    public function testNotHttpsIIS()
    {
        $_SERVER['HTTPS'] = 'off';
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('http', $env['slim.url_scheme']);
    }

    /**
     * Test input is an empty string (and not false)
     *
     * Pre-conditions:
     * Input at php://input may only be read once; subsequent attempts
     * will return `false`; in which case, use an empty string.
     */
    public function testInputIsEmptyString()
    {
        $env = \Slim\Environment::getInstance(true);
        $this->assertEquals('', $env['slim.input']);
    }

    /**
     * Test valid resource handle to php://stdErr
     */
    public function testErrorResource()
    {
        $env = \Slim\Environment::getInstance(true);
        $this->assertTrue(is_resource($env['slim.errors']));
    }
}
