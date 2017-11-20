# PSR 6 Doctrine Bridge
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/psr-6-doctrine-bridge/v/stable)](https://packagist.org/packages/cache/psr-6-doctrine-bridge)
[![codecov.io](https://codecov.io/github/php-cache/doctrine-bridge/coverage.svg?branch=master)](https://codecov.io/github/php-cache/doctrine-bridge?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/psr-6-doctrine-bridge/downloads)](https://packagist.org/packages/cache/psr-6-doctrine-bridge)
[![Monthly Downloads](https://poser.pugx.org/cache/psr-6-doctrine-bridge/d/monthly.png)](https://packagist.org/packages/cache/psr-6-doctrine-bridge)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This library provides a PSR-6 compliant bridge between Doctrine and a Cache Pool. The bridge implements the
`Doctrine\Common\Cache\Cache` interface. This is useful for projects that require an implementation of
`Doctrine\Common\Cache\Cache`, but you still want to use a PSR-6 implementation.

### Install

```bash
composer require cache/psr-6-doctrine-bridge
```

### Usage

```php
use Cache\Bridge\Doctrine\DoctrineCacheBridge;

// Assuming $pool is an instance of \Psr\Cache\CacheItemPoolInterface
$cacheProvider = new DoctrineCacheBridge($pool);

$cacheProvider->contains($key);
$cacheProvider->fetch($key);
$cacheProvider->save($key, $value, $ttl);
$cacheProvider->delete($key);

// Also, if you need it:
$cacheProvider->getPool(); // same as $pool
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or
report any issues you find on the [issue tracker](http://issues.php-cache.com).
