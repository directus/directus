# Table Gateways

The Table Gateway subcomponent provides an object-oriented representation of a
datbase table; its methods mirror the most common table operations. In code,
the interface resembles:

```php
namespace Zend\Db\TableGateway;

use Zend\Db\ResultSet\ResultSetInterface;
use Zend\Db\Sql\Where;

interface TableGatewayInterface
{
    public function getTable() : string;
    public function select(Where|callable|string|array $where = null) : ResultSetInterface;
    public function insert(array $set) : int;
    public function update(
        array $set,
        Where|callable|string|array $where = null,
        array $joins = null
    ) : int;
    public function delete(Where|callable|string|array $where) : int;
}
```

There are two primary implementations of the `TableGatewayInterface`,
`AbstractTableGateway` and `TableGateway`. The `AbstractTableGateway` is an
abstract basic implementation that provides functionality for `select()`,
`insert()`, `update()`, `delete()`, as well as an additional API for doing
these same kinds of tasks with explicit `Zend\Db\Sql` objects: `selectWith()`,
`insertWith()`, `updateWith()`, and `deleteWith()`. In addition,
AbstractTableGateway also implements a "Feature" API, that allows for expanding
the behaviors of the base `TableGateway` implementation without having to
extend the class with this new functionality.  The `TableGateway` concrete
implementation simply adds a sensible constructor to the `AbstractTableGateway`
class so that out-of-the-box, `TableGateway` does not need to be extended in
order to be consumed and utilized to its fullest.

## Quick start

The following example uses `Zend\Db\TableGateway\TableGateway`, which defines
the following API:

```php
namespace Zend\Db\TableGateway;

use Zend\Db\Adapter\AdapterInterface;
use Zend\Db\ResultSet\ResultSet;
use Zend\Db\ResultSet\ResultSetInterface;
use Zend\Db\Sql;
use Zend\Db\Sql\TableIdentifier;

class TableGateway extends AbstractTableGateway
{
    public $lastInsertValue;
    public $table;
    public $adapter;

    public function __construct(
        string|TableIdentifier $table,
        AdapterInterface $adapter,
        Feature\AbstractFeature|Feature\FeatureSet|Feature\AbstractFeature[] $features = null,
        ResultSetInterface $resultSetPrototype = null,
        Sql\Sql $sql = null
    );

    /** Inherited from AbstractTableGateway */

    public function isInitialized() : bool;
    public function initialize() : void;
    public function getTable() : string;
    public function getAdapter() : AdapterInterface;
    public function getColumns() : array;
    public function getFeatureSet() Feature\FeatureSet;
    public function getResultSetPrototype() : ResultSetInterface;
    public function getSql() | Sql\Sql;
    public function select(Sql\Where|callable|string|array $where = null) : ResultSetInterface;
    public function selectWith(Sql\Select $select) : ResultSetInterface;
    public function insert(array $set) : int;
    public function insertWith(Sql\Insert $insert) | int;
    public function update(
        array $set,
        Sql\Where|callable|string|array $where = null,
        array $joins = null
    ) : int;
    public function updateWith(Sql\Update $update) : int;
    public function delete(Sql\Where|callable|string|array $where) : int;
    public function deleteWith(Sql\Delete $delete) : int;
    public function getLastInsertValue() : int;
}
```

The concrete `TableGateway` object uses constructor injection for getting
dependencies and options into the instance. The table name and an instance of
an `Adapter` are all that is required to create an instance.

Out of the box, this implementation makes no assumptions about table structure
or metadata, and when `select()` is executed, a simple `ResultSet` object with
the populated `Adapter`'s `Result` (the datasource) will be returned and ready
for iteration.

```php
use Zend\Db\TableGateway\TableGateway;

$projectTable = new TableGateway('project', $adapter);
$rowset = $projectTable->select(['type' => 'PHP']);

echo 'Projects of type PHP: ' . PHP_EOL;
foreach ($rowset as $projectRow) {
    echo $projectRow['name'] . PHP_EOL;
}

// Or, when expecting a single row:
$artistTable = new TableGateway('artist', $adapter);
$rowset      = $artistTable->select(['id' => 2]);
$artistRow   = $rowset->current();

var_dump($artistRow);
```

The `select()` method takes the same arguments as
`Zend\Db\Sql\Select::where()`; arguments will be passed to the `Select`
instance used to build the SELECT query. This means the following is possible:

```php
use Zend\Db\TableGateway\TableGateway;
use Zend\Db\Sql\Select;

$artistTable = new TableGateway('artist', $adapter);

// Search for at most 2 artists who's name starts with Brit, ascending:
$rowset = $artistTable->select(function (Select $select) {
    $select->where->like('name', 'Brit%');
    $select->order('name ASC')->limit(2);
});
```

## TableGateway Features

The Features API allows for extending the functionality of the base
`TableGateway` object without having to polymorphically extend the base class.
This allows for a wider array of possible mixing and matching of features to
achieve a particular behavior that needs to be attained to make the base
implementation of `TableGateway` useful for a particular problem.

With the `TableGateway` object, features should be injected though the
constructor. The constructor can take features in 3 different forms:

- as a single `Feature` instance
- as a `FeatureSet` instance
- as an array of `Feature` instances

There are a number of features built-in and shipped with zend-db:

- `GlobalAdapterFeature`: the ability to use a global/static adapter without
  needing to inject it into a `TableGateway` instance. This is only useful when
  you are extending the `AbstractTableGateway` implementation:

    ```php
    use Zend\Db\TableGateway\AbstractTableGateway;
    use Zend\Db\TableGateway\Feature;
    
    class MyTableGateway extends AbstractTableGateway
    {
        public function __construct()
        {
            $this->table      = 'my_table';
            $this->featureSet = new Feature\FeatureSet();
            $this->featureSet->addFeature(new Feature\GlobalAdapterFeature());
            $this->initialize();
        }
    }
    
    // elsewhere in code, in a bootstrap
    Zend\Db\TableGateway\Feature\GlobalAdapterFeature::setStaticAdapter($adapter);
    
    // in a controller, or model somewhere
    $table = new MyTableGateway(); // adapter is statically loaded
    ```

- `MasterSlaveFeature`: the ability to use a master adapter for `insert()`,
  `update()`, and `delete()`, but switch to a slave adapter for all `select()`
  operations.

    ```php
    $table = new TableGateway('artist', $adapter, new Feature\MasterSlaveFeature($slaveAdapter));
    ```

- `MetadataFeature`: the ability populate `TableGateway` with column
  information from a `Metadata` object. It will also store the primary key
  information in case the `RowGatewayFeature` needs to consume this information.

    ```php
    $table = new TableGateway('artist', $adapter, new Feature\MetadataFeature());
    ```

- `EventFeature`: the ability to compose a
  [zend-eventmanager](https://github.com/zendframework/zend-eventmanager)
  `EventManager` instance within your `TableGateway` instance, and attach
  listeners to the various events of its lifecycle.

    ```php
    $table = new TableGateway('artist', $adapter, new Feature\EventFeature($eventManagerInstance));
    ```

- `RowGatewayFeature`: the ability for `select()` to return a `ResultSet` object that upon iteration
  will return a `RowGateway` instance for each row.

    ```php
    $table   = new TableGateway('artist', $adapter, new Feature\RowGatewayFeature('id'));
    $results = $table->select(['id' => 2]);
    
    $artistRow       = $results->current();
    $artistRow->name = 'New Name';
    $artistRow->save();
    ```
