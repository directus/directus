# Filesystem PSR-6 Cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/filesystem-adapter/v/stable)](https://packagist.org/packages/cache/filesystem-adapter)
[![codecov.io](https://codecov.io/github/php-cache/filesystem-adapter/coverage.svg?branch=master)](https://codecov.io/github/php-cache/filesystem-adapter?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/filesystem-adapter/downloads)](https://packagist.org/packages/cache/filesystem-adapter)
[![Monthly Downloads](https://poser.pugx.org/cache/filesystem-adapter/d/monthly.png)](https://packagist.org/packages/cache/filesystem-adapter)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a PSR-6 cache implementation using Filesystem. It is a part of the PHP Cache organisation. To read about 
features like tagging and hierarchy support please read the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

This implementation is using the excellent [Flysystem](http://flysystem.thephpleague.com/).

### Install

```bash
composer require cache/filesystem-adapter
```

### Use

To create an instance of `FilesystemCachePool` you need to configure a `Filesystem` and its adapter. 

```php
use League\Flysystem\Adapter\Local;
use League\Flysystem\Filesystem;
use Cache\Adapter\Filesystem\FilesystemCachePool;

$filesystemAdapter = new Local(__DIR__.'/');
$filesystem        = new Filesystem($filesystemAdapter);

$pool = new FilesystemCachePool($filesystem);
```

You can change the folder the cache pool will write to through the `setFolder` setter:

```php
$pool = new FilesystemCachePool($filesystem);
$pool->setFolder('path/to/cache');
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).
