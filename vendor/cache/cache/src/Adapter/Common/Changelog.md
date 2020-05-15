# Change Log

The change log describes what is "Added", "Removed", "Changed" or "Fixed" between each release. 

## 1.1.0

### Added 

- Support for storing binary data

### Fixed

- Issue with one character variables

### Changed

- Tests are now extending `PHPUnit\Framework\TestCase` 

## 1.0.0

* No changes since 0.4.0.

## 0.4.0

### Added

* `AbstractCachePool` has 4 new abstract methods: `getList`, `removeList`, `appendListItem` and `removeListItem`.
* `AbstractCachePool::invalidateTags` and `AbstractCachePool::invalidateTags` 
* Added interfaces for our items and pools `PhpCachePool` and `PhpCacheItem`
* Trait to help adapters to support tags. `TagSupportWithArray`.

### Changed

* First parameter to `AbstractCachePool::storeItemInCache` must be a `PhpCacheItem`. 
* Return value from `AbstractCachePool::fetchObjectFromCache` must be a an array with 4 values. Added expiration timestamp. 
* `HasExpirationDateInterface` is replaced by `HasExpirationTimestampInterface`
* We do not work with `\DateTime` internally anymore. We work with timestamps. 

## 0.3.3

### Fixed

* Bugfix when you fetch data from the cache storage that was saved as "non-tagging item" but fetch as a tagging item.

## 0.3.2

### Added

* Cache pools do implement `LoggerAwareInterface`

## 0.3.0

### Changed

* The `AbstractCachePool` does not longer implement `TaggablePoolInterface`. However, the `CacheItem` does still implement `TaggableItemInterface`.
* `CacheItem::getKeyFromTaggedKey` has been removed
* The `CacheItem`'s second parameter is a callable that must return an array with 3 elements; [`hasValue`, `value`, `tags`].
 
## 0.2.0
 
* No changelog before this version
