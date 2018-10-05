<?php

namespace FastRoute;

use PHPUnit\Framework\TestCase;

class RouteCollectorTest extends TestCase
{
    public function testShortcuts()
    {
        $r = new DummyRouteCollector();

        $r->delete('/delete', 'delete');
        $r->get('/get', 'get');
        $r->head('/head', 'head');
        $r->patch('/patch', 'patch');
        $r->post('/post', 'post');
        $r->put('/put', 'put');

        $expected = [
            ['DELETE', '/delete', 'delete'],
            ['GET', '/get', 'get'],
            ['HEAD', '/head', 'head'],
            ['PATCH', '/patch', 'patch'],
            ['POST', '/post', 'post'],
            ['PUT', '/put', 'put'],
        ];

        $this->assertSame($expected, $r->routes);
    }

    public function testGroups()
    {
        $r = new DummyRouteCollector();

        $r->delete('/delete', 'delete');
        $r->get('/get', 'get');
        $r->head('/head', 'head');
        $r->patch('/patch', 'patch');
        $r->post('/post', 'post');
        $r->put('/put', 'put');

        $r->addGroup('/group-one', function (DummyRouteCollector $r) {
            $r->delete('/delete', 'delete');
            $r->get('/get', 'get');
            $r->head('/head', 'head');
            $r->patch('/patch', 'patch');
            $r->post('/post', 'post');
            $r->put('/put', 'put');

            $r->addGroup('/group-two', function (DummyRouteCollector $r) {
                $r->delete('/delete', 'delete');
                $r->get('/get', 'get');
                $r->head('/head', 'head');
                $r->patch('/patch', 'patch');
                $r->post('/post', 'post');
                $r->put('/put', 'put');
            });
        });

        $r->addGroup('/admin', function (DummyRouteCollector $r) {
            $r->get('-some-info', 'admin-some-info');
        });
        $r->addGroup('/admin-', function (DummyRouteCollector $r) {
            $r->get('more-info', 'admin-more-info');
        });

        $expected = [
            ['DELETE', '/delete', 'delete'],
            ['GET', '/get', 'get'],
            ['HEAD', '/head', 'head'],
            ['PATCH', '/patch', 'patch'],
            ['POST', '/post', 'post'],
            ['PUT', '/put', 'put'],
            ['DELETE', '/group-one/delete', 'delete'],
            ['GET', '/group-one/get', 'get'],
            ['HEAD', '/group-one/head', 'head'],
            ['PATCH', '/group-one/patch', 'patch'],
            ['POST', '/group-one/post', 'post'],
            ['PUT', '/group-one/put', 'put'],
            ['DELETE', '/group-one/group-two/delete', 'delete'],
            ['GET', '/group-one/group-two/get', 'get'],
            ['HEAD', '/group-one/group-two/head', 'head'],
            ['PATCH', '/group-one/group-two/patch', 'patch'],
            ['POST', '/group-one/group-two/post', 'post'],
            ['PUT', '/group-one/group-two/put', 'put'],
            ['GET', '/admin-some-info', 'admin-some-info'],
            ['GET', '/admin-more-info', 'admin-more-info'],
        ];

        $this->assertSame($expected, $r->routes);
    }
}

class DummyRouteCollector extends RouteCollector
{
    public $routes = [];

    public function __construct()
    {
    }

    public function addRoute($method, $route, $handler)
    {
        $route = $this->currentGroupPrefix . $route;
        $this->routes[] = [$method, $route, $handler];
    }
}
