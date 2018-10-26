# CHANGELOG


## 1.3.1 - 2016-12-20

### Fixed

- `wait()` foreign promise compatibility


## 1.3.0 - 2016-11-18

### Added

- Adds support for custom task queues.

### Fixed

- Fixed coroutine promise memory leak.


## 1.2.0 - 2016-05-18

### Changed

- Update to now catch `\Throwable` on PHP 7+


## 1.1.0 - 2016-03-07

### Changed

- Update EachPromise to prevent recurring on a iterator when advancing, as this
  could trigger fatal generator errors.
- Update Promise to allow recursive waiting without unwrapping exceptions.


## 1.0.3 - 2015-10-15

### Changed

- Update EachPromise to immediately resolve when the underlying promise iterator
  is empty. Previously, such a promise would throw an exception when its `wait`
  function was called.


## 1.0.2 - 2015-05-15

### Changed

- Conditionally require functions.php.


## 1.0.1 - 2015-06-24

### Changed

- Updating EachPromise to call next on the underlying promise iterator as late
  as possible to ensure that generators that generate new requests based on
  callbacks are not iterated until after callbacks are invoked.


## 1.0.0 - 2015-05-12

- Initial release
