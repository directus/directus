# SQL Abstraction

`Zend\Db\Sql` is a SQL abstraction layer for building platform-specific SQL
queries via an object-oriented API. The end result of a `Zend\Db\Sql` object
will be to either produce a `Statement` and `ParameterContainer` that
represents the target query, or a full string that can be directly executed
against the database platform. To achieve this, `Zend\Db\Sql` objects require a
`Zend\Db\Adapter\Adapter` object in order to produce the desired results.

## Quick start

There are four primary tasks associated with interacting with a database
defined by Data Manipulation Language (DML): selecting, inserting, updating,
and deleting. As such, there are four primary classes that developers can
interact with in order to build queries in the `Zend\Db\Sql` namespace:
`Select`, `Insert`, `Update`, and `Delete`.

Since these four tasks are so closely related and generally used together
within the same application, the `Zend\Db\Sql\Sql` class helps you create them
and produce the result you are attempting to achieve.

```php
use Zend\Db\Sql\Sql;

$sql    = new Sql($adapter);
$select = $sql->select(); // returns a Zend\Db\Sql\Select instance
$insert = $sql->insert(); // returns a Zend\Db\Sql\Insert instance
$update = $sql->update(); // returns a Zend\Db\Sql\Update instance
$delete = $sql->delete(); // returns a Zend\Db\Sql\Delete instance
```

As a developer, you can now interact with these objects, as described in the
sections below, to customize each query. Once they have been populated with
values, they are ready to either be prepared or executed.

To prepare (using a Select object):

```php
use Zend\Db\Sql\Sql;

$sql    = new Sql($adapter);
$select = $sql->select();
$select->from('foo');
$select->where(['id' => 2]);

$statement = $sql->prepareStatementForSqlObject($select);
$results = $statement->execute();
```

To execute (using a Select object)

```php
use Zend\Db\Sql\Sql;

$sql    = new Sql($adapter);
$select = $sql->select();
$select->from('foo');
$select->where(['id' => 2]);

$selectString = $sql->buildSqlString($select);
$results = $adapter->query($selectString, $adapter::QUERY_MODE_EXECUTE);
```

`Zend\\Db\\Sql\\Sql` objects can also be bound to a particular table so that in
obtaining a `Select`, `Insert`, `Update`, or `Delete` instance, the object will be
seeded with the table:

```php
use Zend\Db\Sql\Sql;

$sql    = new Sql($adapter, 'foo');
$select = $sql->select();
$select->where(['id' => 2]); // $select already has from('foo') applied
```

## Common interfaces for SQL implementations

Each of these objects implements the following two interfaces:

```php
interface PreparableSqlInterface
{
     public function prepareStatement(Adapter $adapter, StatementInterface $statement) : void;
}

interface SqlInterface
{
     public function getSqlString(PlatformInterface $adapterPlatform = null) : string;
}
```

Use these functions to produce either (a) a prepared statement, or (b) a string
to execute.

## Select

`Zend\Db\Sql\Select` presents a unified API for building platform-specific SQL
SELECT queries. Instances may be created and consumed without
`Zend\Db\Sql\Sql`:

```php
use Zend\Db\Sql\Select;

$select = new Select();
// or, to produce a $select bound to a specific table
$select = new Select('foo');
```

If a table is provided to the `Select` object, then `from()` cannot be called
later to change the name of the table.

Once you have a valid `Select` object, the following API can be used to further
specify various select statement parts:

```php
class Select extends AbstractSql implements SqlInterface, PreparableSqlInterface
{
    const JOIN_INNER = 'inner';
    const JOIN_OUTER = 'outer';
    const JOIN_LEFT = 'left';
    const JOIN_RIGHT = 'right';
    const SQL_STAR = '*';
    const ORDER_ASCENDING = 'ASC';
    const ORDER_DESCENDING = 'DESC';

    public $where; // @param Where $where

    public function __construct(string|array|TableIdentifier $table = null);
    public function from(string|array|TableIdentifier $table) : self;
    public function columns(array $columns, bool $prefixColumnsWithTable = true) : self;
    public function join(string|array $name, string $on, string|array $columns = self::SQL_STAR, string $type = self::JOIN_INNER) : self;
    public function where(Where|callable|string|array|PredicateInterface $predicate, string $combination = Predicate\PredicateSet::OP_AND) : self;
    public function group(string|array $group);
    public function having(Having|callable|string|array $predicate, string $combination = Predicate\PredicateSet::OP_AND) : self;
    public function order(string|array $order) : self;
    public function limit(int $limit) : self;
    public function offset(int $offset) : self;
}
```

