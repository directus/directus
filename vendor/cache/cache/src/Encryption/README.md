# Encryption PSR-6 Cache pool
[![Gitter](https://badges.gitter.im/php-cache/cache.svg)](https://gitter.im/php-cache/cache?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Latest Stable Version](https://poser.pugx.org/cache/encryption-cache/v/stable)](https://packagist.org/packages/cache/encryption-cache)
[![codecov.io](https://codecov.io/github/php-cache/encryption-cache/coverage.svg?branch=master)](https://codecov.io/github/php-cache/encryption-cache?branch=master)
[![Total Downloads](https://poser.pugx.org/cache/encryption-cache/downloads)](https://packagist.org/packages/cache/encryption-cache)
[![Monthly Downloads](https://poser.pugx.org/cache/encryption-cache/d/monthly.png)](https://packagist.org/packages/cache/encryption-cache)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)

This repository has a encryption wrapper that makes the PSR-6 cache implementation encrypted.

Encryption and decryption are both expensive operations, and frequent reads from an encrypted data store can quickly become a bottleneck in otherwise performant applications. Use encrypted caches sparingly.


### Install

```bash
composer require cache/encryption-cache
```

### Use

Read the [documentation on usage](http://www.php-cache.com/en/latest/encryption/).

### Implement

Read the [documentation on implementation](http://www.php-cache.com/en/latest/implementing-cache-pools/encryption/).

### Contribute

Contributions are very welcome! Send a pull request to the [main repository](https://github.com/php-cache/cache) or
report any issues you find on the [issue tracker](http://issues.php-cache.com).
