# Client IP address middleware

PSR-7 Middleware that determines the client IP address and stores it as an `ServerRequest` attribute called `ip_address`.

[![Build status][Master image]][Master]


This middleware checks the 'X-Forwarded-For', 'X-Forwarded', 'X-Cluster-Client-Ip', 'Client-Ip' headers for the first IP address it can find. If none of the headers exist, or do not have a valid IP address, then the `$_SERVER['REMOTE_ADDR']` is used.

*Note that the proxy headers are only checked if the first parameter to the constructor is set to `true`. If set to false, then only `$_SERVER['REMOTE_ADDR']` is used*

**Trusted Proxies**

You can set a list of proxies that are trusted as the second constructor parameter. If this list is set, then the proxy headers will only be checked if the `REMOTE_ADDR` is in the trusted list.


## Installation

`composer require akrabat/rka-ip-address-middleware`

## Usage

In Slim 3:

```php
$checkProxyHeaders = true; // Note: Never trust the IP address for security processes!
$trustedProxies = ['10.0.0.1', '10.0.0.2']; // Note: Never trust the IP address for security processes!
$app->add(new RKA\Middleware\IpAddress($checkProxyHeaders, $trustedProxies));

$app->get('/', function ($request, $response, $args) {
    $ipAddress = $request->getAttribute('ip_address');

    return $response;
});
```

## Testing

* Code coverage: ``$ vendor/bin/phpcs``
* Unit tests: ``$ vendor/bin/phpunit``
* Code coverage: ``$ vendor/bin/phpunit --coverage-html ./build``


[Master]: https://travis-ci.org/akrabat/rka-content-type-renderer
[Master image]: https://secure.travis-ci.org/akrabat/rka-content-type-renderer.svg?branch=master
