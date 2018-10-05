# Apc PSR-6 Cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/apc-adapter/v/stable)](https://packagist.org/packages/cache/apc-adapter)
[![codecov.io](https://codecov.io/github/php-cache/apc-adapter/coverage.svg?branch=master)](https://codecov.io/github/php-cache/apc-adapter?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/apc-adapter/downloads)](https://packagist.org/packages/cache/apc-adapter)
[![Monthly Downloads](https://poser.pugx.org/cache/apc-adapter/d/monthly.png)](https://packagist.org/packages/cache/apc-adapter)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a PSR-6 cache implementation using Apc. It is a part of the PHP Cache organisation. To read about 
features like tagging and hierarchy support please read the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

### Install

```bash
composer require cache/apc-adapter
```

### Use

You do not need to do any configuration to use the `ApcCachePool`.

```php
$pool = new ApcCachePool();
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).
