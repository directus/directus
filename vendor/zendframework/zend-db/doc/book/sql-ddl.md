# DDL Abstraction

`Zend\Db\Sql\Ddl` is a sub-component of `Zend\Db\Sql` allowing creation of DDL
(Data Definition Language) SQL statements. When combined with a platform
specific `Zend\Db\Sql\Sql` object, DDL objects are capable of producing
platform-specific `CREATE TABLE` statements, with specialized data types,
constraints, and indexes for a database/schema.

The following platforms have platform specializations for DDL:

- MySQL
- All databases compatible with ANSI SQL92

## Creating Tables

Like `Zend\Db\Sql` objects, each statement type is represented by a class. For
example, `CREATE TABLE` is modeled by the `CreateTable` class; this is likewise
the same for `ALTER TABLE` (as `AlterTable`), and `DROP TABLE` (as
`DropTable`). You can create instances using a number of approaches:

```php
use Zend\Db\Sql\Ddl;

$table = new Ddl\CreateTable();

// With a table name:
$table = new Ddl\CreateTable('bar');

// Optionally, as a temporary table:
$table = new Ddl\CreateTable('bar', true);
```

You can also set the table after instantiation:

```php
$table->setTable('bar');
```

Currently, columns are added by creating a column object (described in the
[data type table below](#currently-supported-data-types)):

```php
use Zend\Db\Sql\Ddl\Column;

$table->addColumn(new Column\Integer('id'));
$table->addColumn(new Column\Varchar('name', 255));
```

Beyond adding columns to a table, you may also add constraints:

```php
use Zend\Db\Sql\Ddl\Constraint;

$table->addConstraint(new Constraint\PrimaryKey('id'));
$table->addConstraint(
    new Constraint\UniqueKey(['name', 'foo'], 'my_unique_key')
);
```

## Altering Tables

Similar to `CreateTable`, you may also use `AlterTable` instances:

```php
use Zend\Db\Sql\Ddl;

$table = new Ddl\AlterTable();

// With a table name:
$table = new Ddl\AlterTable('bar');

// Optionally, as a temporary table:
$table = new Ddl\AlterTable('bar', true);
```

The primary difference between a `CreateTable` and `AlterTable` is that the
`AlterTable` takes into account that the table and its assets already exist.
Therefore, while you still have `addColumn()` and `addConstraint()`, you will
also have the ability to *alter* existing columns:

```php
use Zend\Db\Sql\Ddl\Column;

$table->changeColumn('name', Column\Varchar('new_name', 50));
```

You may also *drop* existing columns or constraints:

```php
$table->dropColumn('foo');
$table->dropConstraint('my_index');
```

## Dropping Tables

To drop a table, create a `DropTable` instance:

```php
$drop = new Ddl\DropTable('bar');
```

## Executing DDL Statements

After a DDL statement object has been created and configured, at some point you
will need to execute the statement. This requires an `Adapter` instance and a
properly seeded `Sql` instance.

The workflow looks something like this, with `$ddl` being a `CreateTable`,
`AlterTable`, or `DropTable` instance:

```php
use Zend\Db\Sql\Sql;

// Existence of $adapter is assumed.
$sql = new Sql($adapter);

$adapter->query(
    $sql->getSqlStringForSqlObject($ddl),
    $adapter::QUERY_MODE_EXECUTE
);
```

By passing the `$ddl` object through the `$sql` instance's
`getSqlStringForSqlObject()` method, we ensure that any platform specific
specializations/modifications are utilized to create a platform specific SQL
statement.

Next, using the constant `Zend\Db\Adapter\Adapter::QUERY_MODE_EXECUTE` ensures
that the SQL statement is not prepared, as most DDL statements on most
platforms cannot be prepared, only executed.

## Currently Supported Data Types

These types exist in the `Zend\Db\Sql\Ddl\Column` namespace. Data types must
implement `Zend\Db\Sql\Ddl\Column\ColumnInterface`.

In alphabetical order:

Type             | Arguments For Construction
-----------------|---------------------------
BigInteger       | `$name`, `$nullable = false`, `$default = null`, `array $options = array()`
Blob             | `$name`, `$length`, `nullable = false`, `$default = null`, `array $options = array()`
Boolean          | `$name`
Char             | `$name`, `length`
Column (generic) | `$name = null`
Date             | `$name`
Decimal          | `$name`, `$precision`, `$scale = null`
Float            | `$name`, `$digits`, `$decimal` (Note: this class is deprecated as of 2.4.0; use Floating instead)
Floating         | `$name`, `$digits`, `$decimal`
Integer          | `$name`, `$nullable = false`, `default = null`, `array $options = array()`
Text             | `$name`, `$length`, `nullable = false`, `$default = null`, `array $options = array()`
Time             | `$name`
Varchar          | `$name`, `$length`

Each of the above types can be utilized in any place that accepts a `Column\ColumnInterface`
instance. Currently, this is primarily in `CreateTable::addColumn()` and `AlterTable`'s
`addColumn()` and `changeColumn()` methods.

## Currently Supported Constraint Types

These types exist in the `Zend\Db\Sql\Ddl\Constraint` namespace. Data types
must implement `Zend\Db\Sql\Ddl\Constraint\ConstraintInterface`.

In alphabetical order:

Type       | Arguments For Construction
-----------|---------------------------
Check      | `$expression`, `$name`
ForeignKey | `$name`, `$column`, `$referenceTable`, `$referenceColumn`, `$onDeleteRule = null`, `$onUpdateRule = null`
PrimaryKey | `$columns`
UniqueKey  | `$column`, `$name = null`

Each of the above types can be utilized in any place that accepts a
`Column\ConstraintInterface` instance. Currently, this is primarily in
`CreateTable::addConstraint()` and `AlterTable::addConstraint()`.
