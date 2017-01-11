# Result Sets

`Zend\Db\ResultSet` is a sub-component of zend-db for abstracting the iteration
of results returned from queries producing rowsets. While data sources for this
can be anything that is iterable, generally these will be populated from
`Zend\Db\Adapter\Driver\ResultInterface` instances.

Result sets must implement the `Zend\Db\ResultSet\ResultSetInterface`, and all
sub-components of zend-db that return a result set as part of their API will
assume an instance of a `ResultSetInterface` should be returned. In most casts,
the prototype pattern will be used by consuming object to clone a prototype of
a `ResultSet` and return a specialized `ResultSet` with a specific data source
injected. `ResultSetInterface` is defined as follows:

```php
use Countable;
use Traversable;

interface ResultSetInterface extends Traversable, Countable
{
    public function initialize(mixed $dataSource) : void;
    public function getFieldCount() : int;
}
```

## Quick start

`Zend\Db\ResultSet\ResultSet` is the most basic form of a `ResultSet` object
that will expose each row as either an `ArrayObject`-like object or an array of
row data. By default, `Zend\Db\Adapter\Adapter` will use a prototypical
`Zend\Db\ResultSet\ResultSet` object for iterating when using the
`Zend\Db\Adapter\Adapter::query()` method.

The following is an example workflow similar to what one might find inside
`Zend\Db\Adapter\Adapter::query()`:

```php
use Zend\Db\Adapter\Driver\ResultInterface;
use Zend\Db\ResultSet\ResultSet;

$statement = $driver->createStatement('SELECT * FROM users');
$statement->prepare();
$result = $statement->execute($parameters);

if ($result instanceof ResultInterface && $result->isQueryResult()) {
    $resultSet = new ResultSet;
    $resultSet->initialize($result);

    foreach ($resultSet as $row) {
        echo $row->my_column . PHP_EOL;
    }
}
```

## Zend\\Db\\ResultSet\\ResultSet and Zend\\Db\\ResultSet\\AbstractResultSet

For most purposes, either an instance of `Zend\Db\ResultSet\ResultSet` or a
derivative of `Zend\Db\ResultSet\AbstractResultSet` will be used. The
implementation of the `AbstractResultSet` offers the following core
functionality:

```php
namespace Zend\Db\ResultSet;

use Iterator;

abstract class AbstractResultSet implements Iterator, ResultSetInterface
{
    public function initialize(array|Iterator|IteratorAggregate|ResultInterface $dataSource) : self;
    public function getDataSource() : Iterator|IteratorAggregate|ResultInterface;
    public function getFieldCount() : int;

    /** Iterator */
    public function next() : mixed;
    public function key() : string|int;
    public function current() : mixed;
    public function valid() : bool;
    public function rewind() : void;

    /** countable */
    public function count() : int;

    /** get rows as array */
    public function toArray() : array;
}
```

## Zend\\Db\\ResultSet\\HydratingResultSet

`Zend\Db\ResultSet\HydratingResultSet` is a more flexible `ResultSet` object
that allows the developer to choose an appropriate "hydration strategy" for
getting row data into a target object.  While iterating over results,
`HydratingResultSet` will take a prototype of a target object and clone it once
for each row. The `HydratingResultSet` will then hydrate that clone with the
row data.

The `HydratingResultSet` depends on
[zend-hydrator](https://zendframework.github.io/zend-hydrator), which you will
need to install:

```bash
$ composer require zendframework/zend-hydrator
```

In the example below, rows from the database will be iterated, and during
iteration, `HydratingResultSet` will use the `Reflection` based hydrator to
inject the row data directly into the protected members of the cloned
`UserEntity` object:

```php
use Zend\Db\Adapter\Driver\ResultInterface;
use Zend\Db\ResultSet\HydratingResultSet;
use Zend\Hydrator\Reflection as ReflectionHydrator;

class UserEntity
{
    protected $first_name;
    protected $last_name;

    public function getFirstName()
    {
        return $this->first_name;
    }

    public function getLastName()
    {
        return $this->last_name;
    }

    public function setFirstName($firstName)
    {
        $this->first_name = $firstName;
    }

    public function setLastName($lastName)
    {
        $this->last_name = $lastName;
    }
}

$statement = $driver->createStatement($sql);
$statement->prepare($parameters);
$result = $statement->execute();

if ($result instanceof ResultInterface && $result->isQueryResult()) {
    $resultSet = new HydratingResultSet(new ReflectionHydrator, new UserEntity);
    $resultSet->initialize($result);

    foreach ($resultSet as $user) {
        echo $user->getFirstName() . ' ' . $user->getLastName() . PHP_EOL;
    }
}
```

For more information, see the [zend-hydrator](https://zendframework.github.io/zend-hydrator/)
documentation to get a better sense of the different strategies that can be
employed in order to populate a target object.
