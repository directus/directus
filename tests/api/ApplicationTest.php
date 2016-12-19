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

class AServiceProvider implements \Directus\Application\ServiceProviderInterface
{
    protected $booted = false;
    protected $app;

    public function boot(\Directus\Application\Application $app)
    {
        $this->booted = true;
    }

    public function register(\Directus\Application\Application $app)
    {
        $this->app = $app;
    }

    public function getApp()
    {
        return $this->app;
    }

    public function isBooted()
    {
        return $this->booted;
    }

    public function setBooted($booted)
    {
        return $this->booted = (bool) $booted;
    }
}

class ApplicationTests extends PHPUnit_Framework_TestCase
{
    public function setUp()
    {
        \Slim\Environment::mock(array(
            'SERVER_NAME' => 'getdirectus.com',
            'REQUEST_METHOD' => 'GET',
            'SCRIPT_NAME' => '/foo', //<-- Physical
            'PATH_INFO' => '/bar', //<-- Virtual
            'QUERY_STRING' => 'one=foo&two=bar',
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

    public function testProviders()
    {
        $app = new \Directus\Application\Application([]);
        $app->get('/bar', function() {
            echo 'xyz';
        });

        $provider = new AServiceProvider();

        $this->assertFalse($provider->isBooted());
        $this->assertNull($provider->getApp());

        $app->register($provider);

        $this->assertFalse($provider->isBooted());

        ob_start(); $app->run(); ob_clean();

        $this->assertTrue($provider->isBooted());
        $this->assertSame($app, $provider->getApp());

        $provider->setBooted(false);

        ob_start(); $app->run(); ob_clean();
        $this->assertFalse($provider->isBooted());

        $app->boot();
        $this->assertFalse($provider->isBooted());
    }

    public function testPostData()
    {
        \Slim\Environment::mock(array(
            'SERVER_NAME' => 'getdirectus.com',
            'REQUEST_METHOD' => 'GET',
            'SCRIPT_NAME' => '/foo', //<-- Physical
            'PATH_INFO' => '/bar', //<-- Virtual
            'QUERY_STRING' => 'one=foo&two=bar',
            'CONTENT_TYPE' => 'application/json',
            'slim.input' => '{"name": "john"}',
        ));

        $app = new \Directus\Application\Application([]);
        $post = $app->request();
        $this->assertSame($post->post('name'), 'john');
    }

    public function testOutputFormat()
    {
        \Slim\Environment::mock(array(
            'SERVER_NAME' => 'getdirectus.com',
            'REQUEST_METHOD' => 'GET',
            'SCRIPT_NAME' => '/foo', //<-- Physical
            'PATH_INFO' => '/bar.json', //<-- Virtual
            'QUERY_STRING' => 'one=foo&two=bar',
        ));

        $app = new \Directus\Application\Application([]);
        $callable = function() { echo "xyz"; };
        $route = $app->get('/bar', $callable);
        $app->call();
        $this->assertEquals('xyz', $app->response()->body());
    }
}