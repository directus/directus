# Adapters

`Zend\Db\Adapter\Adapter` is the central object of the zend-db component. It is
responsible for adapting any code written in or for zend-db to the targeted PHP
extensions and vendor databases. In doing this, it creates an abstraction layer
for the PHP extensions in the `Driver` subnamespace of `Zend\Db\Adapter`.  It
also creates a lightweight "Platform" abstraction layer, for the various
idiosyncrasies that each vendor-specific platform might have in its SQL/RDBMS
implementation, separate from the driver implementations.

## Creating an adapter using configuration

Create an adapter by instantiating the `Zend\Db\Adapter\Adapter` class. The most
common use case, while not the most explicit, is to pass an array of
configuration to the `Adapter`:

```php
use Zend\Db\Adapter\Adapter;

$adapter = new Adapter($configArray);
```

This driver array is an abstraction for the extension level required parameters.
Here is a table for the key-value pairs that should be in configuration array.

Key        | Is Required?           | Value
---------- | ---------------------- | -----
`driver`   | required               | `Mysqli`, `Sqlsrv`, `Pdo_Sqlite`, `Pdo_Mysql`, `Pdo`(= Other PDO Driver)
`database` | generally required     | the name of the database (schema)
`username` | generally required     | the connection username
`password` | generally required     | the connection password
`hostname` | not generally required | the IP address or hostname to connect to
`port`     | not generally required | the port to connect to (if applicable)
`charset`  | not generally required | the character set to use

> ### Options are adapter-dependent
>
> Other names will work as well. Effectively, if the PHP manual uses a
> particular naming, this naming will be supported by the associated driver. For
> example, `dbname` in most cases will also work for 'database'.  Another
> example is that in the case of `Sqlsrv`, `UID` will work in place of
> `username`. Which format you choose is up to you, but the above table
> represents the official abstraction names.

For example, a MySQL connection using ext/mysqli:

```php
$adapter = new Zend\Db\Adapter\Adapter([
    'driver'   => 'Mysqli',
    'database' => 'zend_db_example',
    'username' => 'developer',
    'password' => 'developer-password',
]);
```

Another example, of a Sqlite connection via PDO:

```php
$adapter = new Zend\Db\Adapter\Adapter([
    'driver'   => 'Pdo_Sqlite',
    'database' => 'path/to/sqlite.db',
]);
```

It is important to know that by using this style of adapter creation, the
`Adapter` will attempt to create any dependencies that were not explicitly
provided. A `Driver` object will be created from the configuration array
provided in the constructor. A `Platform` object will be created based off the
type of `Driver` class that was instantiated. And lastly, a default `ResultSet`
object is created and utilized. Any of these objects can be injected, to do
this, see the next section.

The list of officially supported drivers:

- `IbmDb2`: The ext/ibm_db2 deriver
- `Mysqli`: The ext/mysqli driver
- `Oci8`: The ext/oci8 driver
- `Pgsql`: The ext/pgsql driver
- `Sqlsrv`: The ext/sqlsrv driver (from Microsoft)
- `Pdo_Mysql`: MySQL via the PDO extension
- `Pdo_Sqlite`: SQLite via the PDO extension
- `Pdo_Pgsql`: PostgreSQL via the PDO extension

## Creating an adapter using dependency injection

The more expressive and explicit way of creating an adapter is by injecting all
your dependencies up front. `Zend\Db\Adapter\Adapter` uses constructor
injection, and all required dependencies are injected through the constructor,
which has the following signature (in pseudo-code):

```php
use Zend\Db\Adapter\Platform\PlatformInterface;
use Zend\Db\ResultSet\ResultSet;

class Zend\Db\Adapter\Adapter
{
    public function __construct(
        $driver,
        PlatformInterface $platform = null,
        ResultSet $queryResultSetPrototype = null
    );
}
```

What can be injected:

- `$driver`: an array of connection parameters (see above) or an instance of
  `Zend\Db\Adapter\Driver\DriverInterface`.
- `$platform` (optional): an instance of `Zend\Db\Platform\PlatformInterface`;
  the default will be created based off the driver implementation.
- `$queryResultSetPrototype` (optional): an instance of
  `Zend\Db\ResultSet\ResultSet`; to understand this object's role, see the
  section below on querying.

## Query Preparation

By default, `Zend\Db\Adapter\Adapter::query()` prefers that you use
"preparation" as a means for processing SQL statements.  This generally means
that you will supply a SQL statement containing placeholders for the values, and
separately provide substitutions for those placeholders. As an example:

```php
$adapter->query('SELECT * FROM `artist` WHERE `id` = ?', [5]);
```

The above example will go through the following steps:

- create a new `Statement` object.
- prepare the array `[5]` into a `ParameterContainer` if necessary.
- inject the `ParameterContainer` into the `Statement` object.
- execute the `Statement` object, producing a `Result` object.
- check the `Result` object to check if the supplied SQL was a result set
  producing statement:
    - if the query produced a result set, clone the `ResultSet` prototype,
      inject the `Result` as its datasource, and return the new `ResultSet`
      instance.
    - otherwise, return the `Result`.

