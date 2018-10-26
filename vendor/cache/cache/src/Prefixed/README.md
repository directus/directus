# Prefixed PSR-6 cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/prefixed-cache/v/stable)](https://packagist.org/packages/cache/prefixed-cache)
[![codecov.io](https://codecov.io/github/php-cache/prefixed-cache/coverage.svg?branch=master)](https://codecov.io/github/php-cache/prefixed-cache?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/prefixed-cache/downloads)](https://packagist.org/packages/cache/prefixed-cache)
[![Monthly Downloads](https://poser.pugx.org/cache/prefixed-cache/d/monthly.png)](https://packagist.org/packages/cache/prefixed-cache)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a decorator for a PSR-6 cache. It will allow you to prefix all cache items with a predefined key.

It is a part of the PHP Cache organisation. To read about features like tagging and hierarchy support please read 
the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

### Install

```bash
composer require cache/prefixed-cache
```
 
### Use

```php
$anyPSR6Pool = new RedisCachePool($client);
$prefixedPool = new PrefixedCachePool($anyPSR6Pool, 'acme');
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).

