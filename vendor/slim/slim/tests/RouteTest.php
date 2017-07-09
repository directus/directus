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

class LazyInitializeTestClass {
    public static $initialized = false;

    public function __construct() {
        self::$initialized = true;
    }

    public function foo() {
    }
}

class FooTestClass {
    public static $foo_invoked = false;
    public static $foo_invoked_args = array();

    public function foo() {
        self::$foo_invoked = true;
        self::$foo_invoked_args = func_get_args();
    }
}

class RouteTest extends PHPUnit_Framework_TestCase
{
    public function testGetPattern()
    {
        $route = new \Slim\Route('/foo', function () {});

        $this->assertEquals('/foo', $route->getPattern());
    }

    public function testGetName()
    {
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($route, 'name');
        $property->setAccessible(true);
        $property->setValue($route, 'foo');

        $this->assertEquals('foo', $route->getName());
    }

    public function testSetName()
    {
        $route = new \Slim\Route('/foo', function () {});
        $route->name('foo'); // <-- Alias for `setName()`

        $this->assertAttributeEquals('foo', 'name', $route);
    }

    public function testGetCallable()
    {
        $callable = function () {
            echo 'Foo';
        };
        $route = new \Slim\Route('/foo', $callable);

        $this->assertSame($callable, $route->getCallable());
    }

    public function testGetCallableAsClass()
    {
        FooTestClass::$foo_invoked = false;
        FooTestClass::$foo_invoked_args = array();
        $route = new \Slim\Route('/foo', '\FooTestClass:foo');
        $route->setParams(array('bar' => '1234'));

        $this->assertFalse(FooTestClass::$foo_invoked);
        $this->assertTrue($route->dispatch());
        $this->assertTrue(FooTestClass::$foo_invoked);
        $this->assertEquals(array('1234'), FooTestClass::$foo_invoked_args);
    }

    public function testGetCallableAsClassLazyInitialize()
    {
        LazyInitializeTestClass::$initialized = false;

        $route = new \Slim\Route('/foo', '\LazyInitializeTestClass:foo');
        $this->assertFalse(LazyInitializeTestClass::$initialized);

        $route->dispatch();
        $this->assertTrue(LazyInitializeTestClass::$initialized);
    }

    public function testGetCallableAsStaticMethod()
    {
        $route = new \Slim\Route('/bar', '\Slim\Slim::getInstance');

        $callable = $route->getCallable();
        $this->assertEquals('\Slim\Slim::getInstance', $callable);
    }

    public function example_càllâble_wïth_wéird_chars()
    {
        return 'test';
    }

    public function testGetCallableWithOddCharsAsClass()
    {
        $route = new \Slim\Route('/foo', '\RouteTest:example_càllâble_wïth_wéird_chars');
        $callable = $route->getCallable();

        $this->assertEquals('test', $callable());
    }

    public function testSetCallable()
    {
        $callable = function () {
            echo 'Foo';
        };
        $route = new \Slim\Route('/foo', $callable); // <-- Called inside __construct()

        $this->assertAttributeSame($callable, 'callable', $route);
    }

    public function testSetCallableWithInvalidArgument()
    {
        $this->setExpectedException('\InvalidArgumentException');
        $route = new \Slim\Route('/foo', 'doesNotExist'); // <-- Called inside __construct()
    }

    public function testGetParams()
    {
        $route = new \Slim\Route('/hello/:first/:last', function () {});
        $route->matches('/hello/mr/anderson'); // <-- Parses params from argument

        $this->assertEquals(array(
            'first' => 'mr',
            'last' => 'anderson'
        ), $route->getParams());
    }

    public function testSetParams()
    {
        $route = new \Slim\Route('/hello/:first/:last', function () {});
        $route->matches('/hello/mr/anderson'); // <-- Parses params from argument
        $route->setParams(array(
            'first' => 'agent',
            'last' => 'smith'
        ));

        $this->assertAttributeEquals(array(
            'first' => 'agent',
            'last' => 'smith'
        ), 'params', $route);
    }

    public function testGetParam()
    {
        $route = new \Slim\Route('/hello/:first/:last', function () {});

        $property = new \ReflectionProperty($route, 'params');
        $property->setAccessible(true);
        $property->setValue($route, array(
            'first' => 'foo',
            'last' => 'bar'
        ));

        $this->assertEquals('foo', $route->getParam('first'));
    }

