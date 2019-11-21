# Changelog

The change log describes what is "Added", "Removed", "Changed" or "Fixed" between each release.

## UNRELEASED

## 1.0.0

### Added

* `Cache\Taggable\Exception\InvalidArgumentException`

### Changed

* We do not throw `Cache\Adapter\Common\Exception\InvalidArgumentException` anymore. Instead we throw 
`Cache\Taggable\Exception\InvalidArgumentException`. Both exceptions do implement `Psr\Cache\InvalidArgumentException`
* We do not require `cache/adapter-common`

### Removed

* Deprecated interfaces `TaggableItemInterface` and `TaggablePoolInterface`

## 0.5.1

### Fixed

* Bug on `TaggablePSR6ItemAdapter::isItemCreatedHere` where item value was `null`.

## 0.5.0

### Added

* Support for `TaggableCacheItemPoolInterface`

### Changed

* The behavior of `TaggablePSR6ItemAdapter::getTags()` has changed. It will not return the tags stored in the cache storage. 

### Removed

* `TaggablePoolTrait`
* Deprecated `TaggablePoolInterface` in favor of `Cache\TagInterop\TaggableCacheItemPoolInterface`
* Deprecated `TaggableItemInterface` in favor of `Cache\TagInterop\TaggableCacheItemInterface`
* Removed support for `TaggablePoolInterface` and `TaggableItemInterface`
* `TaggablePSR6ItemAdapter::getTags()`. Use `TaggablePSR6ItemAdapter::getPreviousTags()`
* `TaggablePSR6ItemAdapter::addTag()`. Use `TaggablePSR6ItemAdapter::setTags()`

## 0.4.3

### Fixed

* Do not lose the data when you start using the `TaggablePSR6PoolAdapter`

## 0.4.2

### Changed

* Updated version for integration tests
* Made `TaggablePSR6PoolAdapter::getTags` protected instead of private

## 0.4.1

### Fixed

* Saving an expired value should be the same as removing that value

## 0.4.0

This is a big BC break. The API is rewritten and how we store tags has changed. Each tag is a key to a list in the
cache storage. The list contains keys to items that uses that tag.

* The `TaggableItemInterface` is completely rewritten. It extends `CacheItemInterface` and has three methods: `getTags`, `setTags` and `addTag`.
* The `TaggablePoolInterface` is also rewritten. It has a new `clearTags` function.
* The `TaggablePoolTrait` has new methods to manipulate the list of tags.

## 0.3.1

* No changelog before this version
