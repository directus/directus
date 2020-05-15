# PSR-6 to PSR-16 Bridge (Simple cache)
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/simple-cache-bridge/v/stable)](https://packagist.org/packages/cache/simple-cache-bridge)
[![codecov.io](https://codecov.io/github/php-cache/simple-cache-bridge/coverage.svg?branch=master)](https://codecov.io/github/array-cache/apc-adapter?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/simple-cache-bridge/downloads)](https://packagist.org/packages/cache/simple-cache-bridge)
[![Monthly Downloads](https://poser.pugx.org/cache/simple-cache-bridge/d/monthly.png)](https://packagist.org/packages/cache/simple-cache-bridge)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a bridge that converts a PSR-6 cache implementation to PSR-16 (SimpleCache). It is a part of the PHP Cache organisation. To read about 
features like tagging and hierarchy support please read the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

### Install

```bash
composer require cache/simple-cache-bridge
```

### Use

You need an existing PSR-6 pool as a cnstructor argument to the bridge. 

```php
$psr6pool = new ArrayCachePool();
$simpleCache = new SimpleCacheBridge($psr6pool);
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).
