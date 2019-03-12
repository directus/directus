# Rate Limit

[![Build Status](https://travis-ci.org/wellingguzman/rate-limit.svg?branch=master)](https://travis-ci.org/wellingguzman/rate-limit)
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/wellingguzman/rate-limit/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/wellingguzman/rate-limit/?branch=master)
[![Code Coverage](https://scrutinizer-ci.com/g/wellingguzman/wellingguzman/badges/coverage.png?b=master)](https://scrutinizer-ci.com/g/wellingguzman/rate-limit/?branch=master)
[![Latest Stable Version](https://poser.pugx.org/wellingguzman/rate-limit/v/stable)](https://packagist.org/packages/wellingguzman/rate-limit)

Component that facilitates rate-limiting functionality. Although designed as a standalone, it also provides a middleware designed for API and/or other application endpoints that be used with any framework that supports the middleware concept.

Based on `nikolaposa/rate-limit`. Type-hinting and `declare` function were removed to support PHP 5.6.

## Installation

The preferred method of installation is via [Composer](http://getcomposer.org/). Run the following
command to install the latest version of a package and add it to your project's `composer.json`:

```bash
composer require wellingguzman/rate-limit
```

## Usage

### Standalone

```php
$rateLimiter = \RateLimit\RateLimiterFactory::createInMemoryRateLimiter(1000, 3600);

echo $rateLimiter->getLimit(); //1000
echo $rateLimiter->getWindow(); //3600

$rateLimiter->hit('key');

echo $rateLimiter->getRemainingAttempts('key'); //999
echo $rateLimiter->getResetAt('key'); //1486503558
```

**Note**: in-memory rate limiter should only be used for testing purposes. This package also provides Redis-backed rate limiter:

```php
$rateLimiter = \RateLimit\RateLimiterFactory::createRedisBackedRateLimiter([
    'host' => '10.0.0.7',
    'port' => 6379,
], 1000, 3600);
```

### Middleware

Zend Expressive example:

```php
$app = \Zend\Expressive\AppFactory::create();

$app->pipe(\RateLimit\Middleware\RateLimitMiddleware::createDefault(
   \RateLimit\RateLimiterFactory::createRedisBackedRateLimiter([
       'host' => '10.0.0.7',
       'port' => 6379,
   ], 1000, 3600)
));
```

Slim example:

```php
$app = new \Slim\App();

$app->add(\RateLimit\Middleware\RateLimitMiddleware::createDefault(
    \RateLimit\RateLimiterFactory::createRedisBackedRateLimiter([
       'host' => '10.0.0.7',
       'port' => 6379,
   ], 1000, 3600)
));
```

Whitelisting requests:

```php
use Psr\Http\Message\RequestInterface;

$rateLimitMiddleware = \RateLimit\Middleware\RateLimitMiddleware::createDefault(
   \RateLimit\RateLimiterFactory::createRedisBackedRateLimiter([
        'host' => '10.0.0.7',
        'port' => 6379,
    ], 1000, 3600),
    [
        'whitelist' => function (RequestInterface $request) {
           if (false !== strpos($request->getUri()->getPath(), 'admin')) {
               return true;
           }
         
           return false;
        },
    ]
);
```

Custom limit exceeded handler:

```php
use Psr\Http\Message\RequestInterface;
use Zend\Diactoros\Response\JsonResponse;

$rateLimitMiddleware = \RateLimit\Middleware\RateLimitMiddleware::createDefault(
    \RateLimit\RateLimiterFactory::createRedisBackedRateLimiter([
        'host' => '10.0.0.7',
        'port' => 6379,
    ], 1000, 3600),
    [
        'limitExceededHandler' => function (RequestInterface $request) {
           return new JsonResponse([
               'message' => 'API rate limit exceeded',
           ], 429);
        },
    ]
);
```

## Author

**Nikola Poša**

* https://twitter.com/nikolaposa
* https://github.com/nikolaposa

## Copyright and license

Copyright 2017 Nikola Poša. Released under MIT License - see the `LICENSE` file for details.
