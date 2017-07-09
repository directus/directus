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

class RouterTest extends PHPUnit_Framework_TestCase
{
    /**
     * Constructor should initialize routes as empty array
     */
    public function testConstruct()
    {
        $router = new \Slim\Router();

        $this->assertAttributeEquals(array(), 'routes', $router);
    }

    /**
     * Map should set and return instance of \Slim\Route
     */
    public function testMap()
    {
        $router = new \Slim\Router();
        $route = new \Slim\Route('/foo', function() {});
        $router->map($route);

        $this->assertAttributeContains($route, 'routes', $router);
    }

    /**
     * Named route should be added and indexed by name
     */
    public function testAddNamedRoute()
    {
        $router = new \Slim\Router();
        $route = new \Slim\Route('/foo', function () {});
        $router->addNamedRoute('foo', $route);

        $property = new \ReflectionProperty($router, 'namedRoutes');
        $property->setAccessible(true);

		$rV = $property->getValue($router);
        $this->assertSame($route, $rV['foo']);
    }

    /**
     * Named route should have unique name
     */
    public function testAddNamedRouteWithDuplicateKey()
    {
        $this->setExpectedException('RuntimeException');

        $router = new \Slim\Router();
        $route = new \Slim\Route('/foo', function () {});
        $router->addNamedRoute('foo', $route);
        $router->addNamedRoute('foo', $route);
    }

    /**
     * Router should return named route by name, or null if not found
     */
    public function testGetNamedRoute()
    {
        $router = new \Slim\Router();
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($router, 'namedRoutes');
        $property->setAccessible(true);
        $property->setValue($router, array('foo' => $route));

        $this->assertSame($route, $router->getNamedRoute('foo'));
        $this->assertNull($router->getNamedRoute('bar'));
    }

    /**
     * Router should determine named routes and cache results
     */
    public function testGetNamedRoutes()
    {
        $router = new \Slim\Router();
        $route1 = new \Slim\Route('/foo', function () {});
        $route2 = new \Slim\Route('/bar', function () {});

        // Init router routes to array
        $propertyRouterRoutes = new \ReflectionProperty($router, 'routes');
        $propertyRouterRoutes->setAccessible(true);
        $propertyRouterRoutes->setValue($router, array($route1, $route2));

        // Init router named routes to null
        $propertyRouterNamedRoutes = new \ReflectionProperty($router, 'namedRoutes');
        $propertyRouterNamedRoutes->setAccessible(true);
        $propertyRouterNamedRoutes->setValue($router, null);

        // Init route name
        $propertyRouteName = new \ReflectionProperty($route2, 'name');
        $propertyRouteName->setAccessible(true);
        $propertyRouteName->setValue($route2, 'bar');

        $namedRoutes = $router->getNamedRoutes();
        $this->assertCount(1, $namedRoutes);
        $this->assertSame($route2, $namedRoutes['bar']);
    }

    /**
     * Router should detect presence of a named route by name
     */
    public function testHasNamedRoute()
    {
        $router = new \Slim\Router();
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($router, 'namedRoutes');
        $property->setAccessible(true);
        $property->setValue($router, array('foo' => $route));

        $this->assertTrue($router->hasNamedRoute('foo'));
        $this->assertFalse($router->hasNamedRoute('bar'));
    }

    /**
     * Router should return current route if set during iteration
     */
    public function testGetCurrentRoute()
    {
        $router = new \Slim\Router();
        $route = new \Slim\Route('/foo', function () {});

        $property = new \ReflectionProperty($router, 'currentRoute');
        $property->setAccessible(true);
        $property->setValue($router, $route);

        $this->assertSame($route, $router->getCurrentRoute());
    }

    /**
     * Router should return first matching route if current route not set yet by iteration
     */
    public function testGetCurrentRouteIfMatchedRoutes()
    {
        $router = new \Slim\Router();
        $route = new \Slim\Route('/foo', function () {});

        $propertyMatchedRoutes = new \ReflectionProperty($router, 'matchedRoutes');
        $propertyMatchedRoutes->setAccessible(true);
        $propertyMatchedRoutes->setValue($router, array($route));

        $propertyCurrentRoute = new \ReflectionProperty($router, 'currentRoute');
        $propertyCurrentRoute->setAccessible(true);
        $propertyCurrentRoute->setValue($router, null);

        $this->assertSame($route, $router->getCurrentRoute());
    }

    /**
     * Router should return `null` if current route not set yet and there are no matching routes
     */
    public function testGetCurrentRouteIfNoMatchedRoutes()
    {
        $router = new \Slim\Router();

        $propertyMatchedRoutes = new \ReflectionProperty($router, 'matchedRoutes');
        $propertyMatchedRoutes->setAccessible(true);
        $propertyMatchedRoutes->setValue($router, array());

        $propertyCurrentRoute = new \ReflectionProperty($router, 'currentRoute');
        $propertyCurrentRoute->setAccessible(true);
        $propertyCurrentRoute->setValue($router, null);

        $this->assertNull($router->getCurrentRoute());
    }

    public function testGetMatchedRoutes()
    {
        $router = new \Slim\Router();

        $route1 = new \Slim\Route('/foo', function () {});
		$route1 = $route1->via('GET');

        $route2 = new \Slim\Route('/foo', function () {});
		$route2 = $route2->via('POST');

        $route3 = new \Slim\Route('/bar', function () {});
		$route3 = $route3->via('PUT');

        $routes = new \ReflectionProperty($router, 'routes');
        $routes->setAccessible(true);
        $routes->setValue($router, array($route1, $route2, $route3));

        $matchedRoutes = $router->getMatchedRoutes('GET', '/foo');
        $this->assertSame($route1, $matchedRoutes[0]);
    }

    // Test url for named route

    public function testUrlFor()
    {
        $router = new \Slim\Router();

        $route1 = new \Slim\Route('/hello/:first/:last', function () {});
        $route1 = $route1->via('GET')->name('hello');

        $route2 = new \Slim\Route('/path/(:foo\.:bar)', function () {});
        $route2 = $route2->via('GET')->name('regexRoute');

        $routes = new \ReflectionProperty($router, 'namedRoutes');
        $routes->setAccessible(true);
        $routes->setValue($router, array(
            'hello' => $route1,
            'regexRoute' => $route2
        ));

        $this->assertEquals('/hello/Josh/Lockhart', $router->urlFor('hello', array('first' => 'Josh', 'last' => 'Lockhart')));
        $this->assertEquals('/path/Hello.Josh', $router->urlFor('regexRoute', array('foo' => 'Hello', 'bar' => 'Josh')));
    }

    public function testUrlForIfNoSuchRoute()
    {
        $this->setExpectedException('RuntimeException');

        $router = new \Slim\Router();
        $router->urlFor('foo', array('abc' => '123'));
    }
}
