# Changes in PHP_CodeCoverage 4.0

All notable changes of the PHP_CodeCoverage 4.0 release series are documented in this file using the [Keep a CHANGELOG](http://keepachangelog.com/) principles.

## [4.0.8] - 2017-04-02

* Fixed [#515](https://github.com/sebastianbergmann/php-code-coverage/pull/515): Wrong use of recursive iterator causing duplicate entries in XML coverage report

## [4.0.7] - 2017-03-01

### Changed

* Cleaned up requirements in `composer.json`

## [4.0.6] - 2017-02-23

### Changed

* Added support for `phpunit/php-token-stream` 2.0
* Updated HTML report assets

## [4.0.5] - 2017-01-20

### Fixed

* Fixed formatting of executed lines percentage for classes in file view

## [4.0.4] - 2016-12-20

### Changed

* Implemented [#432](https://github.com/sebastianbergmann/php-code-coverage/issues/432): Change how files with no executable lines are displayed in the HTML report

## [4.0.3] - 2016-11-28

### Changed

* The check for unintentionally covered code is no longer performed for `@medium` and `@large` tests

## [4.0.2] - 2016-11-01

### Fixed

* Fixed [#440](https://github.com/sebastianbergmann/php-code-coverage/pull/440): Dashboard charts not showing tooltips for data points

## [4.0.1] - 2016-07-26

### Fixed

* Fixed [#458](https://github.com/sebastianbergmann/php-code-coverage/pull/458): XML report does not know about warning status

## [4.0.0] - 2016-06-03

### Changed

* This component now uses namespaces

[4.0.8]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.7...4.0.8
[4.0.7]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.6...4.0.7
[4.0.6]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.5...4.0.6
[4.0.5]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.4...4.0.5
[4.0.4]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.3...4.0.4
[4.0.3]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.2...4.0.3
[4.0.2]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.1...4.0.2
[4.0.1]: https://github.com/sebastianbergmann/php-code-coverage/compare/4.0.0...4.0.1
[4.0.0]: https://github.com/sebastianbergmann/php-code-coverage/compare/3.3...4.0.0

