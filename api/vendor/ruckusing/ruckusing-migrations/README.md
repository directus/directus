# Introduction

Ruckusing is a framework written in PHP5 for generating and managing a set of "database migrations". Database migrations are declarative files which represent the state of a DB (its tables, columns, indexes, etc) at a particular state of time. By using database migrations, multiple developers can work on the same application and be guaranteed that the application is in a consistent state across all remote developer machines.

The idea of the framework was borrowed from the migration system built into Ruby on Rails. Any one who is familiar with Migrations in RoR will be immediately at home.

[![Build Status](https://secure.travis-ci.org/ruckus/ruckusing-migrations.png?branch=master)](http://travis-ci.org/ruckus/ruckusing-migrations)

## Getting Started & Documentation

See the [Wiki](https://github.com/ruckus/ruckusing-migrations/wiki) for the complete documentation on the migration methods supported and how to get started.

## Databases Supported

* Postgres
* MySQL
* Sqlite

## Features

* Portability: the migration files, which describe the tables, columns, indexes, etc to be created are themselves written in pure PHP5 which is then translated to the appropriate SQL at run-time. This allows one to transparently support any RDBMS with a single set of migration files (assuming there is an adapter for it, see below).

* "rake" like support for basic tasks. The framework has a concept of "tasks" (in fact the primary focus of the framework, migrations, is just a plain task) which are just basic PHP5 classes which implement an interface. Tasks can be freely written and as long as they adhere to a specific naming convention and implement a specific interface, the framework will automatically register them and allow them to be executed.

* The ability to go UP or DOWN to a specific migration state.

* Code generator for generating skeleton migration files.

* Support for module based migration directories where migrations files could be generated/run from specified module directories.

* Out-of-the-box support for basic tasks like initializing the DB schema info table (`db:setup`), asking for the current version (`db:version`) and dumping the current schema (`db:schema`).

# Limitations

* PHP 5.2+ is a hard requirement. The framework employes extensive use of object-oriented features of PHP5. There are no plans to make the framework backwards compatible.

## Configuration

* Copy `/path/to/ruckusing-migrations/config/database.inc.php` to `/path/to/mycodebase/ruckusing.conf.php` and update the `development` key with your DB credentials:

`type` is one of `pgsql`, `mysql`, `sqlite` depending on your database, as well `migrations_dir`, `db_dir`, `log_dir`, `ruckusing_base` paths.

* If you want to use module migration directories, Edit `/path/to/mycodebase/ruckusing.conf.php` and update  `migrations_dir` like `array('default' => '/default/path', 'module_name' => '/module/migration/path')` paths.

* Copy `/path/to/ruckusing-migrations/ruckus.php` to `/path/to/mycodebase/ruckus.php`.

### Custom Tasks

All tasks in `lib/Task` are enabled by default. If you would like to implement custom tasks then you can specify the directory
of your tasks in your over-ridden `ruckusing.conf.php` in the `tasks_dir` key:

```php
# ruckusing.conf.php

return array(
 /* ... snip ... */,
 'tasks_dir' => RUCKUSING_WORKING_BASE . '/custom_tasks'
);
```

## Generating Skeleton Migration files

From the top-level of your code base, run:

```
$ php ruckus.php db:generate create_users_table

Created OK
Created migration: 20121112163653_CreateUsersTable.php
```

Module migration directory example:

```
$ php ruckus.php db:generate create_items_table module=module_name

Created OK
Created migration: 20121112163653_CreateItemsTable.php
```

The generated file is in the `migrations` directory. Open up that file and you'll see it looks like:

```
class CreateUsersTable extends Ruckusing_Migration_Base {

	public function up() {

	}//up()

	public function down() {

	}//down()
}
```

All of the methods below are to be implemented in the `up()` and `down()` methods.

## Running Migrations

Run all pending migrations:

```
$ php ruckus.php db:migrate
```

Rollback the most recent migration:

```
$ php ruckus.php db:migrate VERSION=-1
```

Rollback to a specific migration (specify the timestamp in the filename of the migration to rollback to):

```
$ php ruckus.php db:migrate VERSION=20121114001742
```

## Overview of the migration methods available

The available methods are (brief list below, with detailed usageg further down):

## Database-level operations
* `create_database`
* `drop_database`

## Table-level operations
* `create_table`
* `drop_table`
* `rename_table`

## Column-level operations
* `add_column`
* `remove_column`
* `rename_column`
* `change_column`

## Index-level operations
* `add_index`
* `remove_index`

## Query execution
* `execute`
* `select_one`
* `select_all`


## Database-level Operations
There are two database-level operations, `create_database` and `drop_database`. Migrations that manipulate databases on this high of a level are used rarely.

### Creating a new Database

This command is slightly useless since normally you would be running your migrations against an existing database (created and setup with whatever your traditional RDMBS creation methods are). However, if you wanted to create another database from a migration, this method is available:

**Method Call**: `create_database`

**Parameters**
`name` : Name of the new database

Example:
```php
    $this->create_database("my_project");
```

### Removing a database
To completely remove a database and all of its tables (and data!).

**Method Call:** `drop_database`


**Parameters**
`name` : Name of the existing database

Example:
```php
    $this->drop_database("my_project");
```

This method is probably the most complex of all methods, but also one of the most widely used.

**Method Call:** `create_table`

**Parameters**

 `name` : Name of the new table

 `options` : (Optional) An associative array of options for creating the new table.

Supported option key/value pairs are:

`id` : Boolean - whether or not the framework should automatically generate a primary key. For MySQL the column will be called `id` and be of type integer with auto-incrementing.

`options` : A string representing finalization parameters that will be passed verbatim to the tail of the create table command. Often this is used to specify the storage engine for MySQL, e.g. 'options' => 'Engine=InnoDB'

**Assumptions**
Ultimately this method delegates to the appropriate RDMBS adapter and the MySQL adapter makes some important assumptions about the structure of the table.

## Table-level operations
The database migration framework offers a rich facility for creating, removing and renaming tables.

### Creating tables

A call to `$this->create_table(...)` actually returns a `TableDefinition` object. This method of the framework is one of the very few which actually returns a result that you must interact with (as and end user).

The steps for creating a new table are:
* Create the table with a name and any optional options and store the return value for later use:

```php
    $users = $this->create_table("users");
```

* Add columns to the table definition:
```php
    $users->column("first_name", "string");
    $users->column("last_name", "string");
```

* Call `finish()` to actually create the table with the definition and its columns:
```php
    $users->finish();
```

By default, the table type will be what your database defaults too. To specify a different table type (e.g. InnoDB), pass a key of `options` into the `$options` array, e.g.

**Example A:** Create a new InnoDB table called `users`.

```php
    $this->create_table('users', array('options' => 'Engine=InnoDB'));
```

* This command also assumes that you want an `id` column. This column does **not** need to be specified, it will be auto-generated, unless explicitly told not to via the `id` key in `$options` array.

**Example B:** Create a new table called `users` but do not automatically make a primary key.

```php
    $this->create_table('users', array('id' => false));
```

The primary key column will be created with attributes of `int(11) unsigned auto_increment`.

**Example C:** To specify your own primary key called 'guid':

```php
    $t = $this->create_table('users', array('id' => false, 'options' => 'Engine=InnoDB'));
    $t->column('guid', 'string', array('primary_key' => true, 'limit' => 64));
    $t->finish();
```

### Removing tables
Tables can be removed by using the `drop_table` method call. As might be expected, removing a table also removes all of its columns and any indexes.

**Method Call:** `drop_table`

**Arguments:**:
  `table_name`: The name of the table to remove.

**Example:**
```php
   $this->drop_table("users");
```

### Renaming tables
Tables can be renamed using the `rename_table` method.

**Method Call:** `rename_table`

*Arguments:*:
  `table_name`: The existing name of the table.
  `new_name`: The new name of the table.

**Example:**
```php
   // rename from "users" to "people"
   $this->rename_table("users", "people");
```


## Column-level operations

### Adding a new column to a table
For the complete documentation on adding new columns, please see [Adding Columns](https://github.com/ruckus/ruckusing-migrations/wiki/Adding-Columns)

### Removing Columns
Removing a database column is very simple, but keep in mind that any index associated with that column will also be removed.

**Method call:** `remove_column`

**Arguments**
  `table_name`: The name of the table from which the column will be removed.

  `column_name`: The column to be removed.

**Example A:**: Remove the `age` column from the `users` table.
```php
    $this->remove_column("users", "age");
```

### Renaming a column
Database columns can be renamed (assuming the underlying RDMBS/adapter supports it).

**Method call:** `rename_column`


**Arguments:**
  `table_name`: The name of table from which the column is to be renamed.

  `column_name`: The existing name of the column.

  `new_column_name`: The new name of the column.

**Example A:** From the `users` table, rename `first_name` to `fname`
```php
    $this->rename_column("users", "first_name", "fname");
```

## Modifying an existing column
The type, defaults or `NULL` support for existing columns can be modified. If you want to just rename a column then use the `rename_column` method. This method takes a generalized type for the column's type and also an array of options which affects the column definition. For the available types and options, see the documentation on adding new columns, AddingColumns.


**Method Call:** `change_column`

**Arguments:**
  `table_name`: The name of the table from which the column will be altered.

  `column_name`: The name of the column to change.

  `type`: The desired generalized type of the column.

  `options`: (Optional) An associative array of options for the column definition.

**Example A:** From the `users` table, change the length of the `first_name` column to 128.
```php
    $this->change_column("users", "first_name", "string", array('limit' => 128) );
```

## Index-level operations

Indexes can be created and removed using the framework methods.

### Adding a new index

*Method Call:* `add_index`

**Arguments:**
  `table`: The name of the table to add the index to.

  `column`: The column to create the index on. If this is a string, then it is presumed to be the name of the column, and the index will be a single-column index. If it is an array, then it is presumed to be a list of columns name and the index will then be a multi-column index, on the columns specified.

  `options`: (Optional) An associative array of options to control the index generation. Keys / Value pairs:

   `unique`: values: `true` or `false`. Whether or not create a unique index for this column. Defaults to `false`.

   `name` : values: user defined. The name of the index. If not specified, a default name will be generated based on the table and column name.

**Known Issues / Workarounds**: MySQL is currently limited to 64 characters for identifier names. When _add_index_ is used *without* specifying the name of the index, Ruckusing will generate a suitable name based on the table name and the column(s) being index. For example, if there is a _users_ table and an index is being generated on the _username_ column then the generated index name would be: _idx_users_username_ . If one is attempting to add a multi-column index then its very possible that the generated name would be longer than MySQL's limit of 64 characters. In such situations Ruckusing will raise an error suggesting you use a custom index name via the _name_ option parameter. See *Example C*.

**Example A:** Create an index on the `email` column in the `users` table.
```php
    $this->add_index("users", "email");
```

**Example B:** Create a unqiue index on the `ssn` column in the `users` table.
```php
    $this->add_index("users", "ssn", array('unique' => true)));
```

**Example C:** Create an index on the `blog_id` column in the `posts` table, but specify a specific name for the index.
```php
    $this->add_index("posts", "blog_id", array('name' => 'index_on_blog_id'));
```


**Example D:** Create a multi-column index on the `email` and `ssn` columns in the `users` table.
```php
    $this->add_index("users", array('email', 'ssn') );
```


### Removing an index
Easy enough. If the index was created using the sibling to this method (`add_index`) then one would need to just specify the same arguments to that method (but calling `remove_index`).

**Method Call:** `remove_index`

**Arguments:**
  `table_name`: The name of the table to remove the index from.

  `column_name`: The name of the column from which to remove the index from.

  `options`: (Optional) An associative array of options to control the index removal process. Key / Value pairs:
  `name` : values: user defined. The name of the index to remove. If not specified, a default name will be generated based on the table and column name. If during the index creation process (using the `add_index` method) and a `name` is specified then you will need to do the same here and specify the same name. Otherwise, the default name that is generated will likely not match with the actual name of the index.

**Example A:** Remove the (single-column) index from the `users` table on the `email` column.
```php
    $this->remove_index("users", "email");
```


**Example B:** Remove the (multi-column) index from the `users` table on the `email` and `ssn` columns.
```php
    $this->remove_index("users", array("email", "ssn") );
```


**Example C:** Remove the (single-column) named index from the `users` table on the `email` column.
```php
    $this->remove_index("users", "email", array('name' => "index_on_email_column") );
```


## Query Execution

Arbitrary query execution is available via a set of methods.

### Execute method

The `execute()` method is intended for queries which do not return any data, e.g. `INSERT`, `UPDATE` or `DELETE`.

**Example A:** Update all rows give some criteria
```php
    $this->execute("UPDATE foo SET name = 'bar' WHERE .... ");
```

### Queries that return results
For queries that return results, e.g. `SELECT` queries, then use either `select_one` or `select_all` depending on what you are returning.

Both of these methods return an associative array with each element of the array being itself another associative array of the column names and their values.

`select_one()` is intended for queries where you are expecting a single result set, and `select_all()` is intended for all other cases (where you might not necessarily know how many rows you will be getting).

**NOTE:** Since these methods take raw SQL queries as input, they might not necessarily be portable across all RDBMS.

**Example A (`select_one`):** Get the sum of of a column

```php
    $result = $this->select_one("SELECT SUM(total_price) AS total_price FROM orders");
    if($result) {
     echo "Your revenue is: " . $result['total_price'];
    }
```

**Example B (`select_all`): **: Get all rows and iterate over each one, performing some operation:
```php
    $result = $this->select_all("SELECT email, first_name, last_name FROM users WHERE created_at >= SUBDATE( NOW(), INTERVAL 7 DAY)");

    if($result) {
      echo "New customers: (" . count($result) . ")\n";
      foreach($result as $row) {
        printf("(%s) %s %s\n", $row['email'], $row['first_name'], $row['last_name']);
      }
    }
```

# Testing

The unit tests require phpunit to be installed: http://www.phpunit.de/manual/current/en/installation.html

## Running the complete test suite

```bash
$ vi config/database.inc.php
$ mysql -uroot -p < tests/test.sql
$ psql -Upostgres -f tests/test.sql
$ phpunit
```

Will run all test classes in `tests/unit`.

## Running a single test file

```bash
$ vi config/database.inc.php
$ mysql -uroot -p < tests/test.sql
$ phpunit tests/unit/MySQLAdapterTest.php
```
Some of the tests require a `mysql_test` or `pg_test` database configuration to be defined. If this is required and its not satisfied than the test will complain appropriately.


