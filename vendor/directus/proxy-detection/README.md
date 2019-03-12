# Proxy Scheme, Host and Port detection middleware

PSR-7 Middleware that determines the scheme, host and port from the 'X-Forwarded-Proto', 'X-Forwarded-Host' and 'X-Forwarded-Port' headers and updates the Request's Uri object.

You can set a list of proxies that are trusted as the second constructor parameter. If this list is set, then the proxy headers will only be checked if the `REMOTE_ADDR` is in the trusted list.

Based on `akrabat/proxy-detection-middleware`. It uses PHPUnit 5 and supports PHP 5.6.


## Installation

`composer require wellingguzman/proxy-detection`


## Usage

In Slim 3:

```php
$trustedProxies = ['10.0.0.1', '10.0.0.2'];
$app->add(new RKA\Middleware\ProxyDetection($trustedProxies));

$app->get('/', function ($request, $response, $args) {
    $scheme = $request->getUri()->getScheme();
    $host = $request->getUri()->getHost();
    $port = $request->getUri()->getPort();

    return $response;
});
```

## Testing

* Code coverage: ``$ vendor/bin/phpcs``
* Unit tests: ``$ vendor/bin/phpunit``
* Code coverage: ``$ vendor/bin/phpunit --coverage-html ./build``
