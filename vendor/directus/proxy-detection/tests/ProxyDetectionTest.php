<?php
namespace RKA\Middleware\Test;

use PHPUnit\Framework\TestCase;
use RKA\Middleware\ProxyDetectionMiddleware as ProxyDetection;
use Zend\Diactoros\Response;
use Zend\Diactoros\ServerRequestFactory;

class ProxyDetectionTest extends TestCase
{
    public function testSchemeAndHostAndPortWithPortInHostHeader()
    {
        $request = ServerRequestFactory::fromGlobals([
            'REMOTE_ADDR' => '192.168.0.1',
            'HTTP_HOST' => 'foo.com',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_HOST' => 'example.com:1234',
        ]);

        $response = new Response();

        $middleware = new ProxyDetection();
        $middleware($request, $response, function ($request, $response) use (&$scheme, &$host, &$port) {
            // simply store the values
            $scheme = $request->getUri()->getScheme();
            $host = $request->getUri()->getHost();
            $port = $request->getUri()->getPort();
            return $response;
        });

        $this->assertSame('https', $scheme);
        $this->assertSame('example.com', $host);
        $this->assertSame(1234, $port);
    }

    public function testSchemeAndHostAndPortWithPortInPortHeader()
    {
        $request = ServerRequestFactory::fromGlobals([
            'REMOTE_ADDR' => '192.168.0.1',
            'HTTP_HOST' => 'foo.com',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_HOST' => 'example.com',
            'HTTP_X_FORWARDED_PORT' => '1234',
        ]);

        $response = new Response();

        $middleware = new ProxyDetection();
        $middleware($request, $response, function ($request, $response) use (&$scheme, &$host, &$port) {
            // simply store the values
            $scheme = $request->getUri()->getScheme();
            $host = $request->getUri()->getHost();
            $port = $request->getUri()->getPort();
            return $response;
        });

        $this->assertSame('https', $scheme);
        $this->assertSame('example.com', $host);
        $this->assertSame(1234, $port);
    }

    public function testSchemeAndHostAndPortWithPortInHostAndPortHeader()
    {
        $request = ServerRequestFactory::fromGlobals([
            'REMOTE_ADDR' => '192.168.0.1',
            'HTTP_HOST' => 'foo.com',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_HOST' => 'example.com:1000',
            'HTTP_X_FORWARDED_PORT' => '2000',
        ]);

        $response = new Response();

        $middleware = new ProxyDetection();
        $middleware($request, $response, function ($request, $response) use (&$scheme, &$host, &$port) {
            // simply store the values
            $scheme = $request->getUri()->getScheme();
            $host = $request->getUri()->getHost();
            $port = $request->getUri()->getPort();
            return $response;
        });

        $this->assertSame('https', $scheme);
        $this->assertSame('example.com', $host);
        $this->assertSame(1000, $port);
    }

    public function testTrustedProxies()
    {
        $request = ServerRequestFactory::fromGlobals([
            'REMOTE_ADDR' => '192.168.0.1',
            'HTTP_HOST' => 'foo.com',
            'HTTP_X_FORWARDED_PROTO' => 'https',
            'HTTP_X_FORWARDED_HOST' => 'example.com:1234',
        ]);

        $response = new Response();

        $middleware = new ProxyDetection(['192.168.0.1']);
        $middleware($request, $response, function ($request, $response) use (&$scheme, &$host, &$port) {
            // simply store the values
            $scheme = $request->getUri()->getScheme();
            $host = $request->getUri()->getHost();
            $port = $request->getUri()->getPort();
            return $response;
        });

        $this->assertSame('https', $scheme);
        $this->assertSame('example.com', $host);
        $this->assertSame(1234, $port);
    }

    public function testNonTrustedProxies()
    {
        $request = ServerRequestFactory::fromGlobals([
            'REMOTE_ADDR' => '10.0.0.1',
            'HTTP_HOST' => 'foo.com',
            'HTTP_X_FORWARDED_HOST' => 'example.com:1234',
        ]);

        $response = new Response();

        $middleware = new ProxyDetection(['192.168.0.1']);
        $middleware($request, $response, function ($request, $response) use (&$scheme, &$host, &$port) {
            // simply store the values
            $scheme = $request->getUri()->getScheme();
            $host = $request->getUri()->getHost();
            $port = $request->getUri()->getPort();
            return $response;
        });

        $this->assertSame('http', $scheme);
        $this->assertSame('foo.com', $host);
        $this->assertSame(null, $port);
    }
}