### from()

```php
// As a string:
$select->from('foo');

// As an array to specify an alias
// (produces SELECT "t".* FROM "table" AS "t")
$select->from(['t' => 'table']);

// Using a Sql\TableIdentifier:
// (same output as above)
$select->from(new TableIdentifier(['t' => 'table']));
```

### columns()

```php
// As an array of names
$select->columns(['foo', 'bar']);

// As an associative array with aliases as the keys
// (produces 'bar' AS 'foo', 'bax' AS 'baz')
$select->columns(['foo' => 'bar', 'baz' => 'bax']);
```

### join()

```php
$select->join(
    'foo',              // table name
    'id = bar.id',      // expression to join on (will be quoted by platform object before insertion),
    ['bar', 'baz'],     // (optional) list of columns, same requirements as columns() above
    $select::JOIN_OUTER // (optional), one of inner, outer, left, right also represented by constants in the API
);

$select
    ->from(['f' => 'foo'])     // base table
    ->join(
        ['b' => 'bar'],        // join table with alias
        'f.foo_id = b.foo_id'  // join expression
    );
```

### where(), having()

`Zend\Db\Sql\Select` provides bit of flexibility as it regards to what kind of
parameters are acceptable when calling `where()` or `having()`. The method
signature is listed as:

```php
/**
 * Create where clause
 *
 * @param  Where|callable|string|array $predicate
 * @param  string $combination One of the OP_* constants from Predicate\PredicateSet
 * @return Select
 */
public function where($predicate, $combination = Predicate\PredicateSet::OP_AND);
```

If you provide a `Zend\Db\Sql\Where` instance to `where()` or a
`Zend\Db\Sql\Having` instance to `having()`, any previous internal instances
will be replaced completely. When either instance is processed, this object will
be iterated to produce the WHERE or HAVING section of the SELECT statement.

If you provide a PHP callable to `where()` or `having()`, this function will be
called with the `Select`'s `Where`/`Having` instance as the only parameter.
This enables code like the following:

```php
$select->where(function (Where $where) {
    $where->like('username', 'ralph%');
});
```

If you provide a *string*, this string will be used to create a
`Zend\Db\Sql\Predicate\Expression` instance, and its contents will be applied
as-is, with no quoting:

```php
// SELECT "foo".* FROM "foo" WHERE x = 5
$select->from('foo')->where('x = 5');
```

If you provide an array with integer indices, the value can be one of:

- a string; this will be used to build a `Predicate\Expression`.
- any object implementing `Predicate\PredicateInterface`.
    
In either case, the instances are pushed onto the `Where` stack with the
`$combination` provided (defaulting to `AND`).

As an example:

```php
// SELECT "foo".* FROM "foo" WHERE x = 5 AND y = z
$select->from('foo')->where(['x = 5', 'y = z']);
```

If you provide an associative array with string keys, any value with a string
key will be cast as follows:

PHP value | Predicate type
--------- | --------------
`null`    | `Predicate\IsNull`
`array`   | `Predicate\In`
`string`  | `Predicate\Operator`, where the key is the identifier.

As an example:

```php
// SELECT "foo".* FROM "foo" WHERE "c1" IS NULL AND "c2" IN (?, ?, ?) AND "c3" IS NOT NULL
$select->from('foo')->where([
    'c1' => null,
    'c2' => [1, 2, 3],
    new \Zend\Db\Sql\Predicate\IsNotNull('c3'),
]);
```

### order()

