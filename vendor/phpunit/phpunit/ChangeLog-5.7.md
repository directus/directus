# Changes in PHPUnit 5.7

All notable changes of the PHPUnit 5.7 release series are documented in this file using the [Keep a CHANGELOG](http://keepachangelog.com/) principles.

## [5.7.27] - 2018-02-01

### Fixed

* Fixed [#2236](https://github.com/sebastianbergmann/phpunit/issues/2236): Exceptions in `tearDown()` do not affect `getStatus()`
* Fixed [#2950](https://github.com/sebastianbergmann/phpunit/issues/2950): Class extending `PHPUnit\Framework\TestSuite` does not extend `PHPUnit\FrameworkTestCase`
* Fixed [#2972](https://github.com/sebastianbergmann/phpunit/issues/2972): PHPUnit crashes when test suite contains both `.phpt` files and unconventionally named tests

## [5.7.26] - 2017-12-17

### Fixed

* Fixed [#2472](https://github.com/sebastianbergmann/phpunit/issues/2472): `PHPUnit\Util\Getopt` uses deprecated `each()` function
* Fixed [#2833](https://github.com/sebastianbergmann/phpunit/issues/2833): Test class loaded during data provider execution is not discovered
* Fixed [#2922](https://github.com/sebastianbergmann/phpunit/issues/2922): Test class is not discovered when there is a test class with `@group` and provider throwing exception in it, tests are run with `--exclude-group` for that group, there is another class called later (after the class from above), and the name of that another class does not match its filename

## [5.7.25] - 2017-11-14

### Fixed

* Fixed [#2859](https://github.com/sebastianbergmann/phpunit/issues/2859): Regression caused by fix for [#2833](https://github.com/sebastianbergmann/phpunit/issues/2833)

## [5.7.24] - 2017-11-14

### Fixed

* Fixed [#2833](https://github.com/sebastianbergmann/phpunit/issues/2833): Test class loaded during data provider execution is not discovered

## [5.7.23] - 2017-10-15

### Fixed

* Fixed [#2731](https://github.com/sebastianbergmann/phpunit/issues/2731): Empty exception message cannot be expected

## [5.7.22] - 2017-09-24

### Fixed

* Fixed [#2769](https://github.com/sebastianbergmann/phpunit/issues/2769): Usage of `setUseErrorHandler()` produces `Undefined variable` error

## [5.7.21] - 2017-06-21

### Added

* Added `PHPUnit\Framework\AssertionFailedError`, `PHPUnit\Framework\Test`, and `PHPUnit\Framework\TestSuite` to the forward compatibility layer for PHPUnit 6

### Fixed

* Fixed [#2705](https://github.com/sebastianbergmann/phpunit/issues/2705): `stderr` parameter in `phpunit.xml` always considered `true`

## [5.7.20] - 2017-05-22

### Fixed

* Fixed [#2563](https://github.com/sebastianbergmann/phpunit/pull/2563): `phpunit --version` does not display version when running unsupported PHP

## [5.7.19] - 2017-04-03

### Fixed

* Fixed [#2638](https://github.com/sebastianbergmann/phpunit/pull/2638): Regression in `PHPUnit\Framework\TestCase:registerMockObjectsFromTestArguments()`

## [5.7.18] - 2017-04-02

### Fixed

* Fixed [#2145](https://github.com/sebastianbergmann/phpunit/issues/2145): `--stop-on-failure` fails to stop on PHP 7
* Fixed [#2572](https://github.com/sebastianbergmann/phpunit/issues/2572): `PHPUnit\Framework\TestCase:registerMockObjectsFromTestArguments()` does not correctly handle arrays that reference themselves

## [5.7.17] - 2017-03-19

### Fixed

* Fixed [#2016](https://github.com/sebastianbergmann/phpunit/issues/2016): `prophesize()` does not work when static attributes are backed up
* Fixed [#2568](https://github.com/sebastianbergmann/phpunit/issues/2568): `ArraySubsetConstraint` uses invalid cast to array
* Fixed [#2573](https://github.com/sebastianbergmann/phpunit/issues/2573): `getMockFromWsdl()` does not handle URLs with query parameters
* `PHPUnit\Util\Test::getDataFromTestWithAnnotation()` raises notice when docblock contains Windows line endings

## [5.7.16] - 2017-03-15

### Fixed

* Fixed [#2547](https://github.com/sebastianbergmann/phpunit/issues/2547): Code Coverage data is collected for test annotated with `@coversNothing`
* Fixed [#2558](https://github.com/sebastianbergmann/phpunit/issues/2558): `countOf()` function is missing

## [5.7.15] - 2017-03-02

### Fixed

* Fixed [#1999](https://github.com/sebastianbergmann/phpunit/issues/1999): Handler is inherited from previous custom option with handler
* Fixed [#2149](https://github.com/sebastianbergmann/phpunit/issues/2149): `assertCount()` does not handle generators properly
* Fixed [#2478](https://github.com/sebastianbergmann/phpunit/issues/2478): Tests that take too long are not reported as risky test

## [5.7.14] - 2017-02-19

### Fixed

* Fixed [#2489](https://github.com/sebastianbergmann/phpunit/issues/2489): `processUncoveredFilesFromWhitelist` is not handled correctly
* Fixed default values for `addUncoveredFilesFromWhitelist` and `processUncoveredFilesFromWhitelist` in `phpunit.xsd`

## [5.7.13] - 2017-02-10

### Fixed

* Fixed [#2493](https://github.com/sebastianbergmann/phpunit/issues/2493): Fix for [#2475](https://github.com/sebastianbergmann/phpunit/pull/2475) does not apply to PHPUnit 5.7

## [5.7.12] - 2017-02-08

### Fixed

* Fixed [#2475](https://github.com/sebastianbergmann/phpunit/pull/2475): Defining a test suite with only one file does not work

## [5.7.11] - 2017-02-05

### Fixed

* Deprecation errors when used with PHP 7.2

## [5.7.10] - 2017-02-04

### Fixed

* Fixed [#2462](https://github.com/sebastianbergmann/phpunit/issues/2462): Code Coverage whitelist is filled even if no code coverage data is to be collected

## [5.7.9] - 2017-01-28

### Fixed

* Fixed [#2447](https://github.com/sebastianbergmann/phpunit/issues/2447): Reverted backwards incompatible change to handling of boolean environment variable values specified in XML

## [5.7.8] - 2017-01-26

### Fixed

* Fixed [#2446](https://github.com/sebastianbergmann/phpunit/issues/2446): Reverted backwards incompatible change to exit code in case of warnings

## [5.7.7] - 2017-01-25

### Fixed

* Fixed [#1896](https://github.com/sebastianbergmann/phpunit/issues/1896): Wrong test location when `@depends` and `@dataProvider` are combined
* Fixed [#1983](https://github.com/sebastianbergmann/phpunit/pull/1983): Tests with `@expectedException` annotation cannot be skipped
* Fixed [#2137](https://github.com/sebastianbergmann/phpunit/issues/2137): Warnings for invalid data providers are suppressed when test execution is filtered
* Fixed [#2275](https://github.com/sebastianbergmann/phpunit/pull/2275): Invalid UTF-8 characters can lead to missing output
* Fixed [#2299](https://github.com/sebastianbergmann/phpunit/issues/2299): `expectExceptionMessage()` and `expectExceptionCode()` do not work without `expectException()`
* Fixed [#2328](https://github.com/sebastianbergmann/phpunit/issues/2328): `TestListener` callbacks `startTest()` and `endTest()` are not called when test is skipped due to `@depends`
* Fixed [#2331](https://github.com/sebastianbergmann/phpunit/issues/2331): Boolean environment variable values specified in XML get mangled
* Fixed [#2333](https://github.com/sebastianbergmann/phpunit/issues/2333): `assertContains()` and `assertNotContains()` do not handle UTF-8 strings correctly
* Fixed [#2340](https://github.com/sebastianbergmann/phpunit/pull/2340): Data providers that use `yield` or implement `Iterator` cannot be combined 
* Fixed [#2349](https://github.com/sebastianbergmann/phpunit/pull/2349): `PHPUnit_TextUI_Command` does not `exit()` when it should
* Fixed [#2392](https://github.com/sebastianbergmann/phpunit/issues/2392): Empty (but valid) data provider should skip the test
* Fixed [#2431](https://github.com/sebastianbergmann/phpunit/issues/2431): `assertArraySubset()` does not support `ArrayAccess`
* Fixed [#2435](https://github.com/sebastianbergmann/phpunit/issues/2435): Empty `@group` annotation causes error on PHP 7.2+

## [5.7.6] - 2017-01-22

### Fixed

* Fixed [#2424](https://github.com/sebastianbergmann/phpunit/issues/2424): `TestCase::getStatus()` returns `STATUS_PASSED` instead of `STATUS_RISKY` for risky test
* Fixed [#2427](https://github.com/sebastianbergmann/phpunit/issues/2427): TestDox group configuration is not handled
* Fixed [#2428](https://github.com/sebastianbergmann/phpunit/pull/2428): Nested arrays specificied in XML configuration file are not handled correctly

## [5.7.5] - 2016-12-28

### Fixed

* Fixed [#2404](https://github.com/sebastianbergmann/phpunit/pull/2404): `assertDirectoryNotIsWriteable()` calls itself

## [5.7.4] - 2016-12-13

### Fixed

* Fixed [#2394](https://github.com/sebastianbergmann/phpunit/issues/2394): Do not treat `AssertionError` as assertion failure on PHP 5

## [5.7.3] - 2016-12-09

### Fixed

* Fixed [#2384](https://github.com/sebastianbergmann/phpunit/pull/2384): Handle `PHPUnit_Framework_Exception` correctly when expecting exceptions

## [5.7.2] - 2016-12-03

### Fixed

* Fixed [#2382](https://github.com/sebastianbergmann/phpunit/issues/2382): Uncloneable test doubles passed via data provider do not work

## [5.7.1] - 2016-12-02

### Fixed

* Fixed [#2380](https://github.com/sebastianbergmann/phpunit/issues/2380): Data Providers cannot be generators anymore

## [5.7.0] - 2016-12-02

### Added

* Merged [#2223](https://github.com/sebastianbergmann/phpunit/pull/2223): Add support for multiple data providers
* Added `extensionsDirectory` configuration directive to configure a directory from which all `.phar` files are loaded as PHPUnit extensions
* Added `--no-extensions` commandline option to suppress loading of extensions (from configured extension directory)
* Added `PHPUnit\Framework\Assert` as an alias for `PHPUnit_Framework_Assert` for forward compatibility
* Added `PHPUnit\Framework\BaseTestListener` as an alias for `PHPUnit_Framework_BaseTestListener` for forward compatibility
* Added `PHPUnit\Framework\TestListener` as an alias for `PHPUnit_Framework_TestListener` for forward compatibility

### Changed

* The `--log-json` commandline option has been deprecated
* The `--tap` and `--log-tap` commandline options have been deprecated
* The `--self-update` and `--self-upgrade` commandline options have been deprecated (PHAR binary only)

[5.7.27]: https://github.com/sebastianbergmann/phpunit/compare/5.7.26...5.7.27
[5.7.26]: https://github.com/sebastianbergmann/phpunit/compare/5.7.25...5.7.26
[5.7.25]: https://github.com/sebastianbergmann/phpunit/compare/5.7.24...5.7.25
[5.7.24]: https://github.com/sebastianbergmann/phpunit/compare/5.7.23...5.7.24
[5.7.23]: https://github.com/sebastianbergmann/phpunit/compare/5.7.22...5.7.23
[5.7.22]: https://github.com/sebastianbergmann/phpunit/compare/5.7.21...5.7.22
[5.7.21]: https://github.com/sebastianbergmann/phpunit/compare/5.7.20...5.7.21
[5.7.20]: https://github.com/sebastianbergmann/phpunit/compare/5.7.19...5.7.20
[5.7.19]: https://github.com/sebastianbergmann/phpunit/compare/5.7.18...5.7.19
[5.7.18]: https://github.com/sebastianbergmann/phpunit/compare/5.7.17...5.7.18
[5.7.17]: https://github.com/sebastianbergmann/phpunit/compare/5.7.16...5.7.17
[5.7.16]: https://github.com/sebastianbergmann/phpunit/compare/5.7.15...5.7.16
[5.7.15]: https://github.com/sebastianbergmann/phpunit/compare/5.7.14...5.7.15
[5.7.14]: https://github.com/sebastianbergmann/phpunit/compare/5.7.13...5.7.14
[5.7.13]: https://github.com/sebastianbergmann/phpunit/compare/5.7.12...5.7.13
[5.7.12]: https://github.com/sebastianbergmann/phpunit/compare/5.7.11...5.7.12
[5.7.11]: https://github.com/sebastianbergmann/phpunit/compare/5.7.10...5.7.11
[5.7.10]: https://github.com/sebastianbergmann/phpunit/compare/5.7.9...5.7.10
[5.7.9]: https://github.com/sebastianbergmann/phpunit/compare/5.7.8...5.7.9
[5.7.8]: https://github.com/sebastianbergmann/phpunit/compare/5.7.7...5.7.8
[5.7.7]: https://github.com/sebastianbergmann/phpunit/compare/5.7.6...5.7.7
[5.7.6]: https://github.com/sebastianbergmann/phpunit/compare/5.7.5...5.7.6
[5.7.5]: https://github.com/sebastianbergmann/phpunit/compare/5.7.4...5.7.5
[5.7.4]: https://github.com/sebastianbergmann/phpunit/compare/5.7.3...5.7.4
[5.7.3]: https://github.com/sebastianbergmann/phpunit/compare/5.7.2...5.7.3
[5.7.2]: https://github.com/sebastianbergmann/phpunit/compare/5.7.1...5.7.2
[5.7.1]: https://github.com/sebastianbergmann/phpunit/compare/5.7.0...5.7.1
[5.7.0]: https://github.com/sebastianbergmann/phpunit/compare/5.6...5.7.0

