CHANGELOG
=========

4.4.0
-----

 * support for passing a `null` value to `Filesystem::isAbsolutePath()` is deprecated and will be removed in 5.0

4.3.0
-----

 * support for passing arrays to `Filesystem::dumpFile()` is deprecated and will be removed in 5.0
 * support for passing arrays to `Filesystem::appendToFile()` is deprecated and will be removed in 5.0

4.0.0
-----

 * removed `LockHandler`
 * Support for passing relative paths to `Filesystem::makePathRelative()` has been removed.

3.4.0
-----

 * support for passing relative paths to `Filesystem::makePathRelative()` is deprecated and will be removed in 4.0

3.3.0
-----

 * added `appendToFile()` to append contents to existing files

3.2.0
-----

 * added `readlink()` as a platform independent method to read links

3.0.0
-----

 * removed `$mode` argument from `Filesystem::dumpFile()`

2.8.0
-----

 * added tempnam() a stream aware version of PHP's native tempnam()

2.6.0
-----

 * added LockHandler

2.3.12
------

 * deprecated dumpFile() file mode argument.

2.3.0
-----

 * added the dumpFile() method to atomically write files

2.2.0
-----

 * added a delete option for the mirror() method

2.1.0
-----

 * 24eb396 : BC Break : mkdir() function now throws exception in case of failure instead of returning Boolean value
 * created the component