    public function testGetParamThatDoesNotExist()
    {
        $this->setExpectedException('InvalidArgumentException');

        $route = new \Slim\Route('/hello/:first/:last', function () {});

        $property = new \ReflectionProperty($route, 'params');
        $property->setAccessible(true);
        $property->setValue($route, array(
            'first' => 'foo',
            'last' => 'bar'
        ));

        $route->getParam('middle');
    }

    public function testSetParam()
    {
        $route = new \Slim\Route('/hello/:first/:last', function () {});
        $route->matches('/hello/mr/anderson'); // <-- Parses params from argument
        $route->setParam('last', 'smith');

        $this->assertAttributeEquals(array(
            'first' => 'mr',
            'last' => 'smith'
        ), 'params', $route);
    }

    public function testSetParamThatDoesNotExist()
    {
        $this->setExpectedException('InvalidArgumentException');

        $route = new \Slim\Route('/hello/:first/:last', function () {});
        $route->matches('/hello/mr/anderson'); // <-- Parses params from argument
        $route->setParam('middle', 'smith'); // <-- Should trigger InvalidArgumentException
    }

    public function testMatches()
    {
        $route = new \Slim\Route('/hello/:name', function () {});

        $this->assertTrue($route->matches('/hello/josh'));
    }

    public function testMatchesIsFalse()
    {
        $route = new \Slim\Route('/foo', function () {});

        $this->assertFalse($route->matches('/bar'));
    }

    public function testMatchesPatternWithTrailingSlash()
    {
        $route = new \Slim\Route('/foo/', function () {});

        $this->assertTrue($route->matches('/foo/'));
        $this->assertTrue($route->matches('/foo'));
    }

    public function testMatchesPatternWithoutTrailingSlash()
    {
        $route = new \Slim\Route('/foo', function () {});

        $this->assertFalse($route->matches('/foo/'));
        $this->assertTrue($route->matches('/foo'));
    }

    public function testMatchesWithConditions()
    {
        $route = new \Slim\Route('/hello/:first/and/:second', function () {});
        $route->conditions(array(
            'first' => '[a-zA-Z]{3,}'
        ));

        $this->assertTrue($route->matches('/hello/Josh/and/John'));
    }

    public function testMatchesWithConditionsIsFalse()
    {
        $route = new \Slim\Route('/hello/:first/and/:second', function () {});
        $route->conditions(array(
            'first' => '[a-z]{3,}'
        ));

        $this->assertFalse($route->matches('/hello/Josh/and/John'));
    }

    /*
     * Route should match URI with valid path component according to rfc2396
     *
     * "Uniform Resource Identifiers (URI): Generic Syntax" http://www.ietf.org/rfc/rfc2396.txt
     *
     * Excludes "+" which is valid but decodes into a space character
     */
    public function testMatchesWithValidRfc2396PathComponent()
    {
        $symbols = ':@&=$,';
        $route = new \Slim\Route('/rfc2386/:symbols', function () {});

        $this->assertTrue($route->matches('/rfc2386/' . $symbols));
    }

    /*
     * Route should match URI including unreserved punctuation marks from rfc2396
     *
     * "Uniform Resource Identifiers (URI): Generic Syntax" http://www.ietf.org/rfc/rfc2396.txt
     */
    public function testMatchesWithUnreservedMarks()
    {
        $marks = "-_.!~*'()";
        $route = new \Slim\Route('/marks/:marks', function () {});

        $this->assertTrue($route->matches('/marks/' . $marks));
    }

    public function testMatchesOptionalParameters()
    {
        $pattern = '/archive/:year(/:month(/:day))';

        $route1 = new \Slim\Route($pattern, function () {});
        $this->assertTrue($route1->matches('/archive/2010'));
        $this->assertEquals(array('year' => '2010'), $route1->getParams());

        $route2 = new \Slim\Route($pattern, function () {});
        $this->assertTrue($route2->matches('/archive/2010/05'));
        $this->assertEquals(array('year' => '2010', 'month' => '05'), $route2->getParams());

        $route3 = new \Slim\Route($pattern, function () {});
        $this->assertTrue($route3->matches('/archive/2010/05/13'));
        $this->assertEquals(array('year' => '2010', 'month' => '05', 'day' => '13'), $route3->getParams());
    }

