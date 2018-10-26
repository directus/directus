# Row Gateways

`Zend\Db\RowGateway` is a sub-component of zend-db that implements the Row Data
Gateway pattern described in the book [Patterns of Enterprise Application
Architecture](http://www.martinfowler.com/books/eaa.html). Row Data Gateways
model individual rows of a database table, and provide methods such as `save()`
and `delete()` that persist the row to the database. Likewise, after a row from
the database is retrieved, it can then be manipulated and `save()`'d back to
the database in the same position (row), or it can be `delete()`'d from the
table.

`RowGatewayInterface` defines the methods `save()` and `delete()`:

```php
namespace Zend\Db\RowGateway;

interface RowGatewayInterface
{
    public function save();
    public function delete();
}
```

## Quick start

`RowGateway` is generally used in conjunction with objects that produce
`Zend\Db\ResultSet`s, though it may also be used standalone.  To use it
standalone, you need an `Adapter` instance and a set of data to work with.

The following demonstrates a basic use case.

```php
use Zend\Db\RowGateway\RowGateway;

// Query the database:
$resultSet = $adapter->query('SELECT * FROM `user` WHERE `id` = ?', [2]);

// Get array of data:
$rowData = $resultSet->current()->getArrayCopy();

// Create a row gateway:
$rowGateway = new RowGateway('id', 'my_table', $adapter);
$rowGateway->populate($rowData, true);

// Manipulate the row and persist it:
$rowGateway->first_name = 'New Name';
$rowGateway->save();

// Or delete this row:
$rowGateway->delete();
```

The workflow described above is greatly simplified when `RowGateway` is used in
conjunction with the [TableGateway RowGatewayFeature](table-gateway.md#tablegateway-features).
In that paradigm, `select()` operations will produce a `ResultSet` that iterates
`RowGateway` instances.

As an example:

```php
use Zend\Db\TableGateway\Feature\RowGatewayFeature;
use Zend\Db\TableGateway\TableGateway;

$table = new TableGateway('artist', $adapter, new RowGatewayFeature('id'));
$results = $table->select(['id' => 2]);

$artistRow = $results->current();
$artistRow->name = 'New Name';
$artistRow->save();
```

## ActiveRecord Style Objects

If you wish to have custom behaviour in your `RowGateway` objects &mdash;
essentially making them behave similarly to the
[ActiveRecord](http://www.martinfowler.com/eaaCatalog/activeRecord.html)
pattern), pass a prototype object implementing the `RowGatewayInterface` to the
`RowGatewayFeature` constructor instead of a primary key:

```php
use Zend\Db\TableGateway\Feature\RowGatewayFeature;
use Zend\Db\TableGateway\TableGateway;
use Zend\Db\RowGateway\RowGatewayInterface;

class Artist implements RowGatewayInterface
{
    protected $adapter;

    public function __construct($adapter)
    {
       $this->adapter = $adapter;
    }

    // ... save() and delete() implementations
}

$table = new TableGateway('artist', $adapter, new RowGatewayFeature(new Artist($adapter)));
```
