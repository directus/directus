# ramsey/uuid

_NOTICE: Formerly known as `rhumsaa/uuid`, The package and namespace names have changed to `ramsey/uuid` and `Ramsey\Uuid`, respectively._

[![Source Code][badge-source]][source]
[![Latest Version][badge-release]][release]
[![Software License][badge-license]][license]
[![Build Status][badge-build]][build]
[![Coverage Status][badge-coverage]][coverage]
[![Total Downloads][badge-downloads]][downloads]

ramsey/uuid is a PHP 5.4+ library for generating and working with [RFC 4122][rfc4122] version 1, 3, 4, and 5 universally unique identifiers (UUID).

This project adheres to a [Contributor Code of Conduct][conduct]. By participating in this project and its community, you are expected to uphold this code.


## About

From [Wikipedia](http://en.wikipedia.org/wiki/Universally_unique_identifier):

> The intent of UUIDs is to enable distributed systems to uniquely identify information without significant central coordination. In this context the word unique should be taken to mean "practically unique" rather than "guaranteed unique". Since the identifiers have a finite size, it is possible for two differing items to share the same identifier. The identifier size and generation process need to be selected so as to make this sufficiently improbable in practice. Anyone can create a UUID and use it to identify something with reasonable confidence that the same identifier will never be unintentionally created by anyone to identify something else. Information labeled with UUIDs can therefore be later combined into a single database without needing to resolve identifier (ID) conflicts.

Much inspiration for this library came from the [Java][javauuid] and [Python][pyuuid] UUID libraries.


## Installation

The preferred method of installation is via [Packagist][] and [Composer][]. Run the following command to install the package and add it as a requirement to your project's `composer.json`:

```bash
composer require ramsey/uuid
```


## Upgrading from 2.x to 3.x

While we have made significant internal changes to the library, we have made every effort to ensure a seamless upgrade path from the 2.x series of this library to 3.x.

One major breaking change is the transition from the `Rhumsaa` root namespace to `Ramsey`. In most cases, all you will need is to change the namespace to `Ramsey` in your code, and everything will "just work."

Here are full details on the breaking changes to the public API of this library:

1. All namespace references of `Rhumsaa` have changed to `Ramsey`. Simply change the namespace to `Ramsey` in your code and everything should work.
2. The console application has moved to [ramsey/uuid-console](https://packagist.org/packages/ramsey/uuid-console). If using the console functionality, use Composer to require `ramsey/uuid-console`.
3. The Doctrine field type mapping has moved to [ramsey/uuid-doctrine](https://packagist.org/packages/ramsey/uuid-doctrine). If using the Doctrine functionality, use Composer to require `ramsey/uuid-doctrine`.


## What to do if you see a "rhumsaa/uuid is abandoned" message

When installing your project's dependencies using Composer, you might see the following message:

```
Package rhumsaa/uuid is abandoned, you should avoid using it. Use ramsey/uuid instead.
```

Don't panic. Simply execute the following commands with Composer:

``` bash
composer remove rhumsaa/uuid
composer require ramsey/uuid=^2.9
```

After doing so, you will have the latest ramsey/uuid package in the 2.x series, and there will be no need to modify any code; the namespace in the 2.x series is still `Rhumsaa`.


## Requirements

Some methods in this library have requirements due to integer size restrictions on 32-bit and 64-bit builds of PHP. A 64-bit build of PHP and the [Moontoast\Math][] library are recommended. However, this library is designed to work on 32-bit builds of PHP without Moontoast\Math, with some degraded functionality. Please check the API documentation for more information.

If a particular requirement is not present, then an `UnsatisfiedDependencyException` is thrown, allowing one to catch a bad call in an environment where the call is not supported and gracefully degrade.


## API documentation

The [latest class API documentation][apidocs] is available online.

This project uses [ApiGen](http://apigen.org/) to generate this documentation. To generate the documentation on your own, install dev dependencies and run the following command from the root of the project:

```
composer build-docs
```

This will generate documentation in the `build/apidocs/` folder.


## Examples

See the [cookbook on the wiki][wiki-cookbook] for more examples and approaches to specific use-cases.

```php
<?php
require 'vendor/autoload.php';

use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

try {

    // Generate a version 1 (time-based) UUID object
    $uuid1 = Uuid::uuid1();
    echo $uuid1->toString() . "\n"; // i.e. e4eaaaf2-d142-11e1-b3e4-080027620cdd

    // Generate a version 3 (name-based and hashed with MD5) UUID object
    $uuid3 = Uuid::uuid3(Uuid::NAMESPACE_DNS, 'php.net');
    echo $uuid3->toString() . "\n"; // i.e. 11a38b9a-b3da-360f-9353-a5a725514269

    // Generate a version 4 (random) UUID object
    $uuid4 = Uuid::uuid4();
    echo $uuid4->toString() . "\n"; // i.e. 25769c6c-d34d-4bfe-ba98-e0ee856f3e7a

    // Generate a version 5 (name-based and hashed with SHA1) UUID object
    $uuid5 = Uuid::uuid5(Uuid::NAMESPACE_DNS, 'php.net');
    echo $uuid5->toString() . "\n"; // i.e. c4a760a8-dbcf-5254-a0d9-6a4474bd1b62

} catch (UnsatisfiedDependencyException $e) {

    // Some dependency was not met. Either the method cannot be called on a
    // 32-bit system, or it can, but it relies on Moontoast\Math to be present.
    echo 'Caught exception: ' . $e->getMessage() . "\n";

}
```


## Contributing

Contributions are welcome! Please read [CONTRIBUTING][] for details.


## Copyright and license

The ramsey/uuid library is copyright © [Ben Ramsey](https://benramsey.com/) and licensed for use under the MIT License (MIT). Please see [LICENSE][] for more information.



[rfc4122]: http://tools.ietf.org/html/rfc4122
[conduct]: https://github.com/ramsey/uuid/blob/master/CODE_OF_CONDUCT.md
[javauuid]: http://docs.oracle.com/javase/6/docs/api/java/util/UUID.html
[pyuuid]: http://docs.python.org/3/library/uuid.html
[packagist]: https://packagist.org/packages/ramsey/uuid
[composer]: http://getcomposer.org/
[moontoast\math]: https://packagist.org/packages/moontoast/math
[apidocs]: http://docs.benramsey.com/ramsey-uuid/latest/
[wiki-cookbook]: https://github.com/ramsey/uuid/wiki/Ramsey%5CUuid-Cookbook
[contributing]: https://github.com/ramsey/uuid/blob/master/CONTRIBUTING.md

[badge-source]: https://img.shields.io/badge/source-ramsey/uuid-blue.svg?style=flat-square
[badge-release]: https://img.shields.io/packagist/v/ramsey/uuid.svg?style=flat-square
[badge-license]: https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square
[badge-build]: https://img.shields.io/travis/ramsey/uuid/master.svg?style=flat-square
[badge-coverage]: https://img.shields.io/coveralls/ramsey/uuid/master.svg?style=flat-square
[badge-downloads]: https://img.shields.io/packagist/dt/ramsey/uuid.svg?style=flat-square

[source]: https://github.com/ramsey/uuid
[release]: https://packagist.org/packages/ramsey/uuid
[license]: https://github.com/ramsey/uuid/blob/master/LICENSE
[build]: https://travis-ci.org/ramsey/uuid
[coverage]: https://coveralls.io/r/ramsey/uuid?branch=master
[downloads]: https://packagist.org/packages/ramsey/uuid