```php
$select = new Select;
$select->order('id DESC'); // produces 'id' DESC

$select = new Select;
$select
    ->order('id DESC')
    ->order('name ASC, age DESC'); // produces 'id' DESC, 'name' ASC, 'age' DESC

$select = new Select;
$select->order(['name ASC', 'age DESC']); // produces 'name' ASC, 'age' DESC
```

### limit() and offset()

```php
$select = new Select;
$select->limit(5);   // always takes an integer/numeric
$select->offset(10); // similarly takes an integer/numeric
```

## Insert

The Insert API:

```php
class Insert implements SqlInterface, PreparableSqlInterface
{
    const VALUES_MERGE = 'merge';
    const VALUES_SET   = 'set';

    public function __construct(string|TableIdentifier $table = null);
    public function into(string|TableIdentifier $table) : self;
    public function columns(array $columns) : self;
    public function values(array $values, string $flag = self::VALUES_SET) : self;
}
```

As with `Select`, the table may be provided during instantiation or via the
`into()` method.

### columns()

```php
$insert->columns(['foo', 'bar']); // set the valid columns
```

### values()

```php
// The default behavior of values is to set the values;
// successive calls will not preserve values from previous calls.
$insert->values([
    'col_1' => 'value1',
    'col_2' => 'value2',
]);
```

```php
// To merge values with previous calls, provide the appropriate flag:
$insert->values(['col_2' => 'value2'], $insert::VALUES_MERGE);
```

## Update

```php
class Update
{
    const VALUES_MERGE = 'merge';
    const VALUES_SET   = 'set';

    public $where; // @param Where $where
    public function __construct(string|TableIdentifier $table = null);
    public function table(string|TableIdentifier $table) : self;
    public function set(array $values, string $flag = self::VALUES_SET) : self;
    public function where(Where|callable|string|array|PredicateInterface $predicate, string $combination = Predicate\PredicateSet::OP_AND) : self;
}
```

### set()

```php
$update->set(['foo' => 'bar', 'baz' => 'bax']);
```

### where()

