# Change Log

All notable changes to this project will be documented in this file.

## 1.0.1 - 2017-10-25

### Fixed
- [6: Fix X-RateLimit-Remaining wave issue](https://github.com/nikolaposa/rate-limit/pull/6)

## 1.0.0 - 2017-02-14

## 0.4.0 - 2017-02-09

### Changed
- [4: Standalone rate limiter](https://github.com/nikolaposa/rate-limit/pull/4)

## 0.3.0 - 2017-02-04

### Added
- [3: Ability to whitelist requests](https://github.com/nikolaposa/rate-limit/pull/3)

### Changed
- Default identity is now generated based on certain request attributes
- Instead of returning default value, Storage raises exception if value doesn't exist under key

### Fixed
- Fixed Redis-backed rate limiter factory

## 0.2.0 - 2017-01-27

### Added
- [2: Redis-based storage](https://github.com/nikolaposa/rate-limit/pull/2)

### Changed
- [1: Atomic storage design](https://github.com/nikolaposa/rate-limit/pull/1)
- Rename `IdentityGenerator` to `IdentityResolver`


[Unreleased]: https://github.com/nikolaposa/rate-limit/compare/0.2.0...HEAD
