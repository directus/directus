<?php

class BuilderTest extends \PHPUnit_Framework_TestCase
{
    public function testConstructor()
    {
        $query = $this->createQueryBuilder();
        $this->assertInstanceOf('\Directus\Database\Connection', $query->getConnection());
    }

    public function testOrder()
    {
        $query = $this->createQueryBuilder();
        $this->assertEmpty($query->getOrder());

        $query->orderBy('title');
        $this->assertArrayHasKey('title', $query->getOrder());

        $query->orderBy('published_at', 'DESC');
        $this->assertArrayHasKey('published_at', $query->getOrder());

        $orders = $query->getOrder();
        $this->assertCount(2, $orders);

        $this->assertSame('ASC', $orders['title']);
        $this->assertSame('DESC', $orders['published_at']);
    }

    public function testOffsetAndLimit()
    {
        $query = $this->createQueryBuilder();

        $this->assertNull($query->getOffset());
        $this->assertNull($query->getSkip());
        $this->assertNull($query->getLimit());

        $query->offset(100);
        $this->assertSame(100, $query->getOffset());
        $query->offset(-1);
        $this->assertSame(0, $query->getOffset());

        $query->skip(100);
        $this->assertSame(100, $query->getOffset());
        $query->skip(-1);
        $this->assertSame(0, $query->getOffset());

        $query->limit(100);
        $this->assertSame(100, $query->getLimit());

        $query->limit(-1);
        $this->assertSame(null, $query->getLimit());
    }

    public function testWhere()
    {
        $query = $this->createQueryBuilder();

        $this->assertEmpty($query->getWheres());
        $query->where('field1', '=', 2);
        $query->where('field', '>', 1);

        $query->whereEqualTo('field2', 1);
        $query->whereNotEqualTo('field3', 3);

        $query->whereLessThan('field2', 1);
        $query->whereLessThanOrEqual('field3', 3);

        $query->whereGreaterThan('field2', 1);
        $query->whereGreaterThanOrEqual('field3', 3);

        $query->whereIn('field2', [1, 2, 3]);
        $query->whereNotIn('field3', [1, 2, 3]);

        $query->whereNull('field2');
        $query->whereNotNull('field3');

        $query->whereLike('field1', 'hola');
        $query->whereNotLike('field2', 'hello');

        $query->buildSelect();

        $wheres = $query->getWheres();
        $this->assertCount(14, $wheres);
    }

    public function testFrom()
    {
        $query = $this->createQueryBuilder();

        $this->assertNull($query->getFrom());
        $query->from('table');
        $this->assertSame('table', $query->getFrom());
    }

    public function testSelect()
    {
        $query = $this->createQueryBuilder();

        $this->assertSame(['*'], $query->getColumns());
        $query->from('table');
        $query->columns(['id', 'name']);
        $this->assertSame(['id', 'name'], $query->getColumns());
    }

    /**
     * @return \Directus\Database\Query\Builder
     */
    protected function createQueryBuilder()
    {
        $connection = get_mock_connection($this);

        return new \Directus\Database\Query\Builder($connection);
    }
}