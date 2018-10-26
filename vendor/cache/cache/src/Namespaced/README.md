# Namespaced PSR-6 cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/namespaced-cache/v/stable)](https://packagist.org/packages/cache/namespaced-cache)
[![codecov.io](https://codecov.io/github/php-cache/namespaced-cache/coverage.svg?branch=master)](https://codecov.io/github/php-cache/namespaced-cache?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/namespaced-cache/downloads)](https://packagist.org/packages/cache/namespaced-cache)
[![Monthly Downloads](https://poser.pugx.org/cache/namespaced-cache/d/monthly.png)](https://packagist.org/packages/cache/namespaced-cache)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a decorator for a PSR-6 hierarchical cache. It will allow you to use namespaces.

It is a part of the PHP Cache organisation. To read about features like tagging and hierarchy support please read 
the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

### Install

```bash
composer require cache/namespaced-cache
```
 
### Use

```php
$hierarchyPool = new RedisCachePool($client);
$namespacedPool = new NamespacedCachePool($hierarchyPool, 'acme');
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).

