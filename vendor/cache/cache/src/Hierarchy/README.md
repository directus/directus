# Hierarchical PSR-6 cache pool 
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/hierarchical-cache/v/stable)](https://packagist.org/packages/cache/hierarchical-cache)
[![codecov.io](https://codecov.io/github/php-cache/hierarchical-cache/coverage.svg?branch=master)](https://codecov.io/github/php-cache/hierarchical-cache?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/hierarchical-cache/downloads)](https://packagist.org/packages/cache/hierarchical-cache)
[![Monthly Downloads](https://poser.pugx.org/cache/hierarchical-cache/d/monthly.png)](https://packagist.org/packages/cache/hierarchical-cache)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This is an implementation for the PSR-6 for an hierarchical cache architecture. 

If you have a cache key like `|users|:uid|followers|:fid|likes` where `:uid` and `:fid` are arbitrary integers. You
 may flush all followers by flushing `|users|:uid|followers`.
  
It is a part of the PHP Cache organisation. To read about features like tagging and hierarchy support please read 
the shared documentation at [www.php-cache.com](http://www.php-cache.com). 

### Install

```bash
composer require cache/hierarchical-cache
```
 
### Use

Read the [documentation on usage](http://www.php-cache.com/en/latest/hierarchy/).

### Implement

Read the [documentation on implementation](http://www.php-cache.com/en/latest/implementing-cache-pools/hierarchy/).

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or 
report any issues you find on the [issue tracker](http://issues.php-cache.com).

