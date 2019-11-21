# Cache Utilities
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/util/v/stable)](https://packagist.org/packages/cache/util)
[![codecov.io](https://codecov.io/github/php-cache/util/coverage.svg?branch=master)](https://codecov.io/github/php-cache/util?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/util/downloads)](https://packagist.org/packages/cache/util)
[![Monthly Downloads](https://poser.pugx.org/cache/util/d/monthly.png)](https://packagist.org/packages/cache/util)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a collection of utilities for the PSR-16 and PSR-6 caching standards.


### Install

```bash
composer require cache/util
```

### Use

```php
use function Cache\Util\SimpleCache\remember;

$cache = new SimpleCache(); // some simple cache interface

// if the result exists at the key, it'll return from cache, else it'll execute the callback and store in cache and return.
$res = remember($cache, 'key', 3600, function() {
    return someExpensiveOperation();
});
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or
report any issues you find on the [issue tracker](http://issues.php-cache.com).

