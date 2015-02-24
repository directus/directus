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

// Used for passing callable via string
function testCallable() {}

class RouteTest extends PHPUnit_Framework_TestCase
{
    /**
     * Route should set name
     */
    public function testRouteSetsName()
    {
        $route = new \Slim\Route('/foo/bar', function () {});
        $route->name('foo');
        $this->assertEquals('foo', $route->getName());
    }

    /**
     * Route should set pattern
     */
    public function testRouteSetsPattern()
    {
        $route1 = new \Slim\Route('/foo/bar', function () {});
        $this->assertEquals('/foo/bar', $route1->getPattern());
    }

    /**
     * Route sets pattern with params
     */
    public function testRouteSetsPatternWithParams()
    {
        $route = new \Slim\Route('/hello/:first/:last', function () {});
        $this->assertEquals('/hello/:first/:last', $route->getPattern());
    }

    /**
     * Route sets custom pattern that overrides pattern
     */
    public function testRouteSetsCustomTemplate()
    {
        $route = new \Slim\Route('/hello/*', function () {});
        $route->setPattern('/hello/:name');
        $this->assertEquals('/hello/:name', $route->getPattern());
    }

    /**
     * Route should store a reference to the callable
     * anonymous function.
     */
    public function testRouteSetsCallableAsFunction()
    {
        $callable = function () { echo "Foo!"; };
        $route = new \Slim\Route('/foo/bar', $callable);
        $this->assertSame($callable, $route->getCallable());
    }

    /**
     * Route should store a reference to the callable
     * regular function (for PHP 5 < 5.3)
     */
    public function testRouteSetsCallableAsString()
    {
        $route = new \Slim\Route('/foo/bar', 'testCallable');
        $this->assertEquals('testCallable', $route->getCallable());
    }

    /**
     * Route should throw exception when creating with an invalid callable
     */
    public function testRouteThrowsExecptionWithInvalidCallable()
    {
        $this->setExpectedException('InvalidArgumentException');
        $route = new \Slim\Route('/foo/bar', 'fnDoesNotExist');
    }

    /**
     * Route should throw exception when setting an invalid callable
     */
    public function testRouteThrowsExecptionWhenSettingInvalidCallable()
    {
        $route = new \Slim\Route('/foo/bar', function () {});
        try
        {
            $route->setCallable('fnDoesNotExist');
            $this->fail('Did not catch InvalidArgumentException when setting invalid callable');
        } catch(\InvalidArgumentException $e) {}
    }

    /**
     * Test gets all params
     */
    public function testGetRouteParams()
    {
        // Prepare route
        $requestUri = '/hello/mr/anderson';
        $route = new \Slim\Route('/hello/:first/:last', function () {});

        // Parse route params
        $this->assertTrue($route->matches($requestUri));

        // Get params
        $params = $route->getParams();
        $this->assertEquals(2, count($params));
        $this->assertEquals('mr', $params['first']);
        $this->assertEquals('anderson', $params['last']);
    }

    /**
     * Test sets all params
     */
    public function testSetRouteParams()
    {
        // Prepare route
        $requestUri = '/hello/mr/anderson';
        $route = new \Slim\Route('/hello/:first/:last', function () {});

        // Parse route params
        $this->assertTrue($route->matches($requestUri));

        // Get params
        $params = $route->getParams();
        $this->assertEquals(2, count($params));
        $this->assertEquals('mr', $params['first']);
        $this->assertEquals('anderson', $params['last']);

        // Replace params
        $route->setParams(array(
            'first' => 'john',
            'last' => 'smith'
        ));

        // Get new params
        $params = $route->getParams();
        $this->assertEquals(2, count($params));
        $this->assertEquals('john', $params['first']);
        $this->assertEquals('smith', $params['last']);
    }

    /**
     * Test gets param when exists
     */
    public function testGetRouteParamWhenExists()
    {
        // Prepare route
        $requestUri = '/hello/mr/anderson';
        $route = new \Slim\Route('/hello/:first/:last', function () {});

        // Parse route params
        $this->assertTrue($route->matches($requestUri));

        // Get param
        $this->assertEquals('anderson', $route->getParam('last'));
    }

