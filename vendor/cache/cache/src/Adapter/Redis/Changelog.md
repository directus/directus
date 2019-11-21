# Change Log

The change log describes what is "Added", "Removed", "Changed" or "Fixed" between each release. 

## UNRELEASED

## 1.1.0

### Added
* Allow \RedisArray and \RedisCluster objects for RedisCachePool

## 1.0.0

### Fixed

* Fixed `$path` variable not initialized in `clearOneObjectFromCache`.

## 0.5.0

### Added

* Support for the new `TaggableCacheItemPoolInterface`. 
* Support for PSR-16 SimpleCache

### Changed

* The behavior of `CacheItem::getTags()` has changed. It will not return the tags stored in the cache storage. 

### Removed

* `CacheItem::getExpirationDate()`. Use `CacheItem::getExpirationTimestamp()`
* `CacheItem::getTags()`. Use `CacheItem::getPreviousTags()`
* `CacheItem::addTag()`. Use `CacheItem::setTags()`

## 0.4.2

### Changed

* The `RedisCachePool::$cache` is now protected instead of private
* Using `cache/hierarchical-cache:^0.3`

## 0.4.1

* No changelog before this version
