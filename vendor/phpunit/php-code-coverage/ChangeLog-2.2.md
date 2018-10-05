# Changes in PHP_CodeCoverage 2.2

All notable changes of the PHP_CodeCoverage 2.2 release series are documented in this file using the [Keep a CHANGELOG](http://keepachangelog.com/) principles.

## [2.2.4] - 2015-10-06

### Fixed

* Fixed [#391](https://github.com/sebastianbergmann/php-code-coverage/pull/391): Missing `</abbr>` tag

## [2.2.3] - 2015-09-14

### Fixed

* Fixed [#368](https://github.com/sebastianbergmann/php-code-coverage/pull/368): Blacklists and whitelists are not merged when merging data sets
* Fixed [#370](https://github.com/sebastianbergmann/php-code-coverage/issues/370): Confusing statistics for source file that declares a class without methods
* Fixed [#372](https://github.com/sebastianbergmann/php-code-coverage/pull/372): Nested classes and functions are not handled correctly
* Fixed [#382](https://github.com/sebastianbergmann/php-code-coverage/issues/382): Crap4J report generates incorrect XML logfile

## [2.2.2] - 2015-08-04

### Added

* Reintroduced the `PHP_CodeCoverage_Driver_HHVM` driver as an extension of `PHP_CodeCoverage_Driver_Xdebug` that does not use `xdebug_start_code_coverage()` with options not supported by HHVM

### Changed

* Bumped required version of `sebastian/environment` to 1.3.2 for [#365](https://github.com/sebastianbergmann/php-code-coverage/issues/365)

## [2.2.1] - 2015-08-02

### Changed

* Bumped required version of `sebastian/environment` to 1.3.1 for [#365](https://github.com/sebastianbergmann/php-code-coverage/issues/365)

## [2.2.0] - 2015-08-01

### Added

* Added a driver for PHPDBG (requires PHP 7)
* Added `PHP_CodeCoverage::setDisableIgnoredLines()` to disable the ignoring of lines using annotations such as `@codeCoverageIgnore`

### Changed

* Annotating a method with `@deprecated` now has the same effect as annotating it with `@codeCoverageIgnore`

### Removed

* The dedicated driver for HHVM, `PHP_CodeCoverage_Driver_HHVM` has been removed

[2.2.4]: https://github.com/sebastianbergmann/php-code-coverage/compare/2.2.3...2.2.4
[2.2.3]: https://github.com/sebastianbergmann/php-code-coverage/compare/2.2.2...2.2.3
[2.2.2]: https://github.com/sebastianbergmann/php-code-coverage/compare/2.2.1...2.2.2
[2.2.1]: https://github.com/sebastianbergmann/php-code-coverage/compare/2.2.0...2.2.1
[2.2.0]: https://github.com/sebastianbergmann/php-code-coverage/compare/2.1...2.2.0

