# Void PSR-6 Cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/void-adapter/v/stable)](https://packagist.org/packages/cache/void-adapter)
[![codecov.io](https://codecov.io/github/php-cache/void-adapter/coverage.svg?branch=master)](https://codecov.io/github/php-cache/void-adapter?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/void-adapter/downloads)](https://packagist.org/packages/cache/void-adapter)
[![Monthly Downloads](https://poser.pugx.org/cache/void-adapter/d/monthly.png)](https://packagist.org/packages/cache/void-adapter)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a void implementation of a PSR-6 cache. Other names for this adapter could be Blackhole or Null apdapter. 
This adapter does not save anything and will always return an empty CacheItem. It is a part of the PHP Cache 
organisation. To read about features like tagging and hierarchy support please read the 
shared documentation at [www.php-cache.com](http://www.php-cache.com). 

### Install

```bash
composer require cache/void-adapter
```

### Use

You do not need to do any configuration to use the `VoidCachePool`.

```php
$pool = new VoidCachePool();
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).
