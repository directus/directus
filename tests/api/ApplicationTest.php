<?php

class RouteClass extends \Directus\Application\Route
{
    public function name()
    {
        echo "xyz";
    }
}

class CallableClass
{
    public function __invoke()
    {
        echo "xyz";
    }
}

class ApplicationTests extends PHPUnit_Framework_TestCase
{
    public function setUp()
    {
        \Slim\Environment::mock(array(
            'REQUEST_METHOD' => 'GET',
            'SCRIPT_NAME' => '/foo', //<-- Physical
            'PATH_INFO' => '/bar', //<-- Virtual
            'QUERY_STRING' => 'one=foo&two=bar',
            'SERVER_NAME' => 'slimframework.com',
        ));
    }

    public function testApplication()
    {
        $mw1 = function () { echo "foo"; };
        $mw2 = function () { echo "bar"; };

        // callable class:method combination
        $app = new \Directus\Application\Application([]);
        $route = $app->get('/bar', $mw1, $mw2, '\RouteClass:name');
        $app->call();
        $this->assertEquals('foobarxyz', $app->response()->body());

        // callable class:method combination in the container
        $app = new \Directus\Application\Application([]);
        $app->container->set('RouteClass', function() use ($app) {
            return new RouteClass($app);
        });
        $route = $app->get('/bar', $mw1, $mw2, 'RouteClass:name');
        $app->call();
        $this->assertEquals('foobarxyz', $app->response()->body());

        // callable function
        $app = new \Directus\Application\Application([]);
        $callable = function() { echo "xyz"; };
        $route = $app->get('/bar', $mw1, $mw2, $callable);
        $app->call();
        $this->assertEquals('foobarxyz', $app->response()->body());
        $this->assertSame($callable, $route->getCallable());

        // callable class
        $app = new \Directus\Application\Application([]);
        $route = $app->get('/bar', $mw1, $mw2, '\CallableClass');
        $app->call();
        $this->assertEquals('foobarxyz', $app->response()->body());

        // callable in the container
        $app = new \Directus\Application\Application([]);
        $app->container->set('callable', function() {
            return function() {
                echo 'xyz';
            };
        });
        $route = $app->get('/bar', $mw1, $mw2, 'callable');
        $app->call();
        $this->assertEquals('foobarxyz', $app->response()->body());
    }

    /**
     * @expectedException \RuntimeException
     */
    public function testInvalidCallable()
    {
        $app = new \Directus\Application\Application([]);
        $callable = 'one';
        $app->get('/bar', $callable);
        $app->call();
    }

    /**
     * @expectedException \RuntimeException
     */
    public function testInvalidCallable2()
    {
        $app = new \Directus\Application\Application([]);
        $callable = [];
        $app->get('/bar', $callable);
        $app->call();
    }

    /**
     * @expectedException \RuntimeException
     */
    public function testInvalidCallable3()
    {
        $app = new \Directus\Application\Application([]);
        $app->get('/bar', '\RouteMainClass:name');
        $app->call();
    }
}