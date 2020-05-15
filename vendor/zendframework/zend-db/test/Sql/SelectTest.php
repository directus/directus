<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use PHPUnit\Framework\TestCase;
use ReflectionObject;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\Sql92;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Having;
use Zend\Db\Sql\Predicate;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Sql\Where;
use ZendTest\Db\TestAsset\TrustingSql92Platform;

class SelectTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Select::__construct
     */
    public function testConstruct()
    {
        $select = new Select('foo');
        self::assertEquals('foo', $select->getRawState('table'));
    }

    /**
     * @testdox unit test: Test from() returns Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::from
     */
    public function testFrom()
    {
        $select = new Select;
        $return = $select->from('foo', 'bar');
        self::assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via from()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testFrom
     */
    public function testGetRawStateViaFrom(Select $select)
    {
        self::assertEquals('foo', $select->getRawState('table'));
    }

    /**
     * @testdox unit test: Test quantifier() returns Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::quantifier
     */
    public function testQuantifier()
    {
        $select = new Select;
        $return = $select->quantifier($select::QUANTIFIER_DISTINCT);
        self::assertSame($select, $return);
        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via quantifier()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testQuantifier
     */
    public function testGetRawStateViaQuantifier(Select $select)
    {
        self::assertEquals(Select::QUANTIFIER_DISTINCT, $select->getRawState('quantifier'));
    }

    /**
     * @testdox unit test: Test quantifier() accepts expression
     * @covers \Zend\Db\Sql\Select::quantifier
     */
    public function testQuantifierParameterExpressionInterface()
    {
        $expr = $this->getMockBuilder('Zend\Db\Sql\ExpressionInterface')->getMock();
        $select = new Select;
        $select->quantifier($expr);
        self::assertSame(
            $expr,
            $select->getRawState(Select::QUANTIFIER)
        );
    }

    /**
     * @testdox unit test: Test columns() returns Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::columns
     */
    public function testColumns()
    {
        $select = new Select;
        $return = $select->columns(['foo', 'bar']);
        self::assertSame($select, $return);

        return $select;
    }

    /**
     * @testdox unit test: Test isTableReadOnly() returns correct state for read only
     * @covers \Zend\Db\Sql\Select::isTableReadOnly
     */
    public function testIsTableReadOnly()
    {
        $select = new Select('foo');
        self::assertTrue($select->isTableReadOnly());

        $select = new Select;
        self::assertFalse($select->isTableReadOnly());
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via columns()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testColumns
     */
    public function testGetRawStateViaColumns(Select $select)
    {
        self::assertEquals(['foo', 'bar'], $select->getRawState('columns'));
    }

    /**
     * @testdox unit test: Test join() returns same Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::join
     */
    public function testJoin()
    {
        $select = new Select;
        $return = $select->join('foo', 'x = y', Select::SQL_STAR, Select::JOIN_INNER);
        self::assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test join() exception with bad join
     * @covers \Zend\Db\Sql\Select::join
     */
    public function testBadJoin()
    {
        $select = new Select;
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage("expects 'foo' as");
        $select->join(['foo'], 'x = y', Select::SQL_STAR, Select::JOIN_INNER);
    }

    /**
     * @testdox unit test: Test processJoins() exception with bad join name
     * @covers \Zend\Db\Sql\Select::processJoins
     */
    public function testBadJoinName()
    {
        $mockExpression = $this->getMockBuilder('Zend\Db\Sql\ExpressionInterface')
            ->setConstructorArgs(['bar'])
            ->getMock();
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $parameterContainer = new ParameterContainer();

        $select = new Select;
        $select->join(['foo' => $mockExpression], 'x = y', Select::SQL_STAR, Select::JOIN_INNER);

        $sr = new ReflectionObject($select);

        $mr = $sr->getMethod('processJoins');

        $mr->setAccessible(true);

        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');

        $mr->invokeArgs($select, [new Sql92, $mockDriver, $parameterContainer]);
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via join()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testJoin
     */
    public function testGetRawStateViaJoin(Select $select)
    {
        self::assertEquals(
            [[
                'name' => 'foo',
                'on' => 'x = y',
                'columns' => [Select::SQL_STAR],
                'type' => Select::JOIN_INNER,
            ]],
            $select->getRawState('joins')->getJoins()
        );
    }

    /**
     * @testdox unit test: Test where() returns Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereReturnsSameSelectObject()
    {
        $select = new Select;
        self::assertSame($select, $select->where('x = y'));
    }

    /**
     * @testdox unit test: Test where() will accept a string for the predicate to create an expression predicate
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsString()
    {
        $select = new Select;
        $select->where('x = ?');

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertCount(1, $predicates);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Expression', $predicates[0][1]);
        self::assertEquals(Where::OP_AND, $predicates[0][0]);
        self::assertEquals('x = ?', $predicates[0][1]->getExpression());

        $select = new Select;
        $select->where('x = y');

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
    }

    /**
     * @testdox unit test: Test where() will accept an array with a string key (containing ?) used as an
     *                     expression with placeholder
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsAssociativeArrayContainingReplacementCharacter()
    {
        $select = new Select;
        $select->where(['foo > ?' => 5]);

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertCount(1, $predicates);
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Expression', $predicates[0][1]);
        self::assertEquals(Where::OP_AND, $predicates[0][0]);
        self::assertEquals('foo > ?', $predicates[0][1]->getExpression());
        self::assertEquals([5], $predicates[0][1]->getParameters());
    }

    /**
     * @testdox unit test: Test where() will accept any array with string key (without ?) to be used
     *                     as Operator predicate
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsAssociativeArrayNotContainingReplacementCharacter()
    {
        $select = new Select;
        $select->where(['name' => 'Ralph', 'age' => 33]);

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertCount(2, $predicates);

        self::assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[0][1]);
        self::assertEquals(Where::OP_AND, $predicates[0][0]);
        self::assertEquals('name', $predicates[0][1]->getLeft());
        self::assertEquals('Ralph', $predicates[0][1]->getRight());

        self::assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[1][1]);
        self::assertEquals(Where::OP_AND, $predicates[1][0]);
        self::assertEquals('age', $predicates[1][1]->getLeft());
        self::assertEquals(33, $predicates[1][1]->getRight());

        $select = new Select;
        $select->where(['x = y']);

        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
    }

    /**
     * @testdox unit test: Test where() will accept any array with string key (without ?) with Predicate throw Exception
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsAssociativeArrayIsPredicate()
    {
        $select = new Select;
        $where = [
            'name' => new Predicate\Literal("name = 'Ralph'"),
            'age' => new Predicate\Expression('age = ?', 33),
        ];
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('Using Predicate must not use string keys');
        $select->where($where);
    }

    /**
     * @testdox unit test: Test where() will accept an indexed array to be used by joining string expressions
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsIndexedArray()
    {
        $select = new Select;
        $select->where(['name = "Ralph"']);

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertCount(1, $predicates);

        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
        self::assertEquals(Where::OP_AND, $predicates[0][0]);
        self::assertEquals('name = "Ralph"', $predicates[0][1]->getLiteral());
    }

    /**
     * @testdox unit test: Test where() will accept an indexed array to be used by joining string expressions,
     *                     combined by OR
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsIndexedArrayArgument2IsOr()
    {
        $select = new Select;
        $select->where(['name = "Ralph"'], Where::OP_OR);

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertCount(1, $predicates);

        self::assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
        self::assertEquals(Where::OP_OR, $predicates[0][0]);
        self::assertEquals('name = "Ralph"', $predicates[0][1]->getLiteral());
    }

    /**
     * @testdox unit test: Test where() will accept a closure to be executed with Where object as argument
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsClosure()
    {
        $select = new Select;
        $where = $select->getRawState('where');

        $select->where(function ($what) use ($where) {
            self::assertSame($where, $what);
        });
    }

    /**
     * @testdox unit test: Test where() will accept any Predicate object as-is
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsPredicate()
    {
        $select = new Select;
        $predicate = new Predicate\Predicate([
            new Predicate\Expression('name = ?', 'Ralph'),
            new Predicate\Expression('age = ?', 33),
        ]);
        $select->where($predicate);

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        self::assertSame($predicate, $predicates[0][1]);
    }

    /**
     * @testdox unit test: Test where() will accept a Where object
     * @covers \Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsWhereObject()
    {
        $select = new Select;
        $select->where($newWhere = new Where);
        self::assertSame($newWhere, $select->getRawState('where'));
    }

    /**
     * @author Rob Allen
     * @testdox unit test: Test order()
     * @covers \Zend\Db\Sql\Select::order
     */
    public function testOrder()
    {
        $select = new Select;
        $return = $select->order('id DESC');
        self::assertSame($select, $return); // test fluent interface
        self::assertEquals(['id DESC'], $select->getRawState('order'));

        $select = new Select;
        $select->order('id DESC')
            ->order('name ASC, age DESC');
        self::assertEquals(['id DESC', 'name ASC', 'age DESC'], $select->getRawState('order'));

        $select = new Select;
        $select->order(['name ASC', 'age DESC']);
        self::assertEquals(['name ASC', 'age DESC'], $select->getRawState('order'));

        $select = new Select;
        $select->order(new Expression('RAND()'));
        $sr = new ReflectionObject($select);
        $method = $sr->getMethod('processOrder');
        $method->setAccessible(true);
        self::assertEquals(
            [[['RAND()']]],
            $method->invokeArgs($select, [new TrustingSql92Platform()])
        );

        $select = new Select;
        $select->order(
            $this->getMockBuilder('Zend\Db\Sql\Predicate\Operator')
                ->setMethods()
                ->setConstructorArgs(['rating', '<', '10'])
                ->getMock()
        );
        $sr = new ReflectionObject($select);
        $method = $sr->getMethod('processOrder');
        $method->setAccessible(true);
        self::assertEquals(
            [[['"rating" < \'10\'']]],
            $method->invokeArgs($select, [new TrustingSql92Platform()])
        );
    }

    /**
     * @testdox unit test: Test order() correctly splits parameters.
     * @covers \Zend\Db\Sql\Select::order
     */
    public function testOrderCorrectlySplitsParameter()
    {
        $select = new Select;
        $select->order('name  desc');
        self::assertEquals(
            'SELECT * ORDER BY "name" DESC',
            $select->getSqlString(new TrustingSql92Platform())
        );
    }

    /**
     * @testdox: unit test: test limit()
     * @covers \Zend\Db\Sql\Select::limit
     */
    public function testLimit()
    {
        $select = new Select;
        self::assertSame($select, $select->limit(5));
        return $select;
    }

    /**
     * @testdox: unit test: Test getRawState() returns information populated via limit()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testLimit
     */
    public function testGetRawStateViaLimit(Select $select)
    {
        self::assertEquals(5, $select->getRawState($select::LIMIT));
    }

    /**
     * @testdox: unit test: test limit() throws execption when invalid parameter passed
     * @covers \Zend\Db\Sql\Select::limit
     */
    public function testLimitExceptionOnInvalidParameter()
    {
        $select = new Select;
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('Zend\Db\Sql\Select::limit expects parameter to be numeric');
        $select->limit('foobar');
    }

    /**
     * @testdox: unit test: test offset()
     * @covers \Zend\Db\Sql\Select::offset
     */
    public function testOffset()
    {
        $select = new Select;
        self::assertSame($select, $select->offset(10));
        return $select;
    }

    /**
     * @testdox: unit test: Test getRawState() returns information populated via offset()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testOffset
     */
    public function testGetRawStateViaOffset(Select $select)
    {
        self::assertEquals(10, $select->getRawState($select::OFFSET));
    }

    /**
     * @testdox: unit test: test offset() throws exception when invalid parameter passed
     * @covers \Zend\Db\Sql\Select::offset
     */
    public function testOffsetExceptionOnInvalidParameter()
    {
        $select = new Select;
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('Zend\Db\Sql\Select::offset expects parameter to be numeric');
        $select->offset('foobar');
    }


    /**
     * @testdox unit test: Test group() returns same Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::group
     */
    public function testGroup()
    {
        $select = new Select;
        $return = $select->group(['col1', 'col2']);
        self::assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via group()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testGroup
     */
    public function testGetRawStateViaGroup(Select $select)
    {
        self::assertEquals(
            ['col1', 'col2'],
            $select->getRawState('group')
        );
    }

    /**
     * @testdox unit test: Test having() returns same Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::having
     */
    public function testHaving()
    {
        $select = new Select;
        $return = $select->having(['x = ?' => 5]);
        self::assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test having() returns same Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::having
     */
    public function testHavingArgument1IsHavingObject()
    {
        $select = new Select;
        $having = new Having();
        $return = $select->having($having);
        self::assertSame($select, $return);
        self::assertSame($having, $select->getRawState('having'));

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via having()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testHaving
     */
    public function testGetRawStateViaHaving(Select $select)
    {
        self::assertInstanceOf('Zend\Db\Sql\Having', $select->getRawState('having'));
    }

    /**
     * @testdox unit test: Test combine() returns same Select object (is chainable)
     * @covers \Zend\Db\Sql\Select::combine
     */
    public function testCombine()
    {
        $select = new Select;
        $combine = new Select;
        $return = $select->combine($combine, $select::COMBINE_UNION, 'ALL');
        self::assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via combine()
     * @covers \Zend\Db\Sql\Select::getRawState
     * @depends testCombine
     */
    public function testGetRawStateViaCombine(Select $select)
    {
        $state = $select->getRawState('combine');
        self::assertInstanceOf('Zend\Db\Sql\Select', $state['select']);
        self::assertNotSame($select, $state['select']);
        self::assertEquals(Select::COMBINE_UNION, $state['type']);
        self::assertEquals('ALL', $state['modifier']);
    }

    /**
     * @testdox unit test: Test reset() resets internal stat of Select object, based on input
     * @covers \Zend\Db\Sql\Select::reset
     */
    public function testReset()
    {
        $select = new Select;

        // table
        $select->from('foo');
        self::assertEquals('foo', $select->getRawState(Select::TABLE));
        $select->reset(Select::TABLE);
        self::assertNull($select->getRawState(Select::TABLE));

        // columns
        $select->columns(['foo']);
        self::assertEquals(['foo'], $select->getRawState(Select::COLUMNS));
        $select->reset(Select::COLUMNS);
        self::assertEmpty($select->getRawState(Select::COLUMNS));

        // joins
        $select->join('foo', 'id = boo');
        self::assertEquals(
            [['name' => 'foo', 'on' => 'id = boo', 'columns' => ['*'], 'type' => 'inner']],
            $select->getRawState(Select::JOINS)->getJoins()
        );
        $select->reset(Select::JOINS);
        self::assertEmpty($select->getRawState(Select::JOINS)->getJoins());

        // where
        $select->where('foo = bar');
        $where1 = $select->getRawState(Select::WHERE);
        self::assertEquals(1, $where1->count());
        $select->reset(Select::WHERE);
        $where2 = $select->getRawState(Select::WHERE);
        self::assertEquals(0, $where2->count());
        self::assertNotSame($where1, $where2);

        // group
        $select->group(['foo']);
        self::assertEquals(['foo'], $select->getRawState(Select::GROUP));
        $select->reset(Select::GROUP);
        self::assertEmpty($select->getRawState(Select::GROUP));

        // having
        $select->having('foo = bar');
        $having1 = $select->getRawState(Select::HAVING);
        self::assertEquals(1, $having1->count());
        $select->reset(Select::HAVING);
        $having2 = $select->getRawState(Select::HAVING);
        self::assertEquals(0, $having2->count());
        self::assertNotSame($having1, $having2);

        // limit
        $select->limit(5);
        self::assertEquals(5, $select->getRawState(Select::LIMIT));
        $select->reset(Select::LIMIT);
        self::assertNull($select->getRawState(Select::LIMIT));

        // offset
        $select->offset(10);
        self::assertEquals(10, $select->getRawState(Select::OFFSET));
        $select->reset(Select::OFFSET);
        self::assertNull($select->getRawState(Select::OFFSET));

        // order
        $select->order('foo asc');
        self::assertEquals(['foo asc'], $select->getRawState(Select::ORDER));
        $select->reset(Select::ORDER);
        self::assertEmpty($select->getRawState(Select::ORDER));
    }

    /**
     * @testdox unit test: Test prepareStatement() will produce expected sql and parameters based on
     *                     a variety of provided arguments [uses data provider]
     * @covers \Zend\Db\Sql\Select::prepareStatement
     * @dataProvider providerData
     */
    public function testPrepareStatement(
        Select $select,
        $expectedSqlString,
        $expectedParameters,
        $unused1,
        $unused2,
        $useNamedParameters = false
    ) {
        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnCallback(
            function ($name) use ($useNamedParameters) {
                return (($useNamedParameters) ? ':' . $name : '?');
            }
        ));
        $mockAdapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();

        $parameterContainer = new ParameterContainer();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockStatement->expects($this->any())->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));
        $mockStatement->expects($this->any())->method('setSql')->with($this->equalTo($expectedSqlString));

        $select->prepareStatement($mockAdapter, $mockStatement);

        if ($expectedParameters) {
            self::assertEquals($expectedParameters, $parameterContainer->getNamedArray());
        }
    }

    /**
     * @group ZF2-5192
     */
    public function testSelectUsingTableIdentifierWithEmptyScheme()
    {
        $select = new Select;
        $select->from(new TableIdentifier('foo'));
        $select->join(new TableIdentifier('bar'), 'foo.id = bar.fooid');

        self::assertEquals(
            'SELECT "foo".*, "bar".* FROM "foo" INNER JOIN "bar" ON "foo"."id" = "bar"."fooid"',
            $select->getSqlString(new TrustingSql92Platform())
        );
    }

    /**
     * @testdox unit test: Test getSqlString() will produce expected sql and parameters based on
     *                     a variety of provided arguments [uses data provider]
     * @covers \Zend\Db\Sql\Select::getSqlString
     * @dataProvider providerData
     */
    public function testGetSqlString(Select $select, $unused, $unused2, $expectedSqlString)
    {
        self::assertEquals($expectedSqlString, $select->getSqlString(new TrustingSql92Platform()));
    }

    /**
     * @testdox unit test: Test __get() returns expected objects magically
     * @covers \Zend\Db\Sql\Select::__get
     */
    public function testMagicAccessor()
    {
        $select = new Select;
        self::assertInstanceOf('Zend\Db\Sql\Where', $select->where);
    }

    /**
     * @testdox unit test: Test __clone() will clone the where object so that this select can be used
     *                     in multiple contexts
     * @covers \Zend\Db\Sql\Select::__clone
     */
    public function testCloning()
    {
        $select = new Select;
        $select1 = clone $select;
        $select1->where('id = foo');
        $select1->having('id = foo');

        self::assertEquals(0, $select->where->count());
        self::assertEquals(1, $select1->where->count());

        self::assertEquals(0, $select->having->count());
        self::assertEquals(1, $select1->having->count());
    }

    /**
     * @testdox unit test: Text process*() methods will return proper array when internally called,
     *                     part of extension API
     * @dataProvider providerData
     * @covers \Zend\Db\Sql\Select::processSelect
     * @covers \Zend\Db\Sql\Select::processJoins
     * @covers \Zend\Db\Sql\Select::processWhere
     * @covers \Zend\Db\Sql\Select::processGroup
     * @covers \Zend\Db\Sql\Select::processHaving
     * @covers \Zend\Db\Sql\Select::processOrder
     * @covers \Zend\Db\Sql\Select::processLimit
     * @covers \Zend\Db\Sql\Select::processOffset
     * @covers \Zend\Db\Sql\Select::processCombine
     */
    public function testProcessMethods(Select $select, $unused, $unused2, $unused3, $internalTests)
    {
        if (! $internalTests) {
            return;
        }

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $parameterContainer = new ParameterContainer();

        $sr = new ReflectionObject($select);

        foreach ($internalTests as $method => $expected) {
            $mr = $sr->getMethod($method);
            $mr->setAccessible(true);
            $return = $mr->invokeArgs($select, [new Sql92, $mockDriver, $parameterContainer]);
            self::assertEquals($expected, $return);
        }
    }

    public function providerData()
    {
        // basic table
        $select0 = new Select;
        $select0->from('foo');
        $sqlPrep0 = // same
        $sqlStr0 = 'SELECT "foo".* FROM "foo"';
        $internalTests0 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
        ];

        // table as TableIdentifier
        $select1 = new Select;
        $select1->from(new TableIdentifier('foo', 'bar'));
        $sqlPrep1 = // same
        $sqlStr1 = 'SELECT "bar"."foo".* FROM "bar"."foo"';
        $internalTests1 = [
            'processSelect' => [[['"bar"."foo".*']], '"bar"."foo"'],
        ];

        // table with alias
        $select2 = new Select;
        $select2->from(['f' => 'foo']);
        $sqlPrep2 = // same
        $sqlStr2 = 'SELECT "f".* FROM "foo" AS "f"';
        $internalTests2 = [
            'processSelect' => [[['"f".*']], '"foo" AS "f"'],
        ];

        // table with alias with table as TableIdentifier
        $select3 = new Select;
        $select3->from(['f' => new TableIdentifier('foo')]);
        $sqlPrep3 = // same
        $sqlStr3 = 'SELECT "f".* FROM "foo" AS "f"';
        $internalTests3 = [
            'processSelect' => [[['"f".*']], '"foo" AS "f"'],
        ];

        // columns
        $select4 = new Select;
        $select4->from('foo')->columns(['bar', 'baz']);
        $sqlPrep4 = // same
        $sqlStr4 = 'SELECT "foo"."bar" AS "bar", "foo"."baz" AS "baz" FROM "foo"';
        $internalTests4 = [
            'processSelect' => [[['"foo"."bar"', '"bar"'], ['"foo"."baz"', '"baz"']], '"foo"'],
        ];

        // columns with AS associative array
        $select5 = new Select;
        $select5->from('foo')->columns(['bar' => 'baz']);
        $sqlPrep5 = // same
        $sqlStr5 = 'SELECT "foo"."baz" AS "bar" FROM "foo"';
        $internalTests5 = [
            'processSelect' => [[['"foo"."baz"', '"bar"']], '"foo"'],
        ];

        // columns with AS associative array mixed
        $select6 = new Select;
        $select6->from('foo')->columns(['bar' => 'baz', 'bam']);
        $sqlPrep6 = // same
        $sqlStr6 = 'SELECT "foo"."baz" AS "bar", "foo"."bam" AS "bam" FROM "foo"';
        $internalTests6 = [
            'processSelect' => [[['"foo"."baz"', '"bar"'], ['"foo"."bam"', '"bam"'] ], '"foo"'],
        ];

        // columns where value is Expression, with AS
        $select7 = new Select;
        $select7->from('foo')->columns(['bar' => new Expression('COUNT(some_column)')]);
        $sqlPrep7 = // same
        $sqlStr7 = 'SELECT COUNT(some_column) AS "bar" FROM "foo"';
        $internalTests7 = [
            'processSelect' => [[['COUNT(some_column)', '"bar"']], '"foo"'],
        ];

        // columns where value is Expression
        $select8 = new Select;
        $select8->from('foo')->columns([new Expression('COUNT(some_column) AS bar')]);
        $sqlPrep8 = // same
        $sqlStr8 = 'SELECT COUNT(some_column) AS bar FROM "foo"';
        $internalTests8 = [
            'processSelect' => [[['COUNT(some_column) AS bar']], '"foo"'],
        ];

        // columns where value is Expression with parameters
        $select9 = new Select;
        $select9->from('foo')->columns(
            [
                new Expression(
                    '(COUNT(?) + ?) AS ?',
                    ['some_column', 5, 'bar'],
                    [Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_IDENTIFIER]
                ),
            ]
        );
        $sqlPrep9 = 'SELECT (COUNT("some_column") + ?) AS "bar" FROM "foo"';
        $sqlStr9 = 'SELECT (COUNT("some_column") + \'5\') AS "bar" FROM "foo"';
        $params9 = ['column1' => 5];
        $internalTests9 = [
            'processSelect' => [[['(COUNT("some_column") + ?) AS "bar"']], '"foo"'],
        ];

        // joins (plain)
        $select10 = new Select;
        $select10->from('foo')->join('zac', 'm = n');
        $sqlPrep10 = // same
        $sqlStr10 = 'SELECT "foo".*, "zac".* FROM "foo" INNER JOIN "zac" ON "m" = "n"';
        $internalTests10 = [
            'processSelect' => [[['"foo".*'], ['"zac".*']], '"foo"'],
            'processJoins'   => [[['INNER', '"zac"', '"m" = "n"']]],
        ];

        // join with columns
        $select11 = new Select;
        $select11->from('foo')->join('zac', 'm = n', ['bar', 'baz']);
        // @codingStandardsIgnoreStart
        $sqlPrep11 = // same
        $sqlStr11 = 'SELECT "foo".*, "zac"."bar" AS "bar", "zac"."baz" AS "baz" FROM "foo" INNER JOIN "zac" ON "m" = "n"';
        // @codingStandardsIgnoreEnd
        $internalTests11 = [
            'processSelect' => [[['"foo".*'], ['"zac"."bar"', '"bar"'], ['"zac"."baz"', '"baz"']], '"foo"'],
            'processJoins'   => [[['INNER', '"zac"', '"m" = "n"']]],
        ];

        // join with alternate type
        $select12 = new Select;
        $select12->from('foo')->join('zac', 'm = n', ['bar', 'baz'], Select::JOIN_OUTER);
        // @codingStandardsIgnoreStart
        $sqlPrep12 = // same
        $sqlStr12 = 'SELECT "foo".*, "zac"."bar" AS "bar", "zac"."baz" AS "baz" FROM "foo" OUTER JOIN "zac" ON "m" = "n"';
        // @codingStandardsIgnoreEnd
        $internalTests12 = [
            'processSelect' => [[['"foo".*'], ['"zac"."bar"', '"bar"'], ['"zac"."baz"', '"baz"']], '"foo"'],
            'processJoins'   => [[['OUTER', '"zac"', '"m" = "n"']]],
        ];

        // join with column aliases
        $select13 = new Select;
        $select13->from('foo')->join('zac', 'm = n', ['BAR' => 'bar', 'BAZ' => 'baz']);
        // @codingStandardsIgnoreStart
        $sqlPrep13 = // same
        $sqlStr13 = 'SELECT "foo".*, "zac"."bar" AS "BAR", "zac"."baz" AS "BAZ" FROM "foo" INNER JOIN "zac" ON "m" = "n"';
        // @codingStandardsIgnoreEnd
        $internalTests13 = [
            'processSelect' => [[['"foo".*'], ['"zac"."bar"', '"BAR"'], ['"zac"."baz"', '"BAZ"']], '"foo"'],
            'processJoins'   => [[['INNER', '"zac"', '"m" = "n"']]],
        ];

        // join with table aliases
        $select14 = new Select;
        $select14->from('foo')->join(['b' => 'bar'], 'b.foo_id = foo.foo_id');
        $sqlPrep14 = // same
        $sqlStr14 = 'SELECT "foo".*, "b".* FROM "foo" INNER JOIN "bar" AS "b" ON "b"."foo_id" = "foo"."foo_id"';
        $internalTests14 = [
            'processSelect' => [[['"foo".*'], ['"b".*']], '"foo"'],
            'processJoins' => [[['INNER', '"bar" AS "b"', '"b"."foo_id" = "foo"."foo_id"']]],
        ];

        // where (simple string)
        $select15 = new Select;
        $select15->from('foo')->where('x = 5');
        $sqlPrep15 = // same
        $sqlStr15 = 'SELECT "foo".* FROM "foo" WHERE x = 5';
        $internalTests15 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processWhere'  => ['x = 5'],
        ];

        // where (returning parameters)
        $select16 = new Select;
        $select16->from('foo')->where(['x = ?' => 5]);
        $sqlPrep16 = 'SELECT "foo".* FROM "foo" WHERE x = ?';
        $sqlStr16 = 'SELECT "foo".* FROM "foo" WHERE x = \'5\'';
        $params16 = ['where1' => 5];
        $internalTests16 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processWhere'  => ['x = ?'],
        ];

        // group
        $select17 = new Select;
        $select17->from('foo')->group(['col1', 'col2']);
        $sqlPrep17 = // same
        $sqlStr17 = 'SELECT "foo".* FROM "foo" GROUP BY "col1", "col2"';
        $internalTests17 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processGroup'  => [['"col1"', '"col2"']],
        ];

        $select18 = new Select;
        $select18->from('foo')->group('col1')->group('col2');
        $sqlPrep18 = // same
        $sqlStr18 = 'SELECT "foo".* FROM "foo" GROUP BY "col1", "col2"';
        $internalTests18 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processGroup'  => [['"col1"', '"col2"']],
        ];

        $select19 = new Select;
        $select19->from('foo')->group(new Expression('DAY(?)', ['col1'], [Expression::TYPE_IDENTIFIER]));
        $sqlPrep19 = // same
        $sqlStr19 = 'SELECT "foo".* FROM "foo" GROUP BY DAY("col1")';
        $internalTests19 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processGroup'  => [['DAY("col1")']],
        ];

        // having (simple string)
        $select20 = new Select;
        $select20->from('foo')->having('x = 5');
        $sqlPrep20 = // same
        $sqlStr20 = 'SELECT "foo".* FROM "foo" HAVING x = 5';
        $internalTests20 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processHaving'  => ['x = 5'],
        ];

        // having (returning parameters)
        $select21 = new Select;
        $select21->from('foo')->having(['x = ?' => 5]);
        $sqlPrep21 = 'SELECT "foo".* FROM "foo" HAVING x = ?';
        $sqlStr21 = 'SELECT "foo".* FROM "foo" HAVING x = \'5\'';
        $params21 = ['having1' => 5];
        $internalTests21 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processHaving'  => ['x = ?'],
        ];

        // order
        $select22 = new Select;
        $select22->from('foo')->order('c1');
        $sqlPrep22 = //
        $sqlStr22 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" ASC';
        $internalTests22 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processOrder'  => [[['"c1"', Select::ORDER_ASCENDING]]],
        ];

        $select23 = new Select;
        $select23->from('foo')->order(['c1', 'c2']);
        $sqlPrep23 = // same
        $sqlStr23 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" ASC, "c2" ASC';
        $internalTests23 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processOrder'  => [[['"c1"', Select::ORDER_ASCENDING], ['"c2"', Select::ORDER_ASCENDING]]],
        ];

        $select24 = new Select;
        $select24->from('foo')->order(['c1' => 'DESC', 'c2' => 'Asc']); // notice partially lower case ASC
        $sqlPrep24 = // same
        $sqlStr24 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" DESC, "c2" ASC';
        $internalTests24 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processOrder'  => [[['"c1"', Select::ORDER_DESCENDING], ['"c2"', Select::ORDER_ASCENDING]]],
        ];

        $select25 = new Select;
        $select25->from('foo')->order(['c1' => 'asc'])->order('c2 desc'); // notice partially lower case ASC
        $sqlPrep25 = // same
        $sqlStr25 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" ASC, "c2" DESC';
        $internalTests25 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processOrder'  => [[['"c1"', Select::ORDER_ASCENDING], ['"c2"', Select::ORDER_DESCENDING]]],
        ];

        // limit
        $select26 = new Select;
        $select26->from('foo')->limit(5);
        $sqlPrep26 = 'SELECT "foo".* FROM "foo" LIMIT ?';
        $sqlStr26 = 'SELECT "foo".* FROM "foo" LIMIT \'5\'';
        $params26 = ['limit' => 5];
        $internalTests26 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processLimit'  => ['?'],
        ];

        // limit with offset
        $select27 = new Select;
        $select27->from('foo')->limit(5)->offset(10);
        $sqlPrep27 = 'SELECT "foo".* FROM "foo" LIMIT ? OFFSET ?';
        $sqlStr27 = 'SELECT "foo".* FROM "foo" LIMIT \'5\' OFFSET \'10\'';
        $params27 = ['limit' => 5, 'offset' => 10];
        $internalTests27 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processLimit'  => ['?'],
            'processOffset' => ['?'],
        ];

        // joins with a few keywords in the on clause
        $select28 = new Select;
        // @codingStandardsIgnoreStart
        $select28->from('foo')->join('zac', '(m = n AND c.x) BETWEEN x AND y.z OR (c.x < y.z AND c.x <= y.z AND c.x > y.z AND c.x >= y.z)');
        $sqlPrep28 = // same
        $sqlStr28 = 'SELECT "foo".*, "zac".* FROM "foo" INNER JOIN "zac" ON ("m" = "n" AND "c"."x") BETWEEN "x" AND "y"."z" OR ("c"."x" < "y"."z" AND "c"."x" <= "y"."z" AND "c"."x" > "y"."z" AND "c"."x" >= "y"."z")';
        // @codingStandardsIgnoreEnd
        $internalTests28 = [
            'processSelect' => [[['"foo".*'], ['"zac".*']], '"foo"'],
            // @codingStandardsIgnoreStart
            'processJoins'  => [[['INNER', '"zac"', '("m" = "n" AND "c"."x") BETWEEN "x" AND "y"."z" OR ("c"."x" < "y"."z" AND "c"."x" <= "y"."z" AND "c"."x" > "y"."z" AND "c"."x" >= "y"."z")']]],
            // @codingStandardsIgnoreEnd
        ];

        // order with compound name
        $select29 = new Select;
        $select29->from('foo')->order('c1.d2');
        $sqlPrep29 = //
        $sqlStr29 = 'SELECT "foo".* FROM "foo" ORDER BY "c1"."d2" ASC';
        $internalTests29 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processOrder'  => [[['"c1"."d2"', Select::ORDER_ASCENDING]]],
        ];

        // group with compound name
        $select30 = new Select;
        $select30->from('foo')->group('c1.d2');
        $sqlPrep30 = // same
        $sqlStr30 = 'SELECT "foo".* FROM "foo" GROUP BY "c1"."d2"';
        $internalTests30 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processGroup'  => [['"c1"."d2"']],
        ];

        // join with expression in ON part
        $select31 = new Select;
        $select31->from('foo')->join('zac', new Expression('(m = n AND c.x) BETWEEN x AND y.z'));
        $sqlPrep31 = // same
        $sqlStr31 = 'SELECT "foo".*, "zac".* FROM "foo" INNER JOIN "zac" ON (m = n AND c.x) BETWEEN x AND y.z';
        $internalTests31 = [
            'processSelect' => [[['"foo".*'], ['"zac".*']], '"foo"'],
            'processJoins'   => [[['INNER', '"zac"', '(m = n AND c.x) BETWEEN x AND y.z']]],
        ];

        $select32subselect = new Select;
        $select32subselect->from('bar')->where->like('y', '%Foo%');
        $select32 = new Select;
        $select32->from(['x' => $select32subselect]);
        $sqlPrep32 = 'SELECT "x".* FROM (SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "x"';
        $sqlStr32 = 'SELECT "x".* FROM (SELECT "bar".* FROM "bar" WHERE "y" LIKE \'%Foo%\') AS "x"';
        $internalTests32 = [
            'processSelect' => [[['"x".*']], '(SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "x"'],
        ];

        $select33 = new Select;
        $select33->from('table')->columns(['*'])->where([
            'c1' => null,
            'c2' => [1, 2, 3],
            new \Zend\Db\Sql\Predicate\IsNotNull('c3'),
        ]);
        $sqlPrep33 = 'SELECT "table".* FROM "table" WHERE "c1" IS NULL AND "c2" IN (?, ?, ?) AND "c3" IS NOT NULL';
        // @codingStandardsIgnoreStart
        $sqlStr33 = 'SELECT "table".* FROM "table" WHERE "c1" IS NULL AND "c2" IN (\'1\', \'2\', \'3\') AND "c3" IS NOT NULL';
        // @codingStandardsIgnoreEnd
        $internalTests33 = [
            'processSelect' => [[['"table".*']], '"table"'],
            'processWhere'  => ['"c1" IS NULL AND "c2" IN (?, ?, ?) AND "c3" IS NOT NULL'],
        ];

        // @author Demian Katz
        $select34 = new Select;
        $select34->from('table')->order([
            new Expression('isnull(?) DESC', ['name'], [Expression::TYPE_IDENTIFIER]),
            'name',
        ]);
        $sqlPrep34 = 'SELECT "table".* FROM "table" ORDER BY isnull("name") DESC, "name" ASC';
        $sqlStr34 = 'SELECT "table".* FROM "table" ORDER BY isnull("name") DESC, "name" ASC';
        $internalTests34 = [
            'processOrder'  => [[['isnull("name") DESC'], ['"name"', Select::ORDER_ASCENDING]]],
        ];

        // join with Expression object in COLUMNS part (ZF2-514)
        // @co-author Koen Pieters (kpieters)
        $select35 = new Select;
        $select35->from('foo')->columns([])->join('bar', 'm = n', ['thecount' => new Expression("COUNT(*)")]);
        $sqlPrep35 = // same
        $sqlStr35 = 'SELECT COUNT(*) AS "thecount" FROM "foo" INNER JOIN "bar" ON "m" = "n"';
        $internalTests35 = [
            'processSelect' => [[['COUNT(*)', '"thecount"']], '"foo"'],
            'processJoins'   => [[['INNER', '"bar"', '"m" = "n"']]],
        ];

        // multiple joins with expressions
        // reported by @jdolieslager
        $select36 = new Select;
        $select36->from('foo')
            ->join('tableA', new Predicate\Operator('id', '=', 1))
            ->join('tableB', new Predicate\Operator('id', '=', 2))
            ->join('tableC', new Predicate\PredicateSet([
                new Predicate\Operator('id', '=', 3),
                new Predicate\Operator('number', '>', 20),
            ]));
        $sqlPrep36 = 'SELECT "foo".*, "tableA".*, "tableB".*, "tableC".* FROM "foo"'
            . ' INNER JOIN "tableA" ON "id" = :join1part1 INNER JOIN "tableB" ON "id" = :join2part1 '
            . 'INNER JOIN "tableC" ON "id" = :join3part1 AND "number" > :join3part2';
        $sqlStr36 = 'SELECT "foo".*, "tableA".*, "tableB".*, "tableC".* FROM "foo" '
            . 'INNER JOIN "tableA" ON "id" = \'1\' INNER JOIN "tableB" ON "id" = \'2\' '
            . 'INNER JOIN "tableC" ON "id" = \'3\' AND "number" > \'20\'';
        $internalTests36 = [];
        $useNamedParams36 = true;

        /**
         * @author robertbasic
         * @link https://github.com/zendframework/zf2/pull/2714
         */
        $select37 = new Select;
        $select37->from('foo')->columns(['bar'], false);
        $sqlPrep37 = // same
        $sqlStr37 = 'SELECT "bar" AS "bar" FROM "foo"';
        $internalTests37 = [
            'processSelect' => [[['"bar"', '"bar"']], '"foo"'],
        ];

        // @link https://github.com/zendframework/zf2/issues/3294
        // Test TableIdentifier In Joins
        $select38 = new Select;
        $select38->from('foo')->columns([])
            ->join(new TableIdentifier('bar', 'baz'), 'm = n', ['thecount' => new Expression("COUNT(*)")]);
        $sqlPrep38 = // same
        $sqlStr38 = 'SELECT COUNT(*) AS "thecount" FROM "foo" INNER JOIN "baz"."bar" ON "m" = "n"';
        $internalTests38 = [
            'processSelect' => [[['COUNT(*)', '"thecount"']], '"foo"'],
            'processJoins'   => [[['INNER', '"baz"."bar"', '"m" = "n"']]],
        ];

        // subselect in join
        $select39subselect = new Select;
        $select39subselect->from('bar')->where->like('y', '%Foo%');
        $select39 = new Select;
        $select39->from('foo')->join(['z' => $select39subselect], 'z.foo = bar.id');
        // @codingStandardsIgnoreStart
        $sqlPrep39 = 'SELECT "foo".*, "z".* FROM "foo" INNER JOIN (SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "z" ON "z"."foo" = "bar"."id"';
        $sqlStr39 = 'SELECT "foo".*, "z".* FROM "foo" INNER JOIN (SELECT "bar".* FROM "bar" WHERE "y" LIKE \'%Foo%\') AS "z" ON "z"."foo" = "bar"."id"';
        // @codingStandardsIgnoreEnd
        $internalTests39 = [
            'processJoins' => [
                [['INNER', '(SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "z"', '"z"."foo" = "bar"."id"']],
            ],
        ];

        // @link https://github.com/zendframework/zf2/issues/3294
        // Test TableIdentifier In Joins, with multiple joins
        $select40 = new Select;
        $select40->from('foo')
            ->join(['a' => new TableIdentifier('another_foo', 'another_schema')], 'a.x = foo.foo_column')
            ->join('bar', 'foo.colx = bar.colx');
        $sqlPrep40 = // same
        $sqlStr40 = 'SELECT "foo".*, "a".*, "bar".* FROM "foo"'
            . ' INNER JOIN "another_schema"."another_foo" AS "a" ON "a"."x" = "foo"."foo_column"'
            . ' INNER JOIN "bar" ON "foo"."colx" = "bar"."colx"';
        $internalTests40 = [
            'processSelect' => [[['"foo".*'], ['"a".*'], ['"bar".*']], '"foo"'],
            'processJoins'  => [[
                ['INNER', '"another_schema"."another_foo" AS "a"', '"a"."x" = "foo"."foo_column"'],
                ['INNER', '"bar"', '"foo"."colx" = "bar"."colx"'],
            ]],
        ];

        $select41 = new Select;
        $select41->from('foo')->quantifier(Select::QUANTIFIER_DISTINCT);
        $sqlPrep41 = // same
        $sqlStr41 = 'SELECT DISTINCT "foo".* FROM "foo"';
        $internalTests41 = [
            'processSelect' => [SELECT::QUANTIFIER_DISTINCT, [['"foo".*']], '"foo"'],
        ];

        $select42 = new Select;
        $select42->from('foo')->quantifier(new Expression('TOP ?', [10]));
        $sqlPrep42 = 'SELECT TOP ? "foo".* FROM "foo"';
        $sqlStr42 = 'SELECT TOP \'10\' "foo".* FROM "foo"';
        $internalTests42 = [
            'processSelect' => ['TOP ?', [['"foo".*']], '"foo"'],
        ];

        $select43 = new Select();
        $select43->from(['x' => 'foo'])->columns(['bar' => 'foo.bar'], false);
        $sqlPrep43 = 'SELECT "foo"."bar" AS "bar" FROM "foo" AS "x"';
        $sqlStr43 = 'SELECT "foo"."bar" AS "bar" FROM "foo" AS "x"';
        $internalTests43 = [
            'processSelect' => [[['"foo"."bar"', '"bar"']], '"foo" AS "x"'],
        ];

        $select44 = new Select;
        $select44->from('foo')->where('a = b');
        $select44b = new Select;
        $select44b->from('bar')->where('c = d');
        $select44->combine($select44b, Select::COMBINE_UNION, 'ALL');
        $sqlPrep44 = // same
        $sqlStr44 = '( SELECT "foo".* FROM "foo" WHERE a = b ) UNION ALL ( SELECT "bar".* FROM "bar" WHERE c = d )';
        $internalTests44 = [
            'processCombine' => ['UNION ALL', 'SELECT "bar".* FROM "bar" WHERE c = d'],
        ];

        // limit with offset
        $select45 = new Select;
        $select45->from('foo')->limit("5")->offset("10");
        $sqlPrep45 = 'SELECT "foo".* FROM "foo" LIMIT ? OFFSET ?';
        $sqlStr45 = 'SELECT "foo".* FROM "foo" LIMIT \'5\' OFFSET \'10\'';
        $params45 = ['limit' => 5, 'offset' => 10];
        $internalTests45 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processLimit'  => ['?'],
            'processOffset' => ['?'],
        ];

        // functions without table
        $select46 = new Select;
        $select46->columns([
            new Expression('SOME_DB_FUNCTION_ONE()'),
            'foo' => new Expression('SOME_DB_FUNCTION_TWO()'),
        ]);
        $sqlPrep46 = 'SELECT SOME_DB_FUNCTION_ONE() AS Expression1, SOME_DB_FUNCTION_TWO() AS "foo"';
        $sqlStr46 = 'SELECT SOME_DB_FUNCTION_ONE() AS Expression1, SOME_DB_FUNCTION_TWO() AS "foo"';
        $params46 = [];
        $internalTests46 = [];

        // limit with big offset and limit
        $select47 = new Select;
        $select47->from('foo')->limit("10000000000000000000")->offset("10000000000000000000");
        $sqlPrep47 = 'SELECT "foo".* FROM "foo" LIMIT ? OFFSET ?';
        $sqlStr47 = 'SELECT "foo".* FROM "foo" LIMIT \'10000000000000000000\' OFFSET \'10000000000000000000\'';
        $params47 = ['limit' => 10000000000000000000, 'offset' => 10000000000000000000];
        $internalTests47 = [
            'processSelect' => [[['"foo".*']], '"foo"'],
            'processLimit'  => ['?'],
            'processOffset' => ['?'],
        ];

        //combine and union with order at the end
        $select48 = new Select;
        $select48->from('foo')->where('a = b');
        $select48b = new Select;
        $select48b->from('bar')->where('c = d');
        $select48->combine($select48b);

        $select48combined = new Select();
        $select48 = $select48combined->from(['sub' => $select48])->order('id DESC');
        // @codingStandardsIgnoreStart
        $sqlPrep48 = // same
        $sqlStr48 = 'SELECT "sub".* FROM (( SELECT "foo".* FROM "foo" WHERE a = b ) UNION ( SELECT "bar".* FROM "bar" WHERE c = d )) AS "sub" ORDER BY "id" DESC';
        // @codingStandardsIgnoreEnd
        $internalTests48 = [
            'processCombine' => null,
        ];

        //Expression as joinName
        $select49 = new Select;
        $select49->from(new TableIdentifier('foo'))
                ->join(['bar' => new Expression('psql_function_which_returns_table')], 'foo.id = bar.fooid');
        // @codingStandardsIgnoreStart
        $sqlPrep49 = // same
        $sqlStr49 = 'SELECT "foo".*, "bar".* FROM "foo" INNER JOIN psql_function_which_returns_table AS "bar" ON "foo"."id" = "bar"."fooid"';
        // @codingStandardsIgnoreEnd
        $internalTests49 = [
            'processSelect' => [[['"foo".*'], ['"bar".*']], '"foo"'],
            'processJoins' => [[['INNER', 'psql_function_which_returns_table AS "bar"', '"foo"."id" = "bar"."fooid"']]],
        ];

        // Test generic predicate is appended with AND
        $select50 = new Select;
        $select50->from(new TableIdentifier('foo'))
            ->where
            ->nest
                ->isNull('bar')
                ->and
                ->predicate(new Predicate\Literal('1=1'))
            ->unnest;
        $sqlPrep50 = // same
        $sqlStr50 = 'SELECT "foo".* FROM "foo" WHERE ("bar" IS NULL AND 1=1)';
        $internalTests50 = [];

        // Test generic predicate is appended with OR
        $select51 = new Select;
        $select51->from(new TableIdentifier('foo'))
            ->where
            ->nest
                ->isNull('bar')
                ->or
                ->predicate(new Predicate\Literal('1=1'))
            ->unnest;
        $sqlPrep51 = // same
        $sqlStr51 = 'SELECT "foo".* FROM "foo" WHERE ("bar" IS NULL OR 1=1)';
        $internalTests51 = [];

        /**
         * @author Andrzej Lewandowski
         * @link https://github.com/zendframework/zf2/issues/7222
         */
        $select52 = new Select;
        $select52->from('foo')->join('zac', '(catalog_category_website.category_id = catalog_category.category_id)');
        // @codingStandardsIgnoreStart
        $sqlPrep52 = // same
        $sqlStr52 = 'SELECT "foo".*, "zac".* FROM "foo" INNER JOIN "zac" ON ("catalog_category_website"."category_id" = "catalog_category"."category_id")';
        // @codingStandardsIgnoreEnd
        $internalTests52 = [
            'processSelect' => [[['"foo".*'], ['"zac".*']], '"foo"'],
            'processJoins'  => [[
                ['INNER', '"zac"', '("catalog_category_website"."category_id" = "catalog_category"."category_id")'],
            ]],
        ];

        /**
         * $select = the select object
         * $sqlPrep = the sql as a result of preparation
         * $params = the param container contents result of preparation
         * $sqlStr = the sql as a result of getting a string back
         * $internalTests what the internal functions should return (safe-guarding extension)
         */

        return [
            //    $select    $sqlPrep    $params     $sqlStr    $internalTests    // use named param
            [$select0,  $sqlPrep0,  [],    $sqlStr0,  $internalTests0],
            [$select1,  $sqlPrep1,  [],    $sqlStr1,  $internalTests1],
            [$select2,  $sqlPrep2,  [],    $sqlStr2,  $internalTests2],
            [$select3,  $sqlPrep3,  [],    $sqlStr3,  $internalTests3],
            [$select4,  $sqlPrep4,  [],    $sqlStr4,  $internalTests4],
            [$select5,  $sqlPrep5,  [],    $sqlStr5,  $internalTests5],
            [$select6,  $sqlPrep6,  [],    $sqlStr6,  $internalTests6],
            [$select7,  $sqlPrep7,  [],    $sqlStr7,  $internalTests7],
            [$select8,  $sqlPrep8,  [],    $sqlStr8,  $internalTests8],
            [$select9,  $sqlPrep9,  $params9,   $sqlStr9,  $internalTests9],
            [$select10, $sqlPrep10, [],    $sqlStr10, $internalTests10],
            [$select11, $sqlPrep11, [],    $sqlStr11, $internalTests11],
            [$select12, $sqlPrep12, [],    $sqlStr12, $internalTests12],
            [$select13, $sqlPrep13, [],    $sqlStr13, $internalTests13],
            [$select14, $sqlPrep14, [],    $sqlStr14, $internalTests14],
            [$select15, $sqlPrep15, [],    $sqlStr15, $internalTests15],
            [$select16, $sqlPrep16, $params16,  $sqlStr16, $internalTests16],
            [$select17, $sqlPrep17, [],    $sqlStr17, $internalTests17],
            [$select18, $sqlPrep18, [],    $sqlStr18, $internalTests18],
            [$select19, $sqlPrep19, [],    $sqlStr19, $internalTests19],
            [$select20, $sqlPrep20, [],    $sqlStr20, $internalTests20],
            [$select21, $sqlPrep21, $params21,  $sqlStr21, $internalTests21],
            [$select22, $sqlPrep22, [],    $sqlStr22, $internalTests22],
            [$select23, $sqlPrep23, [],    $sqlStr23, $internalTests23],
            [$select24, $sqlPrep24, [],    $sqlStr24, $internalTests24],
            [$select25, $sqlPrep25, [],    $sqlStr25, $internalTests25],
            [$select26, $sqlPrep26, $params26,  $sqlStr26, $internalTests26],
            [$select27, $sqlPrep27, $params27,  $sqlStr27, $internalTests27],
            [$select28, $sqlPrep28, [],    $sqlStr28, $internalTests28],
            [$select29, $sqlPrep29, [],    $sqlStr29, $internalTests29],
            [$select30, $sqlPrep30, [],    $sqlStr30, $internalTests30],
            [$select31, $sqlPrep31, [],    $sqlStr31, $internalTests31],
            [$select32, $sqlPrep32, [],    $sqlStr32, $internalTests32],
            [$select33, $sqlPrep33, [],    $sqlStr33, $internalTests33],
            [$select34, $sqlPrep34, [],    $sqlStr34, $internalTests34],
            [$select35, $sqlPrep35, [],    $sqlStr35, $internalTests35],
            [$select36, $sqlPrep36, [],    $sqlStr36, $internalTests36,  $useNamedParams36],
            [$select37, $sqlPrep37, [],    $sqlStr37, $internalTests37],
            [$select38, $sqlPrep38, [],    $sqlStr38, $internalTests38],
            [$select39, $sqlPrep39, [],    $sqlStr39, $internalTests39],
            [$select40, $sqlPrep40, [],    $sqlStr40, $internalTests40],
            [$select41, $sqlPrep41, [],    $sqlStr41, $internalTests41],
            [$select42, $sqlPrep42, [],    $sqlStr42, $internalTests42],
            [$select43, $sqlPrep43, [],    $sqlStr43, $internalTests43],
            [$select44, $sqlPrep44, [],    $sqlStr44, $internalTests44],
            [$select45, $sqlPrep45, $params45,  $sqlStr45, $internalTests45],
            [$select46, $sqlPrep46, $params46,  $sqlStr46, $internalTests46],
            [$select47, $sqlPrep47, $params47,  $sqlStr47, $internalTests47],
            [$select48, $sqlPrep48, [],    $sqlStr48, $internalTests48],
            [$select49, $sqlPrep49, [],    $sqlStr49, $internalTests49],
            [$select50, $sqlPrep50, [],    $sqlStr50, $internalTests50],
            [$select51, $sqlPrep51, [],    $sqlStr51, $internalTests51],
            [$select52, $sqlPrep52, [],    $sqlStr52, $internalTests52],
        ];
    }
}