## Query Execution

In some cases, you have to execute statements directly without preparation. One
possible reason for doing so would be to execute a DDL statement, as most
extensions and RDBMS systems are incapable of preparing such statements.

To execute a query without the preparation step, you will need to pass a flag as
the second argument indicating execution is required:

```php
$adapter->query(
    'ALTER TABLE ADD INDEX(`foo_index`) ON (`foo_column`)',
    Adapter::QUERY_MODE_EXECUTE
);
```

The primary difference to notice is that you must provide the
`Adapter::QUERY_MODE_EXECUTE` (execute) flag as the second parameter.

## Creating Statements

While `query()` is highly useful for one-off and quick querying of a database
via the `Adapter`, it generally makes more sense to create a statement and
interact with it directly, so that you have greater control over the
prepare-then-execute workflow. To do this, `Adapter` gives you a routine called
`createStatement()` that allows you to create a `Driver` specific `Statement` to
use so you can manage your own prepare-then-execute workflow.

```php
// with optional parameters to bind up-front:
$statement = $adapter->createStatement($sql, $optionalParameters);
$result    = $statement->execute();
```

## Using the Driver Object

The `Driver` object is the primary place where `Zend\Db\Adapter\Adapter`
implements the connection level abstraction specific to a given extension.  To
make this possible, each driver is composed of 3 objects:

- A connection: `Zend\Db\Adapter\Driver\ConnectionInterface`
- A statement: `Zend\Db\Adapter\Driver\StatementInterface`
- A result: `Zend\Db\Adapter\Driver\ResultInterface`

Each of the built-in drivers practice "prototyping" as a means of creating
objects when new instances are requested. The workflow looks like this:

- An adapter is created with a set of connection parameters.
- The adapter chooses the proper driver to instantiate (for example,
  `Zend\Db\Adapter\Driver\Mysqli`)
- That driver class is instantiated.
- If no connection, statement, or result objects are injected, defaults are
  instantiated.

This driver is now ready to be called on when particular workflows are
requested. Here is what the `Driver` API looks like:

```php
namespace Zend\Db\Adapter\Driver;

interface DriverInterface
{
    const PARAMETERIZATION_POSITIONAL = 'positional';
    const PARAMETERIZATION_NAMED = 'named';
    const NAME_FORMAT_CAMELCASE = 'camelCase';
    const NAME_FORMAT_NATURAL = 'natural';

    public function getDatabasePlatformName(string $nameFormat = self::NAME_FORMAT_CAMELCASE) : string;
    public function checkEnvironment() : bool;
    public function getConnection() : ConnectionInterface;
    public function createStatement(string|resource $sqlOrResource = null) : StatementInterface;
    public function createResult(resource $resource) : ResultInterface;
    public function getPrepareType() :string;
    public function formatParameterName(string $name, $type = null) : string;
    public function getLastGeneratedValue() : mixed;
}
```

From this `DriverInterface`, you can

- Determine the name of the platform this driver supports (useful for choosing
  the proper platform object).
- Check that the environment can support this driver.
- Return the `Connection` instance.
- Create a `Statement` instance which is optionally seeded by an SQL statement
  (this will generally be a clone of a prototypical statement object).
- Create a `Result` object which is optionally seeded by a statement resource
  (this will generally be a clone of a prototypical result object)
- Format parameter names; this is important to distinguish the difference
  between the various ways parameters are named between extensions
- Retrieve the overall last generated value (such as an auto-increment value).

Now let's turn to the `Statement` API:

```php
namespace Zend\Db\Adapter\Driver;

interface StatementInterface extends StatementContainerInterface
{
    public function getResource() : resource;
    public function prepare($sql = null) : void;
    public function isPrepared() : bool;
    public function execute(null|array|ParameterContainer $parameters = null) : ResultInterface;

    /** Inherited from StatementContainerInterface */
    public function setSql(string $sql) : void;
    public function getSql() : string;
    public function setParameterContainer(ParameterContainer $parameterContainer) : void;
    public function getParameterContainer() : ParameterContainer;
}
```

And finally, the `Result` API:

```php
namespace Zend\Db\Adapter\Driver;

use Countable;
use Iterator;

interface ResultInterface extends Countable, Iterator
{
    public function buffer() : void;
    public function isQueryResult() : bool;
    public function getAffectedRows() : int;
    public function getGeneratedValue() : mixed;
    public function getResource() : resource;
    public function getFieldCount() : int;
}
```

## Using The Platform Object

The `Platform` object provides an API to assist in crafting queries in a way
that is specific to the SQL implementation of a particular vendor. The object
handles nuances such as how identifiers or values are quoted, or what the
identifier separator character is. To get an idea of the capabilities, the
interface for a platform object looks like this:

