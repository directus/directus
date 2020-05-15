# Change Log

The change log describes what is "Added", "Removed", "Changed" or "Fixed" between each release. 

## UNRELEASED

## 1.1.0

### Changed

* Use `League\Flysystem\FilesystemInterface` instead of concreate `League\Flysystem\Filesystem` class

## 1.0.0

* No changes since 0.4.0

## 0.4.0

### Added

* Support for the new `TaggableCacheItemPoolInterface`. 
* Support for PSR-16 SimpleCache

### Changed

* The behavior of `CacheItem::getTags()` has changed. It will not return the tags stored in the cache storage. 

### Removed

* `CacheItem::getExpirationDate()`. Use `CacheItem::getExpirationTimestamp()`
* `CacheItem::getTags()`. Use `CacheItem::getPreviousTags()`
* `CacheItem::addTag()`. Use `CacheItem::setTags()`

## 0.3.3

### Fixed

* Race condition in `fetchObjectFromCache`.

## 0.3.2

### Changed

* Using `Filesystem::update` instead of `Filesystem::delete` and `Filesystem::write`.

## 0.3.1

### Added

* Add ability to change cache path in FilesystemCachePool

## 0.3.0

* No changelog before this version