    /**
     * Test gets param when not exists
     */
    public function testGetRouteParamWhenNotExists()
    {
        // Prepare route
        $requestUri = '/hello/mr/anderson';
        $route = new \Slim\Route('/hello/:first/:last', function () {});

        // Parse route params
        $this->assertTrue($route->matches($requestUri));

        // Get param
        try {
            $param = $route->getParam('foo');
            $this->fail('Did not catch expected InvalidArgumentException');
        } catch ( \InvalidArgumentException $e ) {}
    }

    /**
     * Test sets param when exists
     */
    public function testSetRouteParamWhenExists()
    {
        // Prepare route
        $requestUri = '/hello/mr/anderson';
        $route = new \Slim\Route('/hello/:first/:last', function () {});

        // Parse route params
        $this->assertTrue($route->matches($requestUri));

        // Get param
        $this->assertEquals('anderson', $route->getParam('last'));

        // Set param
        $route->setParam('last', 'smith');

        // Get new param
        $this->assertEquals('smith', $route->getParam('last'));
    }

    /**
     * Test sets param when not exists
     */
    public function testSetRouteParamWhenNotExists()
    {
        // Prepare route
        $requestUri = '/hello/mr/anderson';
        $route = new \Slim\Route('/hello/:first/:last', function () {});

        // Parse route params
        $this->assertTrue($route->matches($requestUri));

        // Get param
        try {
            $param = $route->setParam('foo', 'bar');
            $this->fail('Did not catch expected InvalidArgumentException');
        } catch ( \InvalidArgumentException $e ) {}
    }

