# Changelog

All notable changes to this project will be documented in this file, in reverse chronological order by release.

## 2.9.3 - TBD

### Added

- Nothing.

### Changed

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- Nothing.

## 2.9.2 - 2017-12-11

### Added

- Nothing.

### Changed

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#292](https://github.com/zendframework/zend-db/pull/292) ensures that you may
  reference bound parameter names using a leading colon (`:`) character when
  using the PDO adapter. (The leading colon is not technically necessary, as the
  adapter will prefix for you; however, this ensures portability with vanilla
  PDO.)

## 2.9.1 - 2017-12-07

### Added

- Nothing.

### Changed

- [#289](https://github.com/zendframework/zend-db/pull/289) reverts a change
  introduced in 2.9.0 and modifies the behavior of the PDO adapter slightly
  to remove a regression. In 2.9.0, when binding parameters with names that
  contained characters not supported by PDO, we would pass the parameter names
  to `md5()`; this caused a regression, as the SQL string containing the
  parameter name was not also updated.

  This patch modifies the behavior during a bind-operation to instead raise an
  exception if a parameter name contains characters not supported by PDO.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- Nothing.

## 2.9.0 - 2017-12-06

### Added

- [#216](https://github.com/zendframework/zend-db/pull/216) added AFTER support
  in ALTER TABLE syntax for MySQL
- [#223](https://github.com/zendframework/zend-db/pull/223) added support for
  empty values set with IN predicate
- [#271](https://github.com/zendframework/zend-db/pull/271) added support for
  dash character on MySQL identifier
- [#273](https://github.com/zendframework/zend-db/pull/273) added support for
  implementing an error handler for db2_prepare
- [#275](https://github.com/zendframework/zend-db/pull/275) added support for
  LIMIT OFFSET for db2
- [#280](https://github.com/zendframework/zend-db/pull/280) added version dsn
  parameter for pdo_dblib

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#205](https://github.com/zendframework/zend-db/pull/205) fixes the spaces in
  ORDER BY syntax
- [#224](https://github.com/zendframework/zend-db/pull/224) fixes how parameters
  are bound to statements in the PDO adapter. PDO has a restriction on parameter
  names of `[0-9a-zA_Z_]`; as such, the driver now hashes the parameter names
  using `md5()` in order to ensure compatibility with other drivers.
- [#229](https://github.com/zendframework/zend-db/pull/229) fixes the support
  of SSL for mysqli
- [#255](https://github.com/zendframework/zend-db/pull/255) fixes ResultSet with
  array values
- [#261](https://github.com/zendframework/zend-db/pull/261) fixes Exception in
  Firebird driver doesn't support lastInsertId
- [#276](https://github.com/zendframework/zend-db/pull/276) fixes the support
  of PHP 7.2
- [#287](https://github.com/zendframework/zend-db/pull/287) fixes the usage of
  count() with PHP 7.2

## 2.8.2 - 2016-08-09

### Added

- [#110](https://github.com/zendframework/zend-db/pull/110) prepared the
  documentation for publication at https://zendframework.github.io/zend-db/
- [#114](https://github.com/zendframework/zend-db/pull/114) add
  Adapter\Adapter::class to alias against Adapter\AdapterInterface::class

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#154](https://github.com/zendframework/zend-db/pull/154) fixes the how the
  COMBINE operator is applied to SQLite adapters, ensuring a valid UNION
  statement is generated.
- [#112](https://github.com/zendframework/zend-db/pull/112) fixes the test on
  the number of replacements when using the same variable name.
- [#115](https://github.com/zendframework/zend-db/pull/115) TableGateway update
  method was incorrect when specifying default join declaration.
- [#145](https://github.com/zendframework/zend-db/pull/145) Fix MSSQL Select
  when encounting DISTINCT and OFFSET and LIMIT together.
- [#153](https://github.com/zendframework/zend-db/pull/153) Runtime exception
  threw fatal error due to incorrect spelling of the class when a DSN did not
  exist.

## 2.8.1 - 2016-04-14

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#100](https://github.com/zendframework/zend-db/pull/100) fixes the JOIN
  behavior to re-allow selecting an empty column set from the joined table.
- [#106](https://github.com/zendframework/zend-db/pull/106) fixes an issue in
  the test suite when ext/pgsql is enabled, but no databases are avaiable.

## 2.8.0 - 2016-04-12

### Added

- [#92](https://github.com/zendframework/zend-db/pull/92) adds the class
  `Zend\Db\Sql\Join` for creating and aggregating JOIN specifications. This is
  now consumed by all `Zend\Db\Sql` implementations in order to represent JOIN
  statements.
- [#92](https://github.com/zendframework/zend-db/pull/92) adds support for JOIN
  operations to UPDATE statements.
- [#92](https://github.com/zendframework/zend-db/pull/92) adds support for joins
  to `AbstractTableGateway::update`; you can now pass an array of
  specifications via a third argument to the method.
- [#96](https://github.com/zendframework/zend-db/pull/96) exposes the package as
  config-provider/component, but adding:
  - `Zend\Db\ConfigProvider`, which maps the `AdapterInterface` to the
    `AdapterServiceFactory`, and enables the `AdapterAbstractServiceFactory`.
  - `Zend\Db\Module`, which does the same, for a zend-mvc context.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- Nothing.

## 2.7.1 - 2016-04-12

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#71](https://github.com/zendframework/zend-db/pull/71) updates the `Pgsql`
  adapter to allow passing the connection charset; this can be done with the
  `charset` option when creating your adapter.
- [#76](https://github.com/zendframework/zend-db/pull/76) fixes the behavior of
  `Zend\Db\Sql\Insert` when an array of names is used for columns to ensure the
  string names are used, and not the array indices.
- [#91](https://github.com/zendframework/zend-db/pull/91) fixes the behavior of
  the `Oci8` adapter when initializing a result set; previously, it was
  improperly assigning the count of affected rows to the generated value.
- [#95](https://github.com/zendframework/zend-db/pull/95) fixes the `IbmDb2`
  platform's `quoteIdentifier()` method to properly allow `#` characters in
  identifiers (as they are commonly used on that platform).

## 2.7.0 - 2016-02-22

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#85](https://github.com/zendframework/zend-db/pull/85) and
  [#87](https://github.com/zendframework/zend-db/pull/87) update the code base
  to be forwards compatible with:
  - zend-eventmanager v3
  - zend-hydrator v2.1
  - zend-servicemanager v3
  - zend-stdlib v3

## 2.6.2 - 2015-12-09

### Added

- [#49](https://github.com/zendframework/zend-db/pull/49) Add docbook
  documentation.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#55](https://github.com/zendframework/zend-db/pull/55) Implement FeatureSet
  canCallMagicCall and callMagicCall methods
- [#56](https://github.com/zendframework/zend-db/pull/56)
  AbstractResultSet::current now does validation to ensure an array.
- [#58](https://github.com/zendframework/zend-db/pull/58) Fix unbuffered result
  on MySQLi.
- [#59](https://github.com/zendframework/zend-db/pull/59) Allow unix_socket
  parameter

## 2.6.1 - 2015-10-14

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#31](https://github.com/zendframework/zend-db/pull/31) fixes table gateway
  update when there is a table alias utilized.

## 2.6.1 - 2015-10-14

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- Nothing.

### Fixed

- [#43](https://github.com/zendframework/zend-db/pull/43) unset and get during
  an insert operation would throw an InvalidArgumentException during an insert.

## 2.6.0 - 2015-09-22

### Added

- [#42](https://github.com/zendframework/zend-db/pull/42) updates the component
  to use zend-hydrator for hydrator functionality; this provides forward
  compatibility with zend-hydrator, and backwards compatibility with
  hydrators from older versions of zend-stdlib.
- [#15](https://github.com/zendframework/zend-db/pull/15) adds a new predicate,
  `Zend\Db\Sql\Predicate\NotBetween`, which can be invoked via `Sql`
  instances: `$sql->notBetween($field, $min, $max)`.
- [#22](https://github.com/zendframework/zend-db/pull/22) extracts a factory,
  `Zend\Db\Metadata\Source\Factory`, from `Zend\Db\Metadata\Metadata`,
  removing the (non-public) `createSourceFromAdapter()` method from that
  class. Additionally, it extracts `Zend\Db\Metadata\MetadataInterface`, to
  allow creating alternate implementations.

### Deprecated

- [#27](https://github.com/zendframework/zend-db/pull/27) deprecates the
  constants `JOIN_OUTER_LEFT` and `JOIN_OUTER_RIGHT` in favor of
  `JOIN_LEFT_OUTER` and `JOIN_RIGHT_OUTER`.

### Removed

- Nothing.

### Fixed

- Nothing.

## 2.5.2 - 2015-09-22

### Added

- Nothing.

### Deprecated

- Nothing.

### Removed

- [#29](https://github.com/zendframework/zend-db/pull/29) removes the required
  second argument to `Zend\Db\Predicate\Predicate::expression()`, allowing it to
  be nullable, and mirroring the constructor of `Zend\Db\Predicate\Expression`.

### Fixed

- [#40](https://github.com/zendframework/zend-db/pull/40) updates the
  zend-stdlib dependency to reference `>=2.5.0,<2.7.0` to ensure hydrators
  will work as expected following extraction of hydrators to the zend-hydrator
  repository.
- [#34](https://github.com/zendframework/zend-db/pull/34) fixes retrieval of
  constraint metadata in the Oracle adapter.
- [#41](https://github.com/zendframework/zend-db/pull/41) removes hard dependency
  on EventManager in AbstractTableGateway.
- [#17](https://github.com/zendframework/zend-db/pull/17) removes an executable
  bit on a regular file.
- [#3](https://github.com/zendframework/zend-db/pull/3) updates the code to use
  closure binding (now that we're on 5.5+, this is possible).
- [#9](https://github.com/zendframework/zend-db/pull/9) thoroughly audits the
  OCI8 (Oracle) driver, ensuring it provides feature parity with other drivers,
  and fixes issues with subselects, limits, and offsets.