    public function testMatchesIsCaseSensitiveByDefault()
    {
        $route = new \Slim\Route('/case/sensitive', function () {});
        $this->assertTrue($route->matches('/case/sensitive'));
        $this->assertFalse($route->matches('/CaSe/SensItiVe'));
    }

    public function testMatchesCanBeCaseInsensitive()
    {
        $route = new \Slim\Route('/Case/Insensitive', function () {}, false);
        $this->assertTrue($route->matches('/Case/Insensitive'));
        $this->assertTrue($route->matches('/CaSe/iNSensItiVe'));
    }

    public function testGetConditions()
    {
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($route, 'conditions');
        $property->setAccessible(true);
        $property->setValue($route, array('foo' => '\d{3}'));

        $this->assertEquals(array('foo' => '\d{3}'), $route->getConditions());
    }

    public function testSetDefaultConditions()
    {
        \Slim\Route::setDefaultConditions(array(
            'id' => '\d+'
        ));

        $property = new \ReflectionProperty('\Slim\Route', 'defaultConditions');
        $property->setAccessible(true);

        $this->assertEquals(array(
            'id' => '\d+'
        ), $property->getValue());
    }

    public function testGetDefaultConditions()
    {
        $property = new \ReflectionProperty('\Slim\Route', 'defaultConditions');
        $property->setAccessible(true);
        $property->setValue(array(
            'id' => '\d+'
        ));

        $this->assertEquals(array(
            'id' => '\d+'
        ), \Slim\Route::getDefaultConditions());
    }

    public function testDefaultConditionsAssignedToInstance()
    {
        $staticProperty = new \ReflectionProperty('\Slim\Route', 'defaultConditions');
        $staticProperty->setAccessible(true);
        $staticProperty->setValue(array(
            'id' => '\d+'
        ));
        $route = new \Slim\Route('/foo', function () {});

        $this->assertAttributeEquals(array(
            'id' => '\d+'
        ), 'conditions', $route);
    }

    public function testMatchesWildcard()
    {
        $route = new \Slim\Route('/hello/:path+/world', function () {});

        $this->assertTrue($route->matches('/hello/foo/bar/world'));
        $this->assertAttributeEquals(array(
            'path' => array('foo', 'bar')
        ), 'params', $route);
    }

    public function testMatchesMultipleWildcards()
    {
        $route = new \Slim\Route('/hello/:path+/world/:date+', function () {});

        $this->assertTrue($route->matches('/hello/foo/bar/world/2012/03/10'));
        $this->assertAttributeEquals(array(
            'path' => array('foo', 'bar'),
            'date' => array('2012', '03', '10')
        ), 'params', $route);
    }

    public function testMatchesParamsAndWildcards()
    {
        $route = new \Slim\Route('/hello/:path+/world/:year/:month/:day/:path2+', function () {});

        $this->assertTrue($route->matches('/hello/foo/bar/world/2012/03/10/first/second'));
        $this->assertAttributeEquals(array(
            'path' => array('foo', 'bar'),
            'year' => '2012',
            'month' => '03',
            'day' => '10',
            'path2' => array('first', 'second')
        ), 'params', $route);
    }

    public function testMatchesParamsWithOptionalWildcard()
    {
        $route = new \Slim\Route('/hello(/:foo(/:bar+))', function () {});

        $this->assertTrue($route->matches('/hello'));
        $this->assertTrue($route->matches('/hello/world'));
        $this->assertTrue($route->matches('/hello/world/foo'));
        $this->assertTrue($route->matches('/hello/world/foo/bar'));
    }

    public function testSetMiddleware()
    {
        $route = new \Slim\Route('/foo', function () {});
        $mw = function () {
            echo 'Foo';
        };
        $route->setMiddleware($mw);

        $this->assertAttributeContains($mw, 'middleware', $route);
    }

    public function testSetMiddlewareMultipleTimes()
    {
        $route = new \Slim\Route('/foo', function () {});
        $mw1 = function () {
            echo 'Foo';
        };
        $mw2 = function () {
            echo 'Bar';
        };
        $route->setMiddleware($mw1);
        $route->setMiddleware($mw2);

        $this->assertAttributeContains($mw1, 'middleware', $route);
        $this->assertAttributeContains($mw2, 'middleware', $route);
    }

