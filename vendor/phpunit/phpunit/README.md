# PHPUnit

PHPUnit is a programmer-oriented testing framework for PHP. It is an instance of the xUnit architecture for unit testing frameworks.

[![Latest Stable Version](https://img.shields.io/packagist/v/phpunit/phpunit.svg?style=flat-square)](https://packagist.org/packages/phpunit/phpunit)
[![Minimum PHP Version](https://img.shields.io/badge/php-%3E%3D%205.6-8892BF.svg?style=flat-square)](https://php.net/)
[![Build Status](https://img.shields.io/travis/sebastianbergmann/phpunit/5.7.svg?style=flat-square)](https://phpunit.de/build-status.html)

## Installation

We distribute a [PHP Archive (PHAR)](https://php.net/phar) that has all required (as well as some optional) dependencies of PHPUnit bundled in a single file:

```bash
$ wget https://phar.phpunit.de/phpunit.phar

$ chmod +x phpunit.phar

$ mv phpunit.phar /usr/local/bin/phpunit
```

You can also immediately use the PHAR after you have downloaded it, of course:

```bash
$ wget https://phar.phpunit.de/phpunit.phar

$ php phpunit.phar
```

Alternatively, you may use [Composer](https://getcomposer.org/) to download and install PHPUnit as well as its dependencies. Please refer to the [documentation](https://phpunit.de/documentation.html) for details on how to do this.

## Contribute

Please refer to [CONTRIBUTING.md](https://github.com/sebastianbergmann/phpunit/blob/master/.github/CONTRIBUTING.md) for information on how to contribute to PHPUnit and its related projects.

## List of Contributors

Thanks to everyone who has contributed to PHPUnit! You can find a detailed list of contributors on every PHPUnit related package on GitHub. This list shows only the major components:

* [PHPUnit](https://github.com/sebastianbergmann/phpunit/graphs/contributors)
* [PHP_CodeCoverage](https://github.com/sebastianbergmann/php-code-coverage/graphs/contributors)
* [PHPUnit_MockObject](https://github.com/sebastianbergmann/phpunit-mock-objects/graphs/contributors)

A very special thanks to everyone who has contributed to the documentation and helps maintain the translations:

* [PHPUnit Documentation](https://github.com/sebastianbergmann/phpunit-documentation/graphs/contributors)

