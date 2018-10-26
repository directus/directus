# Changes in PHP_CodeCoverage 3.1

All notable changes of the PHP_CodeCoverage 3.1 release series are documented in this file using the [Keep a CHANGELOG](http://keepachangelog.com/) principles.

## [3.1.1] - 2016-02-04

### Changed

* Allow version 2.0.x of `sebastian/version` dependency

## [3.1.0] - 2016-01-11

### Added

* Implemented [#234](https://github.com/sebastianbergmann/php-code-coverage/issues/234): Optionally raise an exception when a specified unit of code is not executed

### Changed

* The Clover XML report now contains cyclomatic complexity information
* The Clover XML report now contains method visibility information
* Cleanup and refactoring of various areas of code
* Added missing test cases

### Removed

* The functionality controlled by the `mapTestClassNameToCoveredClassName` setting has been removed

[3.1.1]: https://github.com/sebastianbergmann/php-code-coverage/compare/3.1.0...3.1.1
[3.1.0]: https://github.com/sebastianbergmann/php-code-coverage/compare/3.0...3.1.0

