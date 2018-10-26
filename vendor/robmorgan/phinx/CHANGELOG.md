# Version History

**0.9.2** (Saturday, 23 December 2017)
* Pull requests
  * [#1169](https://github.com/cakephp/phinx/pull/1169) Apply default collation on tables as per documentation
  * [#1214](https://github.com/cakephp/phinx/pull/1214) Simplify multiple primary key quoting
  * [#1238](https://github.com/cakephp/phinx/pull/1238) Support PHPUnit 6
  * [#1244](https://github.com/cakephp/phinx/pull/1244) Add ordered seeds feature
  * [#1246](https://github.com/cakephp/phinx/pull/1246) Added saving column's comment for PostgresAdapter when you add column
* Bug fixes
  * [#1181](https://github.com/cakephp/phinx/pull/1181) Fix "Fatal: hasOption() on null" error
  * [#1198](https://github.com/cakephp/phinx/pull/1198) Fix chainability for the setColumns call

**0.9.1** (Satruday, 9 September 2017)
* Pull requests
  * [#1164](https://github.com/robmorgan/phinx/pull/1164) Added a function to migration classes to determine migration direction
* Bug fixes
  * [#1173](https://github.com/cakephp/phinx/pull/1173) Fixing configuration item `default_migration_table`
  * [#1170](https://github.com/cakephp/phinx/pull/1170) Fixed regression when setting the pdo object directly in the config

**0.9.0** (Sunday, 3rd September 2017)
* Documentation updates
* Pull requests
  * [#1122](https://github.com/robmorgan/phinx/pull/1129) SQL exceptions will now produce PHP exceptions
  * [#1053](https://github.com/robmorgan/phinx/pull/1053) Docker Development Kickstarter
  * [#945](https://github.com/robmorgan/phinx/pull/945) Rollback --target using migration name
  * [#1070](https://github.com/robmorgan/phinx/pull/1070) Supporting namespaces in configuration, Migrations and Seeds
  * [#1155](https://github.com/robmorgan/phinx/pull/1155) Fill up column values from schema
  * [#1148](https://github.com/robmorgan/phinx/pull/1148) When execute command `seed:run`, insert all data to a table in a bulk
* Bug fixes
  * [#1111](https://github.com/cakephp/phinx/pull/1111) Fixed error when calling truncateTable() method
  * [#1117](https://github.com/cakephp/phinx/pull/1117) Quote column names in the addIndex() method for PostgresSQL
  * [#1126](https://github.com/robmorgan/phinx/pull/1126) Fix invalid changeColumn regex causing deletions
  * [#1093](https://github.com/robmorgan/phinx/pull/1093) Fix issue with dropColumn command in SQLite
  * [#1091](https://github.com/robmorgan/phinx/pull/1091) Fix pgsql quoting in comment clause
  * [#1094](https://github.com/robmorgan/phinx/pull/1094) Fix varchar to datetime error

**0.8.1** (Monday, 5th June 2017)
* Documentation updates
* Pull requests
  * [#768](https://github.com/robmorgan/phinx/pull/768) Support for MySQL unsigned primary keys
  * [#1104](https://github.com/robmorgan/phinx/pull/1029) Removed support for HHVM
  * [#1082](https://github.com/robmorgan/phinx/pull/1082) Fixed paths displayed in text output
  * [#1055](https://github.com/robmorgan/phinx/pull/1055) Text wrapper improvements
  * [#1056](https://github.com/robmorgan/phinx/pull/1056) Update Input/OutputInterface on cached Manager
* Bug fixes
  * [#1060](https://github.com/robmorgan/phinx/pull/1060) Fixed rollback on only one migration

**0.8.0** (Tuesday, 28th February 2017)
* Documentation updates
* New features
  * [#1045](https://github.com/robmorgan/phinx/pull/1045) Rollbacks by start time - Thanks to [Daniel Gomes](https://github.com/daniel-gomes-sociomantic).

Please see [UPGRAGE_0.8](https://github.com/robmorgan/phinx/blob/master/UPGRADE_0.8.md) for additional details regarding [#1045](https://github.com/robmorgan/phinx/pull/1045)

**0.7.2** (Tuesday, 28th February 2017)

* Bug fixes
  * [#1041](https://github.com/robmorgan/phinx/pull/1041) Quote new column name in renameColumn in PostgresAdapter
  * [#1048](https://github.com/robmorgan/phinx/pull/1048) Do not allow the start_time to be updated when setting a breakpoint

**0.7.1** (Sunday, 19th February 2017)

* Documentation updates
* New features
  * [#978](https://github.com/robmorgan/phinx/pull/978) Add table truncate method
* Pull requests
  * [#1029](https://github.com/robmorgan/phinx/pull/1029) Add vendor to Phinx path to align with other docs

**0.7.0** (Friday, 10th February 2017)

* Documentation updates
* New features
  * [#885](https://github.com/robmorgan/phinx/pull/885) Add `collation` and `encoding` options for MySQL text and char columns
* Pull requests
  * [#813](https://github.com/robmorgan/phinx/pull/813) Fix SQLite data insertion
  * [#867](https://github.com/robmorgan/phinx/pull/867) Improve Postgres geography types creation
  * [#966](https://github.com/robmorgan/phinx/pull/966) Remove unused variable
  * [#973](https://github.com/robmorgan/phinx/pull/973) Improve documentation grammar
  * [#979](https://github.com/robmorgan/phinx/pull/979) Add `.gitattributes` to exclude tests on Composer export
  * [#983](https://github.com/robmorgan/phinx/pull/983) Document changing a foreign key constraint name
  * [#1001](https://github.com/robmorgan/phinx/pull/1001) Cleanup phpunit mock warnings
  * [#1007](https://github.com/robmorgan/phinx/pull/1007) Integrate PHPStan and fix issues discovered
  * [#1020](https://github.com/robmorgan/phinx/pull/1020) Document adding named foreign keys
  * [#1028](https://github.com/robmorgan/phinx/pull/1028) Add docs about MySQL table specific options
  * [#1033](https://github.com/robmorgan/phinx/pull/1033) Add PHP 7.1 to Travis CI

**0.6.6** (Monday, 23rd January 2017)

* Documentation updates
* New Features
  * [#943](https://github.com/robmorgan/phinx/pull/943) Adding hint on migration name in CamelCase
* Bug fixes
  * [#813](https://github.com/robmorgan/phinx/pull/813) fix(pdo_sqlite): Correctly handles data insertions
  * [#956](https://github.com/robmorgan/phinx/pull/956) Fix seed command accepting string
  * [#1002](https://github.com/robmorgan/phinx/pull/1002) Fix Appveyor builds
  * [#1006](https://github.com/robmorgan/phinx/pull/1006) Fix update column with , in definition (SQLite)
* Development branch changed to `master`

**0.6.5** (Thursday, 27th October 2016)

* Documentation updates
* Pull requests
  * [#831](https://github.com/robmorgan/phinx/pull/831) Typos
  * [#929](https://github.com/robmorgan/phinx/pull/929) Support glob brace for seed paths
  * [#949](https://github.com/robmorgan/phinx/pull/949) Fix for Config::getMigrationBaseClassName
  * [#958](https://github.com/robmorgan/phinx/pull/958) Allow console input to be used within adapters

**0.6.4** (Wednesday, 27th July 2016)

* Documentation updates
* Pull requests
  * [#909](https://github.com/robmorgan/phinx/pull/909) Declare test class properties
  * [#910](https://github.com/robmorgan/phinx/pull/910), [#916](https://github.com/robmorgan/phinx/pull/916) Remove unused variables
  * [#912](https://github.com/robmorgan/phinx/pull/912) ConfigInterface usage consistency
  * [#914](https://github.com/robmorgan/phinx/pull/914) Set return values and @return documentation
  * [#918](https://github.com/robmorgan/phinx/pull/918) Docblock correction for Phinx\Migration\Manager::executeSeed()
  * [#921](https://github.com/robmorgan/phinx/pull/921) Add Phinx\Wrapper\TextWrapper::getSeed()
* Bug fixes
  * [#908](https://github.com/robmorgan/phinx/pull/908) Fix setting options for Column, ForeignKey and Index
  * [#922](https://github.com/robmorgan/phinx/pull/922) SQLite adapter drops table on changeColumn if there's a foreign key

**0.6.3** (Monday, 18th July 2016)

* New features
  * [#707](https://github.com/robmorgan/phinx/pull/707/files) Add arguments for timestamps columns names
* Documentation cleanup
* Bug fixes
  * [#884](https://github.com/robmorgan/phinx/pull/884) Only rollback 1 migration when only 2 migrations exist
  * Input and Output are now correctly supplied to migration template creation classes

**0.6.2** (Thursday, 23rd June 2016)

* Fix breakpoint support for Postgres
* HHVM now passes all tests

**0.6.1** (Tuesday, 21st June 2016)

* Fix rollback when only 1 migration

**0.6.0** (Tuesday, 21st June 2016)

* Backward incompatibility - see [UPGRADE_0.6](UPGRADE_0.6.md) document
* Introduce Input and Output access to migrations and template creation
* New breakpoint command
* Moved version history to this CHANGELOG.md document
* More tests

**0.5.5** (Friday, 17th May 2016)

* Fix support for running multiple seeders
* Bug fix for migration template source - defaults and command line
* Bug fixes

**0.5.4** (Monday, 25th April 2016)

* Added support for running multiple seeders
* Use `GLOB_BRACE` when finding migrations only if its available
* Added support for MySQL `VARBINARY` column type
* Minor bug fixes

**0.5.3** (Monday, 7th March 2016)

* Critical fix: allow `migration_name` to be `null`. Introduced in 0.5.2
* Status command now shows migration start and end times
* Bug fix for rolling back by date
* Documentation improvements

**0.5.2** (Tuesday, 1st March 2016)

* Status command now includes missing migration names
* Added support for Postgres table comments
* Added `insert()` for the TablePrefixAdapter
* Fixed the migration verbosity flag
* Added MySQL 5.7 JSON support
* Added support for MySQL `FULLTEXT` indexes
* Postgres now supports `BIGSERIAL` for primary keys
* Added support for MySQL index limits
* Initial support for multiple migration paths (using glob)
* Documentation improvements
* Unit test enhancements

**0.5.1** (Wednesday, 30th December 2015)

* **PHP 5.3 is no longer supported!**
* Add support for Symfony 3.0 components
* Ensure that the `status` command returns the correct exit code
* Allow `$version` to be passed into templates
* Support for MySQL `YEAR` column type
* Multiple documentation updates and corrections

**0.5.0** (Monday, 30th November 2015)

* Support for seeding data after database creation
* The migration and seed directories are now nested under `db` by default
* Moved `Phinx\Migration\Util` to `Phinx\Util\Util`
* All `insert()` methods now have a slightly different method signature
* Fixed key/insert operations for MySQL
* Introduced `AdapterInterface::hasIndexByName()`
* Improved `dropForeignKey()` handling for SQLite
* Added support for the MySQL `binary` datatype. BLOBs now use the proper type.
* The status command shows a count of pending migrations in JSON output
* We are now testing against PHP 7

**0.4.6** (Friday, 11th September 2015)

* You can now set custom migration templates in the config files
* Support for MySQL unsigned booleans
* Support for Postgres `smallint` column types
* Support for `AFTER` when using `changeColumn()` with MySQL
* Support for `precision` and `scale` when using the Postgres `decimal` type
* Fixed a bug where duplicate migration names could be used
* The schema table is now created with a primary key
* Fixed issues when using the MySQL `STRICT_TRANS_TABLE` mode
* Improved the docs in the default migration template
* Made Box PHAR ignore the bundled `phinx.yml` configuration file
* Updated Box installer URL
* Internal code improvements
* Documentation improvements

**0.4.5** (Tuesday, 1st September 2015)

* The rollback command now supports a date argument
* Fixed DBLIB DSN strings for Microsoft SQL Server
* Postgres support for `jsonb` columns added
* The `addTimestamps()` helper method no longer updates the `created_at` column
* Fix for Postgres named foreign keys
* Unit test improvements (including strict warnings)
* Documentation improvements

**0.4.4** (Sunday, 14th June 2015)

* The `change` method is now the default
* Added a generic adapter insert method. Warning: The implementation will change!
* Updated Symfony depdencies to ~2.7
* Support for MySQL `BLOB` column types
* SQLite migration fixes
* Documentation improvements

**0.4.3** (Monday, 23rd February 2015)

* Postgres bugfix for modifying column DEFAULTs
* MySQL bugfix for setting column INTEGER lengths
* SQLite bugfix for creating multiple indexes with similar names

**0.4.2.1** (Saturday, 7th February 2015)

* Proper release, updated docs

**0.4.2** (Friday, 6th February 2015)

* Postgres support for `json` columns added
* MySQL support for `enum` and `set` columns added
* Allow setting `identity` option on columns
* Template configuration and generation made more extensible
* Created a base class for `ProxyAdapter` and `TablePrefixAdapter`
* Switched to PSR-4

**0.4.1** (Tuesday, 23rd December 2014)

* MySQL support for reserved words in hasColumn and getColumns methods
* Better MySQL Adapter test coverage and performance fixes
* Updated dependent Symfony components to 2.6.x

**0.4.0** (Sunday, 14th December 2014)

* Adding initial support for running Phinx via a web interface
* Support for table prefixes and suffixes
* Bugfix for foreign key options
* MySQL keeps column default when renaming columns
* MySQL support for tiny/medium and longtext columns added
* Changed SQL Server binary columns to varbinary
* MySQL supports table comments
* Postgres supports column comments
* Empty strings are now supported for default column values
* Booleans are now supported for default column values
* Fixed SQL Server default constraint error when changing column types
* Migration timestamps are now created in UTC
* Locked Symfony Components to 2.5.0
* Support for custom migration base classes
* Cleaned up source code formatting
* Migrations have access to the output stream
* Support for custom PDO connections when a PHP config
* Added support for Postgres UUID type
* Fixed issue with Postgres dropping foreign keys

**0.3.8** (Sunday, 5th October 2014)

* Added new CHAR & Geospatial column types
* Added MySQL unix socket support
* Added precision & scale support for SQL Server
* Several bug fixes for SQLite
* Improved error messages
* Overall code optimizations
* Optimizations to MySQL hasTable method

**0.3.7** (Tuesday, 12th August 2014)

* Smarter configuration file support
* Support for Postgres Schemas
* Fixed charset support for Microsoft SQL Server
* Fix for Unique indexes in all adapters
* Improvements for MySQL foreign key migration syntax
* Allow MySQL column types with extra info
* Fixed SQLite autoincrement behaviour
* PHPDoc improvements
* Documentation improvements
* Unit test improvements
* Removing primary_key as a type

**0.3.6** (Sunday, 29th June 2014)

* Add custom adapter support
* Fix PHP 5.3 compatibility for SQL Server

**0.3.5** (Saturday, 21st June 2014)

* Added Microsoft SQL Server support
* Removed Primary Key column type
* Cleaned up and optimized many methods
* Updated Symfony dependencies to v2.5.0
* PHPDoc improvements

**0.3.4** (Sunday, 27th April 2014)

* Added support MySQL unsigned integer, biginteger, float and decimal types
* Added JSON output support for the status command
* Fix a bug where Postgres couldnt rollback foreign keys
* Moved Phinx type references to interface constants
* Fixed a bug with SQLite in-memory databases

**0.3.3** (Saturday, 22nd March 2014)

* Added support for JSON configuration
* Named index support for all adapters (thanks @archer308)
* Updated Composer dependencies
* Fix for SQLite Integer Type
* Fix for MySQL port option

**0.3.2** (Monday, 24th February 2014)

* Adding better Postgres type support

**0.3.1** (Sunday, 23rd February 2014)

* Adding MySQL charset support to the YAML config
* Removing trailing spaces

**0.3.0** (Sunday, 2nd February 2014)

* PSR-2 support
* Method to add timestamps easily to tables
* Support for column comments in the Postgres adapter
* Fixes for MySQL driver options
* Fixes for MySQL biginteger type

**0.2.9** (Saturday, 16th November 2013)

* Added SQLite Support
* Improving the unit tests, especially on Windows

**0.2.8** (Sunday, 25th August 2013)

* Added PostgresSQL Support

**0.2.7** (Saturday, 24th August 2013)

* Critical fix for a token parsing bug
* Removed legacy build system
* Improving docs

**0.2.6** (Saturday, 24th August 2013)

* Added support for environment vars in config files
* Added support for environment vars to set the Phinx Env
* Improving docs
* Fixed a bug with column names in indexes
* Changes for developers in regards to the unit tests

**0.2.5** (Sunday, 26th May 2013)

* Added support for Box Phar Archive Packaging
* Added support for MYSQL_ATTR driver options
* Fixed a bug where foreign keys cannot be removed
* Added support for MySQL table collation
* Updated Composer dependencies
* Removed verbosity options, now relies on Symfony instead
* Improved unit tests

**0.2.4** (Saturday, 20th April 2013)

* The Rollback command supports the verbosity parameter
* The Rollback command has more detailed output
* Table::dropForeignKey now returns the table instance

**0.2.3** (Saturday, 6th April 2013)

* Fixed a reporting bug when Phinx couldn't connect to a database
* Added support for the MySQL 'ON UPDATE' function
* Phinx timestamp is now mapped to MySQL timestamp instead of datetime
* Fixed a docs typo for the minimum PHP version
* Added UTF8 support for migrations
* Changed regex to handle migration names differently
* Added support for custom MySQL table engines such as MyISAM
* Added the change method to the migration template

**0.2.2** (Sunday, 3rd March 2013)

* Added a new verbosity parameter to see more output when migrating
* Support for PHP config files

**0.2.1** (Sunday, 3rd March 2013)

* Broken Release. Do not use!
* Unit tests no longer rely on the default phinx.yml file
* Running migrate for the first time does not give php warnings
* `default_migration_table` is now actually supported
* Updated docblocks to 2013.

**0.2.0** (Sunday, 13th January 2013)

* First Birthday Release
* Added Reversible Migrations
* Removed options parameter from AdapterInterface::hasColumn()

**0.1.7** (Tuesday, 8th January 2013)

* Improved documentation on the YAML configuration file
* Removed options parameter from AdapterInterface::dropIndex()

**0.1.6** (Sunday, 9th December 2012)

* Added foreign key support
* Removed PEAR support
* Support for auto_increment on custom id columns
* Bugfix for column default value 0
* Documentation improvements

**0.1.5** (Sunday, 4th November 2012)

* Added a test command
* Added transactions for adapters that support it
* Changing the Table API to use pending column methods
* Fixed a bug when defining multiple indexes on a table

**0.1.4** (Sunday, 21st October 2012)

* Documentation Improvements

**0.1.3** (Saturday, 20th October 2012)

* Fixed broken composer support

**0.1.2** (Saturday, 20th October 2012)

* Added composer support
* Now forces migrations to be in CamelCase format
* Now specifies the database name when migrating
* Creates the internal log table using its API instead of raw SQL

**0.1.1** (Wednesday, 13th June 2012)

* First point release. Ready for limited production use.

**0.1.0** (Friday, 13th January 2012)

* Initial public release.
