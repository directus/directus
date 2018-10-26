# Changes in PHP_CodeCoverage 3.3

All notable changes of the PHP_CodeCoverage 3.3 release series are documented in this file using the [Keep a CHANGELOG](http://keepachangelog.com/) principles.

## [3.3.3] - 2016-MM-DD

### Fixed

* Fixed [#438](https://github.com/sebastianbergmann/php-code-coverage/issues/438): Wrong base directory for Clover reports

## [3.3.2] - 2016-05-25

### Changed

* The constructor of `PHP_CodeCoverage_Report_Text` now has default values for its parameters

## [3.3.1] - 2016-04-08

### Fixed

* Fixed handling of lines that contain `declare` statements

## [3.3.0] - 2016-03-03

### Added

* Added support for whitelisting classes for the unintentionally covered code unit check

[3.3.3]: https://github.com/sebastianbergmann/php-code-coverage/compare/3.3.2...3.3.3
[3.3.2]: https://github.com/sebastianbergmann/php-code-coverage/compare/3.3.1...3.3.2
[3.3.1]: https://github.com/sebastianbergmann/php-code-coverage/compare/3.3.0...3.3.1
[3.3.0]: https://github.com/sebastianbergmann/php-code-coverage/compare/3.2...3.3.0

