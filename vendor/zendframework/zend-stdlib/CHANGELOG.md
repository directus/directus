# Changelog

All notable changes to this project will be documented in this file, in reverse chronological order by release.

## 3.0.1 - 2016-04-12

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#59](https://github.com/zendframework/zend-stdlib/pull/59) fixes a notice
  when defining the `Zend\Json\Json::GLOB_BRACE` constant on systems using
  non-gcc glob implementations.

## 3.0.0 - 2016-02-03

### Added

- [#51](https://github.com/zendframework/zend-stdlib/pull/51) adds PHP 7 as a
  supported PHP version.
- [#51](https://github.com/zendframework/zend-stdlib/pull/51) adds a migration
  document from v2 to v3. Hint: if you use hydrators, you need to be using
  zend-hydrator instead!
- [#51](https://github.com/zendframework/zend-stdlib/pull/51) adds automated
  documentation builds to gh-pages.

### Deprecated

- Nothing.

### Removed

- [#33](https://github.com/zendframework/zend-stdlib/pull/33) - removed
  deprecated classes
  - *All Hydrator classes* see #22.
  - `Zend\Stdlib\CallbackHandler` see #35
- [#37](https://github.com/zendframework/zend-stdlib/pull/37) - removed
  deprecated classes and polyfills:
  - `Zend\Stdlib\DateTime`; this had been deprecated since 2.5, and only
    existed as a polyfill for the `createFromISO8601()` support, now standard
    in all PHP versions we support.
  - `Zend\Stdlib\Exception\InvalidCallbackException`, which was unused since #33.
  - `Zend\Stdlib\Guard\GuardUtils`, which duplicated `Zend\Stdlib\Guard\AllGuardsTrait`
    to allow usage with pre-PHP 5.4 versions.
  - `src/compatibility/autoload.php`, which has been dprecated since 2.5.
- [#37](https://github.com/zendframework/zend-stdlib/pull/37) - removed
  unneeded dependencies:
  - zend-config (used only in testing ArrayUtils, and the test was redundant)
  - zend-serializer (no longer used)
- [#51](https://github.com/zendframework/zend-stdlib/pull/51) removes the
  documentation for hydrators, as those are part of the zend-hydrator
  component.

### Fixed

- Nothing.

## 2.7.4 - 2015-10-15

### Added

- Nothing.

### Deprecated

- [#35](https://github.com/zendframework/zend-stdlib/pull/35) deprecates
  `Zend\Stdlib\CallbackHandler`, as the one component that used it,
  zend-eventmanager, will no longer depend on it starting in v3.

### Removed

- Nothing.

### Fixed

- Nothing.

## 2.7.3 - 2015-09-24

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#27](https://github.com/zendframework/zend-stdlib/pull/27) fixes a race
  condition in the `FastPriorityQueue::remove()` logic that occurs when removing
  items iteratively from the same priority of a queue.

## 2.7.2 - 2015-09-23

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#26](https://github.com/zendframework/zend-stdlib/pull/26) fixes a subtle
  inheritance issue with deprecation in the hydrators, and updates the
  `HydratorInterface` to also extend the zend-hydrator `HydratorInterface` to
  ensure LSP is preserved.

## 2.7.1 - 2015-09-22

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#24](https://github.com/zendframework/zend-stdlib/pull/24) fixes an import in
  `FastPriorityQueue` to alias `SplPriorityQueue` in order to disambiguate with
  the local override present in the component.

## 2.7.0 - 2015-09-22

### Added

- [#19](https://github.com/zendframework/zend-stdlib/pull/19) adds a new
  `FastPriorityQueue` implementation. It follows the same signature as
  `SplPriorityQueue`, but uses a performance-optimized algorithm:

  - inserts are 2x faster than `SplPriorityQueue` and 3x faster than the
    `Zend\Stdlib\PriorityQueue` implementation.
  - extracts are 4x faster than `SplPriorityQueue` and 4-5x faster than the
    `Zend\Stdlib\PriorityQueue` implementation.

  The intention is to use this as a drop-in replacement in the
  `zend-eventmanager` component to provide performance benefits.

### Deprecated

- [#20](https://github.com/zendframework/zend-stdlib/pull/20) deprecates *all
  hydrator* classes, in favor of the new [zend-hydrator](https://github.com/zendframework/zend-hydrator)
  component. All classes were updated to extend their zend-hydrator equivalents,
  and marked as `@deprecated`, indicating the equivalent class from the other
  repository.

  Users *should* immediately start changing their code to use the zend-hydrator
  equivalents; in most cases, this can be as easy as removing the `Stdlib`
  namespace from import statements or hydrator configuration. Hydrators will be
  removed entirely from zend-stdlib in v3.0, and all future updates to hydrators
  will occur in the zend-hydrator library.

  Changes with backwards compatibility implications:

  - Users implementing `Zend\Stdlib\Hydrator\HydratorAwareInterface` will need to
    update their `setHydrator()` implementation to typehint on
    `Zend\Hydrator\HydratorInterface`. This can be done by changing the import
    statement for that interface as follows:

    ```php
    // Replace this:
    use Zend\Stdlib\Hydrator\HydratorInterface;
    // with this:
    use Zend\Hydrator\HydratorInterface;
    ```

    If you are not using imports, change the typehint within the signature itself:

    ```php
    // Replace this:
    public function setHydrator(\Zend\Stdlib\Hydrator\HydratorInterface $hydrator)
    // with this:
    public function setHydrator(\Zend\Hydrator\HydratorInterface $hydrator)
    ```

    If you are using `Zend\Stdlib\Hydrator\HydratorAwareTrait`, no changes are
    necessary, unless you override that method.

  - If you were catching hydrator-generated exceptions, these were previously in
    the `Zend\Stdlib\Exception` namespace. You will need to update your code to
    catch exceptions in the `Zend\Hydrator\Exception` namespace.

  - Users who *do* migrate to zend-hydrator may end up in a situation where
    their code will not work with existing libraries that are still type-hinting
    on the zend-stdlib interfaces. We will be attempting to address that ASAP,
    but the deprecation within zend-stdlib is necessary as a first step.

    In the meantime, you can write hydrators targeting zend-stdlib still in
    order to guarantee compatibility.

### Removed

- Nothing.

### Fixed

- Nothing.

## 2.6.0 - 2015-07-21

### Added

- [#13](https://github.com/zendframework/zend-stdlib/pull/13) adds
  `Zend\Stdlib\Hydrator\Iterator`, which provides mechanisms for hydrating
  objects when iterating a traversable. This allows creating generic collection
  resultsets; the original idea was pulled from
  [PhlyMongo](https://github.com/phly/PhlyMongo), where it was used to hydrate
  collections retrieved from MongoDB.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- Nothing.

## 2.5.2 - 2015-07-21

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#9](https://github.com/zendframework/zend-stdlib/pull/9) fixes an issue with
  count incrementation during insert in PriorityList, ensuring that incrementation only
  occurs when the item inserted was not previously present in the list.

## 2.4.4 - 2015-07-21

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#9](https://github.com/zendframework/zend-stdlib/pull/9) fixes an issue with
  count incrementation during insert in PriorityList, ensuring that incrementation only
  occurs when the item inserted was not previously present in the list.