```php
namespace Zend\Db\Adapter\Platform;

interface PlatformInterface
{
    public function getName() : string;
    public function getQuoteIdentifierSymbol() : string;
    public function quoteIdentifier(string $identifier) : string;
    public function quoteIdentifierChain(string|string[] $identiferChain) : string;
    public function getQuoteValueSymbol() : string;
    public function quoteValue(string $value) : string;
    public function quoteTrustedValue(string $value) : string;
    public function quoteValueList(string|string[] $valueList) : string;
    public function getIdentifierSeparator() : string;
    public function quoteIdentifierInFragment(string $identifier, array $additionalSafeWords = []) : string;
}
```

While you can directly instantiate a `Platform` object, generally speaking, it
is easier to get the proper `Platform` instance from the configured adapter (by
default the `Platform` type will match the underlying driver implementation):

```php
$platform = $adapter->getPlatform();

// or
$platform = $adapter->platform; // magic property access
```

The following are examples of `Platform` usage:

```php
// $adapter is a Zend\Db\Adapter\Adapter instance;
// $platform is a Zend\Db\Adapter\Platform\Sql92 instance.
$platform = $adapter->getPlatform();

// "first_name"
echo $platform->quoteIdentifier('first_name');

// "
echo $platform->getQuoteIdentifierSymbol();

// "schema"."mytable"
echo $platform->quoteIdentifierChain(['schema', 'mytable']);

// '
echo $platform->getQuoteValueSymbol();

// 'myvalue'
echo $platform->quoteValue('myvalue');

// 'value', 'Foo O\\'Bar'
echo $platform->quoteValueList(['value', "Foo O'Bar"]);

// .
echo $platform->getIdentifierSeparator();

// "foo" as "bar"
echo $platform->quoteIdentifierInFragment('foo as bar');

// additionally, with some safe words:
// ("foo"."bar" = "boo"."baz")
echo $platform->quoteIdentifierInFragment('(foo.bar = boo.baz)', ['(', ')', '=']);
```

## Using The Parameter Container

The `ParameterContainer` object is a container for the various parameters that
need to be passed into a `Statement` object to fulfill all the various
parameterized parts of the SQL statement. This object implements the
`ArrayAccess` interface. Below is the `ParameterContainer` API:

```php
namespace Zend\Db\Adapter;

use ArrayAccess;
use ArrayIterator;
use Countable;
use Iterator;

class ParameterContainer implements Iterator, ArrayAccess, Countable
{
    public function __construct(array $data = [])
    
    /** methods to interact with values */
    public function offsetExists(string|int $name) : bool;
    public function offsetGet(string|int $name) : mixed;
    public function offsetSetReference(string|int $name, string|int $from) : void;
    public function offsetSet(string|int $name, mixed $value, mixed $errata = null, int $maxLength = null) : void;
    public function offsetUnset(string|int $name) : void;
    
    /** set values from array (will reset first) */
    public function setFromArray(array $data) : ParameterContainer;
    
    /** methods to interact with value errata */
    public function offsetSetErrata(string|int $name, mixed $errata) : void;
    public function offsetGetErrata(string|int $name) : mixed;
    public function offsetHasErrata(string|int $name) : bool;
    public function offsetUnsetErrata(string|int $name) : void;
    
    /** errata only iterator */
    public function getErrataIterator() : ArrayIterator;
    
    /** get array with named keys */
    public function getNamedArray() : array;
    
    /** get array with int keys, ordered by position */
    public function getPositionalArray() : array;
    
    /** iterator: */
    public function count() : int;
    public function current() : mixed;
    public function next() : mixed;
    public function key() : string|int;
    public function valid() : bool;
    public function rewind() : void;
    
    /** merge existing array of parameters with existing parameters */
    public function merge(array $parameters) : ParameterContainer;
}
```

In addition to handling parameter names and values, the container will assist in
tracking parameter types for PHP type to SQL type handling. For example, it
might be important that:

```php
$container->offsetSet('limit', 5);
```

be bound as an integer. To achieve this, pass in the
`ParameterContainer::TYPE_INTEGER` constant as the 3rd parameter:

```php
$container->offsetSet('limit', 5, $container::TYPE_INTEGER);
```

This will ensure that if the underlying driver supports typing of bound
parameters, that this translated information will also be passed along to the
actual php database driver.

## Examples

Creating a `Driver`, a vendor-portable query, and preparing and iterating the
result:

```php
$adapter = new Zend\Db\Adapter\Adapter($driverConfig);

$qi = function ($name) use ($adapter) {
    return $adapter->platform->quoteIdentifier($name);
};
$fp = function ($name) use ($adapter) {
    return $adapter->driver->formatParameterName($name);
};

$sql = 'UPDATE ' . $qi('artist')
    . ' SET ' . $qi('name') . ' = ' . $fp('name')
    . ' WHERE ' . $qi('id') . ' = ' . $fp('id');

$statement = $adapter->query($sql);

$parameters = [
    'name' => 'Updated Artist',
    'id'   => 1,
];

$statement->execute($parameters);

// DATA INSERTED, NOW CHECK

$statement = $adapter->query(
    'SELECT * FROM '
    . $qi('artist')
    . ' WHERE id = ' . $fp('id')
);

$results = $statement->execute(['id' => 1]);

$row = $results->current();
$name = $row['name'];
```
