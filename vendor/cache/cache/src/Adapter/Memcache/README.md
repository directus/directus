# Memcache PSR-6 Cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/memcache-adapter/v/stable)](https://packagist.org/packages/cache/memcache-adapter)
[![codecov.io](https://codecov.io/github/php-cache/memcache-adapter/coverage.svg?branch=master)](https://codecov.io/github/php-cache/memcache-adapter?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/memcache-adapter/downloads)](https://packagist.org/packages/cache/memcache-adapter)
[![Monthly Downloads](https://poser.pugx.org/cache/memcache-adapter/d/monthly.png)](https://packagist.org/packages/cache/memcache-adapter)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is a PSR-6 cache implementation using Memcache. It is a part of the PHP Cache organisation. To read about 
features like tagging and hierarchy support please read the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

### Install

```bash
composer require cache/memcache-adapter
```

### Use

To create an instance of `MemcacheCachePool` you need to configure a `\Memcache` client. 

```php
$client = new Memcache();
$client->connect('localhost', 11211);
$pool = new MemcacheCachePool($client);
```

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).