See the [section on Where and Having](#where-and-having).

## Delete

```php
class Delete
{
    public $where; // @param Where $where

    public function __construct(string|TableIdentifier $table = null);
    public function from(string|TableIdentifier $table);
    public function where(Where|callable|string|array|PredicateInterface $predicate, string $combination = Predicate\PredicateSet::OP_AND) : self;
}
```

### where()

See the [section on Where and Having](#where-and-having).

## Where and Having

In the following, we will talk about `Where`; note, however, that `Having`
utilizes the same API.

Effectively, `Where` and `Having` extend from the same base object, a
`Predicate` (and `PredicateSet`). All of the parts that make up a WHERE or
HAVING clause that are AND'ed or OR'd together are called *predicates*.  The
full set of predicates is called a `PredicateSet`. A `Predicate` generally
contains the values (and identifiers) separate from the fragment they belong to
until the last possible moment when the statement is either prepared
(parameteritized) or executed. In parameterization, the parameters will be
replaced with their proper placeholder (a named or positional parameter), and
the values stored inside an `Adapter\ParameterContainer`. When executed, the
values will be interpolated into the fragments they belong to and properly
quoted.

In the `Where`/`Having` API, a distinction is made between what elements are
considered identifiers (`TYPE_IDENTIFIER`) and which are values (`TYPE_VALUE`).
There is also a special use case type for literal values (`TYPE_LITERAL`). All
element types are expressed via the `Zend\Db\Sql\ExpressionInterface`
interface.

> ### Literals
>
> In ZF 2.1, an actual `Literal` type was added. `Zend\Db\Sql` now makes the
> distinction that literals will not have any parameters that need
> interpolating, while `Expression` objects *might* have parameters that need
> interpolating. In cases where there are parameters in an `Expression`,
> `Zend\Db\Sql\AbstractSql` will do its best to identify placeholders when the
> `Expression` is processed during statement creation. In short, if you don't
> have parameters, use `Literal` objects.

The `Where` and `Having` API is that of `Predicate` and `PredicateSet`:

```php
// Where & Having extend Predicate:
class Predicate extends PredicateSet
{
    public $and;
    public $or;
    public $AND;
    public $OR;
    public $NEST;
    public $UNNEST;

    public function nest() : Predicate;
    public function setUnnest(Predicate $predicate) : void;
    public function unnest() : Predicate;
    public function equalTo(
        int|float|bool|string $left,
        int|float|bool|string $right,
        string $leftType = self::TYPE_IDENTIFIER,
        string $rightType = self::TYPE_VALUE
    ) : self;
    public function notEqualTo(
        int|float|bool|string $left,
        int|float|bool|string $right,
        string $leftType = self::TYPE_IDENTIFIER,
        string $rightType = self::TYPE_VALUE
    ) : self;
    public function lessThan(
        int|float|bool|string $left,
        int|float|bool|string $right,
        string $leftType = self::TYPE_IDENTIFIER,
        string $rightType = self::TYPE_VALUE
    ) : self;
    public function greaterThan(
        int|float|bool|string $left,
        int|float|bool|string $right,
        string $leftType = self::TYPE_IDENTIFIER,
        string $rightType = self::TYPE_VALUE
    ) : self;
    public function lessThanOrEqualTo(
        int|float|bool|string $left,
        int|float|bool|string $right,
        string $leftType = self::TYPE_IDENTIFIER,
        string $rightType = self::TYPE_VALUE
    ) : self;
    public function greaterThanOrEqualTo(
        int|float|bool|string $left,
        int|float|bool|string $right,
        string $leftType = self::TYPE_IDENTIFIER,
        string $rightType = self::TYPE_VALUE
    ) : self;
    public function like(string $identifier, string $like) : self;
    public function notLike(string $identifier, string $notLike) : self;
    public function literal(string $literal) : self;
    public function expression(string $expression, array $parameters = null) : self;
    public function isNull(string $identifier) : self;
    public function isNotNull(string $identifier) : self;
    public function in(string $identifier, array $valueSet = []) : self;
    public function notIn(string $identifier, array $valueSet = []) : self;
    public function between(
        string $identifier,
        int|float|string $minValue,
        int|float|string $maxValue
    ) : self;
    public function notBetween(
        string $identifier,
        int|float|string $minValue,
        int|float|string $maxValue
    ) : self;
    public function predicate(PredicateInterface $predicate) : self;

    // Inherited From PredicateSet

    public function addPredicate(PredicateInterface $predicate, $combination = null) : self;
    public function getPredicates() PredicateInterface[];
    public function orPredicate(PredicateInterface $predicate) : self;
    public function andPredicate(PredicateInterface $predicate) : self;
    public function getExpressionData() : array;
    public function count() : int;
}
```

Each method in the API will produce a corresponding `Predicate` object of a similarly named
type, as described below.

### equalTo(), lessThan(), greaterThan(), lessThanOrEqualTo(), greaterThanOrEqualTo()

```php
$where->equalTo('id', 5);

// The above is equivalent to:
$where->addPredicate(
    new Predicate\Operator($left, Operator::OPERATOR_EQUAL_TO, $right, $leftType, $rightType)
);
```

Operators use the following API:

```php
class Operator implements PredicateInterface
{
    const OPERATOR_EQUAL_TO                  = '=';
    const OP_EQ                              = '=';
    const OPERATOR_NOT_EQUAL_TO              = '!=';
    const OP_NE                              = '!=';
    const OPERATOR_LESS_THAN                 = '<';
    const OP_LT                              = '<';
    const OPERATOR_LESS_THAN_OR_EQUAL_TO     = '<=';
    const OP_LTE                             = '<=';
    const OPERATOR_GREATER_THAN              = '>';
    const OP_GT                              = '>';
    const OPERATOR_GREATER_THAN_OR_EQUAL_TO  = '>=';
    const OP_GTE                             = '>=';

    public function __construct(
        int|float|bool|string $left = null,
        string $operator = self::OPERATOR_EQUAL_TO,
        int|float|bool|string $right = null,
        string $leftType = self::TYPE_IDENTIFIER,
        string $rightType = self::TYPE_VALUE
    );
    public function setLeft(int|float|bool|string $left);
    public function getLeft() : int|float|bool|string;
    public function setLeftType(string $type) : self;
    public function getLeftType() : string;
    public function setOperator(string $operator);
    public function getOperator() : string;
    public function setRight(int|float|bool|string $value) : self;
    public function getRight() : int|float|bool|string;
    public function setRightType(string $type) : self;
    public function getRightType() : string;
    public function getExpressionData() : array;
}
```

### like($identifier, $like), notLike($identifier, $notLike)

```php
$where->like($identifier, $like):

// The above is equivalent to:
$where->addPredicate(
    new Predicate\Like($identifier, $like)
);
```

The following is the `Like` API:

```php
class Like implements PredicateInterface
{
    public function __construct(string $identifier = null, string $like = null);
    public function setIdentifier(string $identifier) : self;
    public function getIdentifier() : string;
    public function setLike(string $like) : self;
    public function getLike() : string;
}
```

### literal($literal)

```php
$where->literal($literal);

// The above is equivalent to:
$where->addPredicate(
    new Predicate\Literal($literal)
);
```

The following is the `Literal` API:

```php
class Literal implements ExpressionInterface, PredicateInterface
{
    const PLACEHOLDER = '?';
    public function __construct(string $literal = '');
    public function setLiteral(string $literal) : self;
    public function getLiteral() : string;
}
```

### expression($expression, $parameter)

```php
$where->expression($expression, $parameter);

// The above is equivalent to:
$where->addPredicate(
    new Predicate\Expression($expression, $parameter)
);
```

The following is the `Expression` API:

```php
class Expression implements ExpressionInterface, PredicateInterface
{
    const PLACEHOLDER = '?';

    public function __construct(
        string $expression = null,
        int|float|bool|string|array $valueParameter = null
        /* [, $valueParameter, ...  ] */
    );
    public function setExpression(string $expression) : self;
    public function getExpression() : string;
    public function setParameters(int|float|bool|string|array $parameters) : self;
    public function getParameters() : array;
}
```

### isNull($identifier)

```php
$where->isNull($identifier);

// The above is equivalent to:
$where->addPredicate(
    new Predicate\IsNull($identifier)
);
```

The following is the `IsNull` API:

```php
class IsNull implements PredicateInterface
{
    public function __construct(string $identifier = null);
    public function setIdentifier(string $identifier) : self;
    public function getIdentifier() : string;
}
```

### isNotNull($identifier)

```php
$where->isNotNull($identifier);

// The above is equivalent to:
$where->addPredicate(
    new Predicate\IsNotNull($identifier)
);
```

The following is the `IsNotNull` API:

```php
class IsNotNull implements PredicateInterface
{
    public function __construct(string $identifier = null);
    public function setIdentifier(string $identifier) : self;
    public function getIdentifier() : string;
}
```

### in($identifier, $valueSet), notIn($identifier, $valueSet)

```php
$where->in($identifier, $valueSet);

// The above is equivalent to:
$where->addPredicate(
    new Predicate\In($identifier, $valueSet)
);
```

The following is the `In` API:

```php
class In implements PredicateInterface
{
    public function __construct(
        string|array $identifier = null,
        array|Select $valueSet = null
    );
    public function setIdentifier(string|array $identifier) : self;
    public function getIdentifier() : string|array;
    public function setValueSet(array|Select $valueSet) : self;
    public function getValueSet() : array|Select;
}
```

### between($identifier, $minValue, $maxValue), notBetween($identifier, $minValue, $maxValue)

```php
$where->between($identifier, $minValue, $maxValue);

// The above is equivalent to:
$where->addPredicate(
    new Predicate\Between($identifier, $minValue, $maxValue)
);
```

The following is the `Between` API:

```php
class Between implements PredicateInterface
{
    public function __construct(
        string $identifier = null,
        int|float|string $minValue = null,
        int|float|string $maxValue = null
    );
    public function setIdentifier(string $identifier) : self;
    public function getIdentifier() : string;
    public function setMinValue(int|float|string $minValue) : self;
    public function getMinValue() : int|float|string;
    public function setMaxValue(int|float|string $maxValue) : self;
    public function getMaxValue() : int|float|string;
    public function setSpecification(string $specification);
}
```
