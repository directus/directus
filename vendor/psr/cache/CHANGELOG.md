# Changelog

All notable changes to this project will be documented in this file, in reverse chronological order by release.

## 1.0.1 - 2016-08-06

### Fixed

- Make spacing consistent in phpdoc annotations php-fig/cache#9 - chalasr
- Fix grammar in phpdoc annotations php-fig/cache#10 - chalasr
- Be more specific in docblocks that `getItems()` and `deleteItems()` take an array of strings (`string[]`) compared to just `array` php-fig/cache#8 - GrahamCampbell
- For `expiresAt()` and `expiresAfter()` in CacheItemInterface fix docblock to specify null as a valid parameters as well as an implementation of DateTimeInterface php-fig/cache#7 - GrahamCampbell

## 1.0.0 - 2015-12-11

Initial stable release; reflects accepted PSR-6 specification
