# Client IP address middleware

PSR-15 Middleware that determines the client IP address and stores it as an `ServerRequest` attribute called `ip_address`. It optionally checks various common proxy headers and then falls back to `$_SERVER['REMOTE_ADDR']`.

[![Build status][Master image]][Master]


## Configuration

The constructor takes 4 parameters which can be used to configure this middleware.

**Check proxy headers**

Note that the proxy headers are only checked if the first parameter to the constructor is set to `true`. If set to false, then only `$_SERVER['REMOTE_ADDR']` is used.

**Trusted Proxies**

If you configure to check the proxy headers (first parameter is `true`), you have to provide an array of trusted proxies as the second parameter. If the array is empty, the proxy headers will always be evaluated. If the array is not empty, it must contain strings with IP addresses, one of them must be the `$_SERVER['REMOTE_ADDR']` variable in order to allow evaluating the proxy headers - otherwise the `REMOTE_ADDR` itself is returned.

**Attribute name**

By default, the name of the attribute is '`ip_address`'. This can be changed by the third constructor parameter.

**Headers to inspect**

By default, this middleware checks the 'Forwarded', 'X-Forwarded-For', 'X-Forwarded', 'X-Cluster-Client-Ip' and 'Client-Ip' headers. You can replace this list with your own using the fourth constructor parameter.

## Security considerations

A malicious client may send any header to your proxy, including any proxy headers, containing any IP address. If your proxy simply adds another IP address to the header, an attacker can send a fake IP. Make sure to setup your proxy in a way that removes any sent (and possibly faked) headers from the original request and replaces them with correct values (i.e. the currently used `REMOTE_ADDR` on the proxy server).

This library cannot by design ensure you get correct and trustworthy results if your network environment isn't setup properly.

## Installation

`composer require akrabat/ip-address-middleware`

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

* Code style: ``$ vendor/bin/phpcs``
* Unit tests: ``$ vendor/bin/phpunit``
* Code coverage: ``$ vendor/bin/phpunit --coverage-html ./build``


[Master]: https://travis-ci.org/akrabat/ip-address-middleware
[Master image]: https://secure.travis-ci.org/akrabat/ip-address-middleware.svg?branch=master