    public function testSetMiddlewareWithArray()
    {
        $route = new \Slim\Route('/foo', function () {});
        $mw1 = function () {
            echo 'Foo';
        };
        $mw2 = function () {
            echo 'Bar';
        };
        $route->setMiddleware(array($mw1, $mw2));

        $this->assertAttributeContains($mw1, 'middleware', $route);
        $this->assertAttributeContains($mw2, 'middleware', $route);
    }

    public function testSetMiddlewareWithInvalidArgument()
    {
        $this->setExpectedException('InvalidArgumentException');

        $route = new \Slim\Route('/foo', function () {});
        $route->setMiddleware('doesNotExist'); // <-- Should throw InvalidArgumentException
    }

    public function testSetMiddlewareWithArrayWithInvalidArgument()
    {
        $this->setExpectedException('InvalidArgumentException');

        $route = new \Slim\Route('/foo', function () {});
        $route->setMiddleware(array('doesNotExist'));
    }

    public function testGetMiddleware()
    {
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($route, 'middleware');
        $property->setAccessible(true);
        $property->setValue($route, array('foo' => 'bar'));

        $this->assertEquals(array('foo' => 'bar'), $route->getMiddleware());
    }

    public function testSetHttpMethods()
    {
        $route = new \Slim\Route('/foo', function () {});
        $route->setHttpMethods('GET', 'POST');

        $this->assertAttributeEquals(array('GET', 'POST'), 'methods', $route);
    }

    public function testGetHttpMethods()
    {
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($route, 'methods');
        $property->setAccessible(true);
        $property->setValue($route, array('GET', 'POST'));

        $this->assertEquals(array('GET', 'POST'), $route->getHttpMethods());
    }

    public function testAppendHttpMethods()
    {
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($route, 'methods');
        $property->setAccessible(true);
        $property->setValue($route, array('GET', 'POST'));

        $route->appendHttpMethods('PUT');

        $this->assertAttributeEquals(array('GET', 'POST', 'PUT'), 'methods', $route);
    }

    public function testAppendArrayOfHttpMethods()
    {
        $arrayOfMethods = array('GET','POST','PUT');
        $route = new \Slim\Route('/foo', function () {});
        $route->appendHttpMethods($arrayOfMethods);

        $this->assertAttributeEquals($arrayOfMethods,'methods',$route);
    }

    public function testAppendHttpMethodsWithVia()
    {
        $route = new \Slim\Route('/foo', function () {});
        $route->via('PUT');

        $this->assertAttributeContains('PUT', 'methods', $route);
    }

    public function testAppendArrayOfHttpMethodsWithVia()
    {
        $arrayOfMethods = array('GET','POST','PUT');
        $route = new \Slim\Route('/foo', function () {});
        $route->via($arrayOfMethods);

        $this->assertAttributeEquals($arrayOfMethods,'methods',$route);
    }

    public function testSupportsHttpMethod()
    {
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($route, 'methods');
        $property->setAccessible(true);
        $property->setValue($route, array('POST'));

        $this->assertTrue($route->supportsHttpMethod('POST'));
        $this->assertFalse($route->supportsHttpMethod('PUT'));
    }

    /**
     * Test dispatch with params
     */
    public function testDispatch()
    {
        $this->expectOutputString('Hello josh');
        $route = new \Slim\Route('/hello/:name', function ($name) { echo "Hello $name"; });
        $route->matches('/hello/josh'); //<-- Extracts params from resource URI
        $route->dispatch();
    }

    /**
     * Test dispatch with middleware
     */
    public function testDispatchWithMiddleware()
    {
        $this->expectOutputString('First! Second! Hello josh');
        $route = new \Slim\Route('/hello/:name', function ($name) { echo "Hello $name"; });
        $route->setMiddleware(function () {
            echo "First! ";
        });
        $route->setMiddleware(function () {
            echo "Second! ";
        });
        $route->matches('/hello/josh'); //<-- Extracts params from resource URI
        $route->dispatch();
    }

    /**
     * Test middleware with arguments
     */
    public function testRouteMiddlwareArguments()
    {
        $this->expectOutputString('foobar');
        $route = new \Slim\Route('/foo', function () { echo "bar"; });
        $route->setName('foo');
        $route->setMiddleware(function ($route) {
            echo $route->getName();
        });
        $route->matches('/foo'); //<-- Extracts params from resource URI
        $route->dispatch();
    }
}
