<?php
/**
 * Slim Framework (http://slimframework.com)
 *
 * @link      https://github.com/codeguy/Slim
 * @copyright Copyright (c) 2011-2015 Josh Lockhart
 * @license   https://github.com/codeguy/Slim/blob/master/LICENSE (MIT License)
 */
namespace Slim\Tests\Views;

use Slim\Http\Uri;
use Slim\Router;
use Slim\Views\TwigExtension;

require dirname(__DIR__) . '/vendor/autoload.php';

class TwigExtensionTest extends \PHPUnit_Framework_TestCase
{
    public function isCurrentPathProvider()
    {
        $router = new Router();

        $router->map(['GET'], '/hello/{name}', null)->setName('foo');
        $uri = Uri::createFromString('http://example.com/hello/world');

        $uri2 = $uri->withBasePath('bar');
        $router->map(['GET'], '/bar/hello/{name}', null)->setName('bar');

        return [
            [$router, $uri, 'foo', ['name' => 'world'], true],
            [$router, $uri2, 'bar', ['name' => 'world'], true],
            [$router, $uri, 'bar', ['name' => 'world'], false],
        ];
    }

    /**
     * @dataProvider isCurrentPathProvider
     */
    public function testIsCurrentPath($router, $uri, $name, $data, $expected)
    {
        $extension = new TwigExtension($router, $uri);
        $result = $extension->isCurrentPath($name, $data);

        $this->assertEquals($expected, $result);
    }

    public function currentPathProvider()
    {
        $router = new Router();

        $router->map(['GET'], '/hello/{name}', null)->setName('foo');
        $uri = Uri::createFromString('http://example.com/hello/world?a=b');

        $uri2 = $uri->withBasePath('bar');
        $router->map(['GET'], '/bar/hello/{name}', null)->setName('bar');

        return [
            [$router, '/foo', false, '/foo'],
            [$router, '/foo', true, '/foo'], // string based URI doesn't care about $withQueryString
            [$router, $uri, false, '/hello/world'],
            [$router, $uri, true, '/hello/world?a=b'],
            [$router, $uri2, false, '/bar/hello/world'],
            [$router, $uri2, true, '/bar/hello/world?a=b'],
        ];
    }

    /**
     * @dataProvider currentPathProvider
     */
    public function testCurrentPath($router, $uri, $withQueryString, $expected)
    {
        $extension = new TwigExtension($router, $uri);
        $result = $extension->currentPath($withQueryString);

        $this->assertEquals($expected, $result);
    }

    public function testFullUrlFor()
    {
        $router = new Router();
        $router->setBasePath('/app');
        $router->map(['GET'], '/activate/{token}', null)->setName('activate');
        $uri = Uri::createFromString('http://example.com/app/hello/world?a=b');

        $extension = new TwigExtension($router, $uri);
        $result = $extension->fullUrlFor('activate', ['token' => 'foo']);

        $expected = 'http://example.com/app/activate/foo';
        $this->assertEquals($expected, $result);
    }
}
