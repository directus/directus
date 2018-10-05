# Predis PSR-6 Cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/predis-adapter/v/stable)](https://packagist.org/packages/cache/predis-adapter)
[![codecov.io](https://codecov.io/github/php-cache/predis-adapter/coverage.svg?branch=master)](https://codecov.io/github/php-cache/predis-adapter?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/predis-adapter/downloads)](https://packagist.org/packages/cache/predis-adapter)
[![Monthly Downloads](https://poser.pugx.org/cache/predis-adapter/d/monthly.png)](https://packagist.org/packages/cache/predis-adapter)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a PSR-6 cache implementation using Predis. It is a part of the PHP Cache organisation. To read about 
features like tagging and hierarchy support please read the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

This implementation is using [Predis](https://github.com/nrk/predis). If you want an adapter with 
[PhpRedis](https://github.com/phpredis/phpredis) you should look at our [Redis adapter](https://github.com/php-cache/redis-adapter). 

### Install

```bash
composer require cache/predis-adapter
```

### Use

To create an instance of `PredisCachePool` you need to configure a `\Predis\Client` object. 

```php
$client = new \Predis\Client('tcp:/127.0.0.1:6379');
$pool = new PredisCachePool($client);
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).