    /**
     * If route matches a resource URI, param should be extracted.
     */
    public function testRouteMatchesAndParamExtracted()
    {
        $resource = '/hello/Josh';
        $route = new \Slim\Route('/hello/:name', function () {});
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('name' => 'Josh'), $route->getParams());
    }

    /**
     * If route matches a resource URI, multiple params should be extracted.
     */
    public function testRouteMatchesAndMultipleParamsExtracted()
    {
        $resource = '/hello/Josh/and/John';
        $route = new \Slim\Route('/hello/:first/and/:second', function () {});
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('first' => 'Josh', 'second' => 'John'), $route->getParams());
    }

    /**
     * If route does not match a resource URI, params remain an empty array
     */
    public function testRouteDoesNotMatchAndParamsNotExtracted()
    {
        $resource = '/foo/bar';
        $route = new \Slim\Route('/hello/:name', function () {});
        $result = $route->matches($resource);
        $this->assertFalse($result);
        $this->assertEquals(array(), $route->getParams());
    }

    /**
     * Route matches URI with trailing slash
     *
     */
    public function testRouteMatchesWithTrailingSlash()
    {
        $resource1 = '/foo/bar/';
        $resource2 = '/foo/bar';
        $route = new \Slim\Route('/foo/:one/', function () {});
        $this->assertTrue($route->matches($resource1));
        $this->assertTrue($route->matches($resource2));
    }

    /**
     * Route matches URI with conditions
     */
    public function testRouteMatchesResourceWithConditions()
    {
        $resource = '/hello/Josh/and/John';
        $route = new \Slim\Route('/hello/:first/and/:second', function () {});
        $route->conditions(array('first' => '[a-zA-Z]{3,}'));
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('first' => 'Josh', 'second' => 'John'), $route->getParams());
    }

    /**
     * Route does not match URI with conditions
     */
    public function testRouteDoesNotMatchResourceWithConditions()
    {
        $resource = '/hello/Josh/and/John';
        $route = new \Slim\Route('/hello/:first/and/:second', function () {});
        $route->conditions(array('first' => '[a-z]{3,}'));
        $result = $route->matches($resource);
        $this->assertFalse($result);
        $this->assertEquals(array(), $route->getParams());
    }

    /*
     * Route should match URI with valid path component according to rfc2396
     *
     * "Uniform Resource Identifiers (URI): Generic Syntax" http://www.ietf.org/rfc/rfc2396.txt
     *
     * Excludes "+" which is valid but decodes into a space character
     */
    public function testRouteMatchesResourceWithValidRfc2396PathComponent()
    {
        $symbols = ':@&=$,';
        $resource = '/rfc2386/' . $symbols;
        $route = new \Slim\Route('/rfc2386/:symbols', function () {});
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('symbols' => $symbols), $route->getParams());
    }

    /*
     * Route should match URI including unreserved punctuation marks from rfc2396
     *
     * "Uniform Resource Identifiers (URI): Generic Syntax" http://www.ietf.org/rfc/rfc2396.txt
     */
    public function testRouteMatchesResourceWithUnreservedMarks()
    {
        $marks = "-_.!~*'()";
        $resource = '/marks/' . $marks;
        $route = new \Slim\Route('/marks/:marks', function () {});
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('marks' => $marks), $route->getParams());
    }

    /**
     * Route optional parameters
     *
     * Pre-conditions:
     * Route pattern requires :year, optionally accepts :month and :day
     *
     * Post-conditions:
     * All: Year is 2010
     * Case A: Month and day default values are used
     * Case B: Month is "05" and day default value is used
     * Case C: Month is "05" and day is "13"
     */
    public function testRouteOptionalParameters()
    {
        $pattern = '/archive/:year(/:month(/:day))';

        //Case A
        $routeA = new \Slim\Route($pattern, function () {});
        $resourceA = '/archive/2010';
        $resultA = $routeA->matches($resourceA);
        $this->assertTrue($resultA);
        $this->assertEquals(array('year' => '2010'), $routeA->getParams());

        //Case B
        $routeB = new \Slim\Route($pattern, function () {});
        $resourceB = '/archive/2010/05';
        $resultB = $routeB->matches($resourceB);
        $this->assertTrue($resultB);
        $this->assertEquals(array('year' => '2010', 'month' => '05'), $routeB->getParams());

        //Case C
        $routeC = new \Slim\Route($pattern, function () {});
        $resourceC = '/archive/2010/05/13';
        $resultC = $routeC->matches($resourceC);
        $this->assertTrue($resultC);
        $this->assertEquals(array('year' => '2010', 'month' => '05', 'day' => '13'), $routeC->getParams());
    }

    /**
     * Test route default conditions
     *
     * Pre-conditions:
     * Route class has default conditions;
     *
     * Post-conditions:
     * Case A: Route instance has default conditions;
     * Case B: Route instance has newly merged conditions;
     */
    public function testRouteDefaultConditions()
    {
        \Slim\Route::setDefaultConditions(array('id' => '\d+'));
        $r = new \Slim\Route('/foo', function () {});
        //Case A
        $this->assertEquals(\Slim\Route::getDefaultConditions(), $r->getConditions());
        //Case B
        $r->conditions(array('name' => '[a-z]{2,5}'));
        $c = $r->getConditions();
        $this->assertArrayHasKey('id', $c);
        $this->assertArrayHasKey('name', $c);
    }

    /**
     * Route matches URI with wildcard
     */
    public function testRouteMatchesResourceWithWildcard()
    {
        $resource = '/hello/foo/bar/world';
        $route = new \Slim\Route('/hello/:path+/world', function () {});
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('path'=>array('foo', 'bar')), $route->getParams());
    }

    /**
     * Route matches URI with more than one wildcard
     */
    public function testRouteMatchesResourceWithMultipleWildcards()
    {
        $resource = '/hello/foo/bar/world/2012/03/10';
        $route = new \Slim\Route('/hello/:path+/world/:date+', function () {});
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('path'=>array('foo', 'bar'), 'date'=>array('2012', '03', '10')), $route->getParams());
    }

    /**
     * Route matches URI with wildcards and parameters
     */
    public function testRouteMatchesResourceWithWildcardsAndParams()
    {
        $resource = '/hello/foo/bar/world/2012/03/10/first/second';
        $route = new \Slim\Route('/hello/:path+/world/:year/:month/:day/:path2+', function () {});
        $result = $route->matches($resource);
        $this->assertTrue($result);
        $this->assertEquals(array('path'=>array('foo', 'bar'), 'year'=>'2012', 'month'=>'03', 'day'=>'10', 'path2'=>array('first', 'second')), $route->getParams());
    }

    /**
     * Route matches URI with optional wildcard and parameter
     */
    public function testRouteMatchesResourceWithOptionalWildcardsAndParams()
    {
        $resourceA = '/hello/world/foo/bar';
        $routeA = new \Slim\Route('/hello(/:world(/:path+))', function () {});
        $this->assertTrue($routeA->matches($resourceA));
        $this->assertEquals(array('world'=>'world', 'path'=>array('foo', 'bar')), $routeA->getParams());

        $resourceB = '/hello/world';
        $routeB = new \Slim\Route('/hello(/:world(/:path))', function () {});
        $this->assertTrue($routeB->matches($resourceB));
        $this->assertEquals(array('world'=>'world'), $routeB->getParams());
    }

    /**
     * Route does not match URI with wildcard
     */
    public function testRouteDoesNotMatchResourceWithWildcard()
    {
        $resource = '/hello';
        $route = new \Slim\Route('/hello/:path+', function () {});
        $result = $route->matches($resource);
        $this->assertFalse($result);
        $this->assertEquals(array(), $route->getParams());
    }

    /**
     * Test route sets and gets middleware
     *
     * Pre-conditions:
     * Route instantiated
     *
     * Post-conditions:
     * Case A: Middleware set as callable, not array
     * Case B: Middleware set after other middleware already set
     * Case C: Middleware set as array of callables
     * Case D: Middleware set as a callable array
     * Case E: Middleware is invalid; throws InvalidArgumentException
     * Case F: Middleware is an array with one invalid callable; throws InvalidArgumentException
     */
    public function testRouteMiddleware()
    {
        $callable1 = function () {};
        $callable2 = function () {};
        //Case A
        $r1 = new \Slim\Route('/foo', function () {});
        $r1->setMiddleware($callable1);
        $mw = $r1->getMiddleware();
        $this->assertInternalType('array', $mw);
        $this->assertEquals(1, count($mw));
        //Case B
        $r1->setMiddleware($callable2);
        $mw = $r1->getMiddleware();
        $this->assertEquals(2, count($mw));
        //Case C
        $r2 = new \Slim\Route('/foo', function () {});
        $r2->setMiddleware(array($callable1, $callable2));
        $mw = $r2->getMiddleware();
        $this->assertInternalType('array', $mw);
        $this->assertEquals(2, count($mw));
        //Case D
        $r3 = new \Slim\Route('/foo', function () {});
        $r3->setMiddleware(array($this, 'callableTestFunction'));
        $mw = $r3->getMiddleware();
        $this->assertInternalType('array', $mw);
        $this->assertEquals(1, count($mw));
        //Case E
        try {
            $r3->setMiddleware('sdjfsoi788');
            $this->fail('Did not catch InvalidArgumentException when setting invalid route middleware');
        } catch ( \InvalidArgumentException $e ) {}
        //Case F
        try {
            $r3->setMiddleware(array($callable1, $callable2, 'sdjfsoi788'));
            $this->fail('Did not catch InvalidArgumentException when setting an array with one invalid route middleware');
        } catch ( \InvalidArgumentException $e ) {}
    }

    public function callableTestFunction() {}

    /**
     * Test that a Route manages the HTTP methods that it supports
     *
     * Case A: Route initially supports no HTTP methods
     * Case B: Route can set its supported HTTP methods
     * Case C: Route can append supported HTTP methods
     * Case D: Route can test if it supports an HTTP method
     * Case E: Route can lazily declare supported HTTP methods with `via`
     */
    public function testHttpMethods()
    {
        //Case A
        $r = new \Slim\Route('/foo', function () {});
        $this->assertEmpty($r->getHttpMethods());
        //Case B
        $r->setHttpMethods('GET');
        $this->assertEquals(array('GET'), $r->getHttpMethods());
        //Case C
        $r->appendHttpMethods('POST', 'PUT');
        $this->assertEquals(array('GET', 'POST', 'PUT'), $r->getHttpMethods());
        //Case D
        $this->assertTrue($r->supportsHttpMethod('GET'));
        $this->assertFalse($r->supportsHttpMethod('DELETE'));
        //Case E
        $viaResult = $r->via('DELETE');
        $this->assertTrue($viaResult instanceof \Slim\Route);
        $this->assertTrue($r->supportsHttpMethod('DELETE'));
    }
}
