<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use Zend\Db\Sql\Select;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Where;
use Zend\Db\Sql\Predicate;
use Zend\Db\Sql\TableIdentifier;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\Sql92;
use ZendTest\Db\TestAsset\TrustingSql92Platform;

class SelectTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @covers Zend\Db\Sql\Select::__construct
     */
    public function testConstruct()
    {
        $select = new Select('foo');
        $this->assertEquals('foo', $select->getRawState('table'));
    }

    /**
     * @testdox unit test: Test from() returns Select object (is chainable)
     * @covers Zend\Db\Sql\Select::from
     */
    public function testFrom()
    {
        $select = new Select;
        $return = $select->from('foo', 'bar');
        $this->assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via from()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testFrom
     */
    public function testGetRawStateViaFrom(Select $select)
    {
        $this->assertEquals('foo', $select->getRawState('table'));
    }

    /**
     * @testdox unit test: Test quantifier() returns Select object (is chainable)
     * @covers Zend\Db\Sql\Select::quantifier
     */
    public function testQuantifier()
    {
        $select = new Select;
        $return = $select->quantifier($select::QUANTIFIER_DISTINCT);
        $this->assertSame($select, $return);
        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via from()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testQuantifier
     */
    public function testGetRawStateViaQuantifier(Select $select)
    {
        $this->assertEquals(Select::QUANTIFIER_DISTINCT, $select->getRawState('quantifier'));
    }

    /**
     * @testdox unit test: Test columns() returns Select object (is chainable)
     * @covers Zend\Db\Sql\Select::columns
     */
    public function testColumns()
    {
        $select = new Select;
        $return = $select->columns(array('foo', 'bar'));
        $this->assertSame($select, $return);

        return $select;
    }

    /**
     * @testdox unit test: Test isTableReadOnly() returns correct state for read only
     * @covers Zend\Db\Sql\Select::isTableReadOnly
     */
    public function testIsTableReadOnly()
    {
        $select = new Select('foo');
        $this->assertTrue($select->isTableReadOnly());

        $select = new Select;
        $this->assertFalse($select->isTableReadOnly());
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via columns()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testColumns
     */
    public function testGetRawStateViaColumns(Select $select)
    {
        $this->assertEquals(array('foo', 'bar'), $select->getRawState('columns'));
    }

    /**
     * @testdox unit test: Test join() returns same Select object (is chainable)
     * @covers Zend\Db\Sql\Select::join
     */
    public function testJoin()
    {
        $select = new Select;
        $return = $select->join('foo', 'x = y', Select::SQL_STAR, Select::JOIN_INNER);
        $this->assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test join() exception with bad join
     * @covers Zend\Db\Sql\Select::join
     */
    public function testBadJoin()
    {
        $select = new Select;
        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', "expects 'foo' as");
        $select->join(array('foo'), 'x = y', Select::SQL_STAR, Select::JOIN_INNER);
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via join()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testJoin
     */
    public function testGetRawStateViaJoin(Select $select)
    {
        $this->assertEquals(
            array(array(
                'name' => 'foo',
                'on' => 'x = y',
                'columns' => array(Select::SQL_STAR),
                'type' => Select::JOIN_INNER
            )),
            $select->getRawState('joins')
        );
    }

    /**
     * @testdox unit test: Test where() returns Select object (is chainable)
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereReturnsSameSelectObject()
    {
        $select = new Select;
        $this->assertSame($select, $select->where('x = y'));
    }

    /**
     * @testdox unit test: Test where() will accept a string for the predicate to create an expression predicate
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsString()
    {
        $select = new Select;
        $select->where('x = ?');

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertEquals(1, count($predicates));
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Expression', $predicates[0][1]);
        $this->assertEquals(Where::OP_AND, $predicates[0][0]);
        $this->assertEquals('x = ?', $predicates[0][1]->getExpression());

        $select = new Select;
        $select->where('x = y');

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
    }

    /**
     * @testdox unit test: Test where() will accept an array with a string key (containing ?) used as an expression with placeholder
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsAssociativeArrayContainingReplacementCharacter()
    {
        $select = new Select;
        $select->where(array('foo > ?' => 5));

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertEquals(1, count($predicates));
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Expression', $predicates[0][1]);
        $this->assertEquals(Where::OP_AND, $predicates[0][0]);
        $this->assertEquals('foo > ?', $predicates[0][1]->getExpression());
        $this->assertEquals(array(5), $predicates[0][1]->getParameters());
    }

    /**
     * @testdox unit test: Test where() will accept any array with string key (without ?) to be used as Operator predicate
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsAssociativeArrayNotContainingReplacementCharacter()
    {
        $select = new Select;
        $select->where(array('name' => 'Ralph', 'age' => 33));

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertEquals(2, count($predicates));

        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[0][1]);
        $this->assertEquals(Where::OP_AND, $predicates[0][0]);
        $this->assertEquals('name', $predicates[0][1]->getLeft());
        $this->assertEquals('Ralph', $predicates[0][1]->getRight());

        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[1][1]);
        $this->assertEquals(Where::OP_AND, $predicates[1][0]);
        $this->assertEquals('age', $predicates[1][1]->getLeft());
        $this->assertEquals(33, $predicates[1][1]->getRight());

        $select = new Select;
        $select->where(array('x = y'));

        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
    }

    /**
     * @testdox unit test: Test where() will accept any array with string key (without ?) with Predicate throw Exception
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsAssociativeArrayIsPredicate()
    {
        $select = new Select;
            $where = array(
            'name' => new Predicate\Literal("name = 'Ralph'"),
            'age' => new Predicate\Expression('age = ?', 33),
        );
        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', 'Using Predicate must not use string keys');
        $select->where($where);
    }

    /**
     * @testdox unit test: Test where() will accept an indexed array to be used by joining string expressions
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsIndexedArray()
    {
        $select = new Select;
        $select->where(array('name = "Ralph"'));

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertEquals(1, count($predicates));

        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
        $this->assertEquals(Where::OP_AND, $predicates[0][0]);
        $this->assertEquals('name = "Ralph"', $predicates[0][1]->getLiteral());
    }

    /**
     * @testdox unit test: Test where() will accept an indexed array to be used by joining string expressions, combined by OR
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsIndexedArrayArgument2IsOr()
    {
        $select = new Select;
        $select->where(array('name = "Ralph"'), Where::OP_OR);

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertEquals(1, count($predicates));

        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);
        $this->assertEquals(Where::OP_OR, $predicates[0][0]);
        $this->assertEquals('name = "Ralph"', $predicates[0][1]->getLiteral());
    }

    /**
     * @testdox unit test: Test where() will accept a closure to be executed with Where object as argument
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsClosure()
    {
        $select = new Select;
        $where = $select->getRawState('where');

        $test = $this;
        $select->where(function ($what) use ($test, $where) {
            $test->assertSame($where, $what);
        });
    }

    /**
     * @testdox unit test: Test where() will accept any Predicate object as-is
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsPredicate()
    {
        $select = new Select;
        $predicate = new Predicate\Predicate(array(
            new Predicate\Expression('name = ?', 'Ralph'),
            new Predicate\Expression('age = ?', 33),
        ));
        $select->where($predicate);

        /** @var $where Where */
        $where = $select->getRawState('where');
        $predicates = $where->getPredicates();
        $this->assertSame($predicate, $predicates[0][1]);
    }

    /**
     * @testdox unit test: Test where() will accept a Where object
     * @covers Zend\Db\Sql\Select::where
     */
    public function testWhereArgument1IsWhereObject()
    {
        $select = new Select;
        $select->where($newWhere = new Where);
        $this->assertSame($newWhere, $select->getRawState('where'));
    }

    /**
     * @author Rob Allen
     * @testdox unit test: Test order()
     * @covers Zend\Db\Sql\Select::order
     */
    public function testOrder()
    {
        $select = new Select;
        $return = $select->order('id DESC');
        $this->assertSame($select, $return); // test fluent interface
        $this->assertEquals(array('id DESC'), $select->getRawState('order'));

        $select = new Select;
        $select->order('id DESC')
            ->order('name ASC, age DESC');
        $this->assertEquals(array('id DESC', 'name ASC', 'age DESC'), $select->getRawState('order'));

        $select = new Select;
        $select->order(array('name ASC', 'age DESC'));
        $this->assertEquals(array('name ASC', 'age DESC'), $select->getRawState('order'));

        $select = new Select;
        $select->order(new Expression('RAND()'));
        $this->assertEquals('RAND()', current($select->getRawState('order'))->getExpression());
    }

    /**
     * @testdox: unit test: test limit()
     * @covers Zend\Db\Sql\Select::limit
     */
    public function testLimit()
    {
        $select = new Select;
        $this->assertSame($select, $select->limit(5));
        return $select;
    }

    /**
     * @testdox: unit test: Test getRawState() returns information populated via limit()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testLimit
     */
    public function testGetRawStateViaLimit(Select $select)
    {
        $this->assertEquals(5, $select->getRawState($select::LIMIT));
    }

    /**
     * @testdox: unit test: test limit() throws execption when invalid parameter passed
     * @covers Zend\Db\Sql\Select::limit
     */
    public function testLimitExceptionOnInvalidParameter()
    {
        $select = new Select;
        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', 'Zend\Db\Sql\Select::limit expects parameter to be numeric');
        $select->limit('foobar');
    }

    /**
     * @testdox: unit test: test offset()
     * @covers Zend\Db\Sql\Select::offset
     */
    public function testOffset()
    {
        $select = new Select;
        $this->assertSame($select, $select->offset(10));
        return $select;
    }

    /**
     * @testdox: unit test: Test getRawState() returns information populated via offset()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testOffset
     */
    public function testGetRawStateViaOffset(Select $select)
    {
        $this->assertEquals(10, $select->getRawState($select::OFFSET));
    }

    /**
     * @testdox: unit test: test offset() throws exception when invalid parameter passed
     * @covers Zend\Db\Sql\Select::offset
     */
    public function testOffsetExceptionOnInvalidParameter()
    {
        $select = new Select;
        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', 'Zend\Db\Sql\Select::offset expects parameter to be numeric');
        $select->offset('foobar');
    }


    /**
     * @testdox unit test: Test group() returns same Select object (is chainable)
     * @covers Zend\Db\Sql\Select::group
     */
    public function testGroup()
    {
        $select = new Select;
        $return = $select->group(array('col1', 'col2'));
        $this->assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via group()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testGroup
     */
    public function testGetRawStateViaGroup(Select $select)
    {
        $this->assertEquals(
            array('col1', 'col2'),
            $select->getRawState('group')
        );
    }

    /**
     * @testdox unit test: Test having() returns same Select object (is chainable)
     * @covers Zend\Db\Sql\Select::having
     */
    public function testHaving()
    {
        $select = new Select;
        $return = $select->having(array('x = ?' => 5));
        $this->assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via having()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testHaving
     */
    public function testGetRawStateViaHaving(Select $select)
    {
        $this->assertInstanceOf('Zend\Db\Sql\Having', $select->getRawState('having'));
    }

    /**
     * @testdox unit test: Test combine() returns same Select object (is chainable)
     * @covers Zend\Db\Sql\Select::combine
     */
    public function testCombine()
    {
        $select = new Select;
        $combine = new Select;
        $return = $select->combine($combine, $select::COMBINE_UNION, 'ALL');
        $this->assertSame($select, $return);

        return $return;
    }

    /**
     * @testdox unit test: Test getRawState() returns information populated via combine()
     * @covers Zend\Db\Sql\Select::getRawState
     * @depends testCombine
     */
    public function testGetRawStateViaCombine(Select $select)
    {
        $state = $select->getRawState('combine');
        $this->assertInstanceOf('Zend\Db\Sql\Select', $state['select']);
        $this->assertNotSame($select, $state['select']);
        $this->assertEquals(Select::COMBINE_UNION, $state['type']);
        $this->assertEquals('ALL', $state['modifier']);
    }

    /**
     * @testdox unit test: Test reset() resets internal stat of Select object, based on input
     * @covers Zend\Db\Sql\Select::reset
     */
    public function testReset()
    {
        $select = new Select;

        // table
        $select->from('foo');
        $this->assertEquals('foo', $select->getRawState(Select::TABLE));
        $select->reset(Select::TABLE);
        $this->assertNull($select->getRawState(Select::TABLE));

        // columns
        $select->columns(array('foo'));
        $this->assertEquals(array('foo'), $select->getRawState(Select::COLUMNS));
        $select->reset(Select::COLUMNS);
        $this->assertEmpty($select->getRawState(Select::COLUMNS));

        // joins
        $select->join('foo', 'id = boo');
        $this->assertEquals(array(array('name' => 'foo', 'on' => 'id = boo', 'columns' => array('*'), 'type' => 'inner')), $select->getRawState(Select::JOINS));
        $select->reset(Select::JOINS);
        $this->assertEmpty($select->getRawState(Select::JOINS));

        // where
        $select->where('foo = bar');
        $where1 = $select->getRawState(Select::WHERE);
        $this->assertEquals(1, $where1->count());
        $select->reset(Select::WHERE);
        $where2 = $select->getRawState(Select::WHERE);
        $this->assertEquals(0, $where2->count());
        $this->assertNotSame($where1, $where2);

        // group
        $select->group(array('foo'));
        $this->assertEquals(array('foo'), $select->getRawState(Select::GROUP));
        $select->reset(Select::GROUP);
        $this->assertEmpty($select->getRawState(Select::GROUP));

        // having
        $select->having('foo = bar');
        $having1 = $select->getRawState(Select::HAVING);
        $this->assertEquals(1, $having1->count());
        $select->reset(Select::HAVING);
        $having2 = $select->getRawState(Select::HAVING);
        $this->assertEquals(0, $having2->count());
        $this->assertNotSame($having1, $having2);

        // limit
        $select->limit(5);
        $this->assertEquals(5, $select->getRawState(Select::LIMIT));
        $select->reset(Select::LIMIT);
        $this->assertNull($select->getRawState(Select::LIMIT));

        // offset
        $select->offset(10);
        $this->assertEquals(10, $select->getRawState(Select::OFFSET));
        $select->reset(Select::OFFSET);
        $this->assertNull($select->getRawState(Select::OFFSET));

        // order
        $select->order('foo asc');
        $this->assertEquals(array('foo asc'), $select->getRawState(Select::ORDER));
        $select->reset(Select::ORDER);
        $this->assertEmpty($select->getRawState(Select::ORDER));
    }

    /**
     * @testdox unit test: Test prepareStatement() will produce expected sql and parameters based on a variety of provided arguments [uses data provider]
     * @covers Zend\Db\Sql\Select::prepareStatement
     * @dataProvider providerData
     */
    public function testPrepareStatement(Select $select, $expectedSqlString, $expectedParameters, $unused1, $unused2, $useNamedParameters = false)
    {
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnCallback(
            function ($name) use ($useNamedParameters) { return (($useNamedParameters) ? ':' . $name : '?'); }
        ));
        $mockAdapter = $this->getMock('Zend\Db\Adapter\Adapter', null, array($mockDriver));

        $parameterContainer = new ParameterContainer();

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($parameterContainer));
        $mockStatement->expects($this->any())->method('setSql')->with($this->equalTo($expectedSqlString));

        $select->prepareStatement($mockAdapter, $mockStatement);

        if ($expectedParameters) {
            $this->assertEquals($expectedParameters, $parameterContainer->getNamedArray());
        }
    }

    /**
     * @testdox unit test: Test getSqlString() will produce expected sql and parameters based on a variety of provided arguments [uses data provider]
     * @covers Zend\Db\Sql\Select::getSqlString
     * @dataProvider providerData
     */
    public function testGetSqlString(Select $select, $unused, $unused2, $expectedSqlString)
    {
        $this->assertEquals($expectedSqlString, $select->getSqlString(new TrustingSql92Platform()));
    }

    /**
     * @testdox unit test: Test __get() returns expected objects magically
     * @covers Zend\Db\Sql\Select::__get
     */
    public function test__get()
    {
        $select = new Select;
        $this->assertInstanceOf('Zend\Db\Sql\Where', $select->where);
    }

    /**
     * @testdox unit test: Test __clone() will clone the where object so that this select can be used in multiple contexts
     * @covers Zend\Db\Sql\Select::__clone
     */
    public function test__clone()
    {
        $select = new Select;
        $select1 = clone $select;
        $select1->where('id = foo');
        $select1->having('id = foo');

        $this->assertEquals(0, $select->where->count());
        $this->assertEquals(1, $select1->where->count());

        $this->assertEquals(0, $select->having->count());
        $this->assertEquals(1, $select1->having->count());
    }

    /**
     * @testdox unit test: Text process*() methods will return proper array when internally called, part of extension API
     * @dataProvider providerData
     * @covers Zend\Db\Sql\Select::processSelect
     * @covers Zend\Db\Sql\Select::processJoins
     * @covers Zend\Db\Sql\Select::processWhere
     * @covers Zend\Db\Sql\Select::processGroup
     * @covers Zend\Db\Sql\Select::processHaving
     * @covers Zend\Db\Sql\Select::processOrder
     * @covers Zend\Db\Sql\Select::processLimit
     * @covers Zend\Db\Sql\Select::processOffset
     * @covers Zend\Db\Sql\Select::processCombine
     */
    public function testProcessMethods(Select $select, $unused, $unused2, $unused3, $internalTests)
    {
        if (!$internalTests) {
            return;
        }

        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $parameterContainer = new ParameterContainer();

        $sr = new \ReflectionObject($select);

        foreach ($internalTests as $method => $expected) {
            $mr = $sr->getMethod($method);
            $mr->setAccessible(true);
            $return = $mr->invokeArgs($select, array(new Sql92, $mockDriver, $parameterContainer));
            $this->assertEquals($expected, $return);
        }
    }

    public function providerData()
    {
        // basic table
        $select0 = new Select;
        $select0->from('foo');
        $sqlPrep0 = // same
        $sqlStr0 = 'SELECT "foo".* FROM "foo"';
        $internalTests0 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"')
        );

        // table as TableIdentifier
        $select1 = new Select;
        $select1->from(new TableIdentifier('foo', 'bar'));
        $sqlPrep1 = // same
        $sqlStr1 = 'SELECT "bar"."foo".* FROM "bar"."foo"';
        $internalTests1 = array(
            'processSelect' => array(array(array('"bar"."foo".*')), '"bar"."foo"')
        );

        // table with alias
        $select2 = new Select;
        $select2->from(array('f' => 'foo'));
        $sqlPrep2 = // same
        $sqlStr2 = 'SELECT "f".* FROM "foo" AS "f"';
        $internalTests2 = array(
            'processSelect' => array(array(array('"f".*')), '"foo" AS "f"')
        );

        // table with alias with table as TableIdentifier
        $select3 = new Select;
        $select3->from(array('f' => new TableIdentifier('foo')));
        $sqlPrep3 = // same
        $sqlStr3 = 'SELECT "f".* FROM "foo" AS "f"';
        $internalTests3 = array(
            'processSelect' => array(array(array('"f".*')), '"foo" AS "f"')
        );

        // columns
        $select4 = new Select;
        $select4->from('foo')->columns(array('bar', 'baz'));
        $sqlPrep4 = // same
        $sqlStr4 = 'SELECT "foo"."bar" AS "bar", "foo"."baz" AS "baz" FROM "foo"';
        $internalTests4 = array(
            'processSelect' => array(array(array('"foo"."bar"', '"bar"'), array('"foo"."baz"', '"baz"')), '"foo"')
        );

        // columns with AS associative array
        $select5 = new Select;
        $select5->from('foo')->columns(array('bar' => 'baz'));
        $sqlPrep5 = // same
        $sqlStr5 = 'SELECT "foo"."baz" AS "bar" FROM "foo"';
        $internalTests5 = array(
            'processSelect' => array(array(array('"foo"."baz"', '"bar"')), '"foo"')
        );

        // columns with AS associative array mixed
        $select6 = new Select;
        $select6->from('foo')->columns(array('bar' => 'baz', 'bam'));
        $sqlPrep6 = // same
        $sqlStr6 = 'SELECT "foo"."baz" AS "bar", "foo"."bam" AS "bam" FROM "foo"';
        $internalTests6 = array(
            'processSelect' => array(array(array('"foo"."baz"', '"bar"'), array('"foo"."bam"', '"bam"') ), '"foo"')
        );

        // columns where value is Expression, with AS
        $select7 = new Select;
        $select7->from('foo')->columns(array('bar' => new Expression('COUNT(some_column)')));
        $sqlPrep7 = // same
        $sqlStr7 = 'SELECT COUNT(some_column) AS "bar" FROM "foo"';
        $internalTests7 = array(
            'processSelect' => array(array(array('COUNT(some_column)', '"bar"')), '"foo"')
        );

        // columns where value is Expression
        $select8 = new Select;
        $select8->from('foo')->columns(array(new Expression('COUNT(some_column) AS bar')));
        $sqlPrep8 = // same
        $sqlStr8 = 'SELECT COUNT(some_column) AS bar FROM "foo"';
        $internalTests8 = array(
            'processSelect' => array(array(array('COUNT(some_column) AS bar')), '"foo"')
        );

        // columns where value is Expression with parameters
        $select9 = new Select;
        $select9->from('foo')->columns(
            array(
                new Expression(
                    '(COUNT(?) + ?) AS ?',
                    array('some_column', 5, 'bar'),
                    array(Expression::TYPE_IDENTIFIER, Expression::TYPE_VALUE, Expression::TYPE_IDENTIFIER)
                )
            )
        );
        $sqlPrep9 = 'SELECT (COUNT("some_column") + ?) AS "bar" FROM "foo"';
        $sqlStr9 = 'SELECT (COUNT("some_column") + \'5\') AS "bar" FROM "foo"';
        $params9 = array('column1' => 5);
        $internalTests9 = array(
            'processSelect' => array(array(array('(COUNT("some_column") + ?) AS "bar"')), '"foo"')
        );

        // joins (plain)
        $select10 = new Select;
        $select10->from('foo')->join('zac', 'm = n');
        $sqlPrep10 = // same
        $sqlStr10 = 'SELECT "foo".*, "zac".* FROM "foo" INNER JOIN "zac" ON "m" = "n"';
        $internalTests10 = array(
            'processSelect' => array(array(array('"foo".*'), array('"zac".*')), '"foo"'),
            'processJoins'   => array(array(array('INNER', '"zac"', '"m" = "n"')))
        );

        // join with columns
        $select11 = new Select;
        $select11->from('foo')->join('zac', 'm = n', array('bar', 'baz'));
        $sqlPrep11 = // same
        $sqlStr11 = 'SELECT "foo".*, "zac"."bar" AS "bar", "zac"."baz" AS "baz" FROM "foo" INNER JOIN "zac" ON "m" = "n"';
        $internalTests11 = array(
            'processSelect' => array(array(array('"foo".*'), array('"zac"."bar"', '"bar"'), array('"zac"."baz"', '"baz"')), '"foo"'),
            'processJoins'   => array(array(array('INNER', '"zac"', '"m" = "n"')))
        );

        // join with alternate type
        $select12 = new Select;
        $select12->from('foo')->join('zac', 'm = n', array('bar', 'baz'), Select::JOIN_OUTER);
        $sqlPrep12 = // same
        $sqlStr12 = 'SELECT "foo".*, "zac"."bar" AS "bar", "zac"."baz" AS "baz" FROM "foo" OUTER JOIN "zac" ON "m" = "n"';
        $internalTests12 = array(
            'processSelect' => array(array(array('"foo".*'), array('"zac"."bar"', '"bar"'), array('"zac"."baz"', '"baz"')), '"foo"'),
            'processJoins'   => array(array(array('OUTER', '"zac"', '"m" = "n"')))
        );

        // join with column aliases
        $select13 = new Select;
        $select13->from('foo')->join('zac', 'm = n', array('BAR' => 'bar', 'BAZ' => 'baz'));
        $sqlPrep13 = // same
        $sqlStr13 = 'SELECT "foo".*, "zac"."bar" AS "BAR", "zac"."baz" AS "BAZ" FROM "foo" INNER JOIN "zac" ON "m" = "n"';
        $internalTests13 = array(
            'processSelect' => array(array(array('"foo".*'), array('"zac"."bar"', '"BAR"'), array('"zac"."baz"', '"BAZ"')), '"foo"'),
            'processJoins'   => array(array(array('INNER', '"zac"', '"m" = "n"')))
        );

        // join with table aliases
        $select14 = new Select;
        $select14->from('foo')->join(array('b' => 'bar'), 'b.foo_id = foo.foo_id');
        $sqlPrep14 = // same
        $sqlStr14 = 'SELECT "foo".*, "b".* FROM "foo" INNER JOIN "bar" AS "b" ON "b"."foo_id" = "foo"."foo_id"';
        $internalTests14 = array(
            'processSelect' => array(array(array('"foo".*'), array('"b".*')), '"foo"'),
            'processJoins' => array(array(array('INNER', '"bar" AS "b"', '"b"."foo_id" = "foo"."foo_id"')))
        );

        // where (simple string)
        $select15 = new Select;
        $select15->from('foo')->where('x = 5');
        $sqlPrep15 = // same
        $sqlStr15 = 'SELECT "foo".* FROM "foo" WHERE x = 5';
        $internalTests15 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processWhere'  => array('x = 5')
        );

        // where (returning parameters)
        $select16 = new Select;
        $select16->from('foo')->where(array('x = ?' => 5));
        $sqlPrep16 = 'SELECT "foo".* FROM "foo" WHERE x = ?';
        $sqlStr16 = 'SELECT "foo".* FROM "foo" WHERE x = \'5\'';
        $params16 = array('where1' => 5);
        $internalTests16 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processWhere'  => array('x = ?')
        );

        // group
        $select17 = new Select;
        $select17->from('foo')->group(array('col1', 'col2'));
        $sqlPrep17 = // same
        $sqlStr17 = 'SELECT "foo".* FROM "foo" GROUP BY "col1", "col2"';
        $internalTests17 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processGroup'  => array(array('"col1"', '"col2"'))
        );

        $select18 = new Select;
        $select18->from('foo')->group('col1')->group('col2');
        $sqlPrep18 = // same
        $sqlStr18 = 'SELECT "foo".* FROM "foo" GROUP BY "col1", "col2"';
        $internalTests18 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processGroup'  => array(array('"col1"', '"col2"'))
        );

        $select19 = new Select;
        $select19->from('foo')->group(new Expression('DAY(?)', array('col1'), array(Expression::TYPE_IDENTIFIER)));
        $sqlPrep19 = // same
        $sqlStr19 = 'SELECT "foo".* FROM "foo" GROUP BY DAY("col1")';
        $internalTests19 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processGroup'  => array(array('DAY("col1")'))
        );

        // having (simple string)
        $select20 = new Select;
        $select20->from('foo')->having('x = 5');
        $sqlPrep20 = // same
        $sqlStr20 = 'SELECT "foo".* FROM "foo" HAVING x = 5';
        $internalTests20 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processHaving'  => array('x = 5')
        );

        // having (returning parameters)
        $select21 = new Select;
        $select21->from('foo')->having(array('x = ?' => 5));
        $sqlPrep21 = 'SELECT "foo".* FROM "foo" HAVING x = ?';
        $sqlStr21 = 'SELECT "foo".* FROM "foo" HAVING x = \'5\'';
        $params21 = array('having1' => 5);
        $internalTests21 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processHaving'  => array('x = ?')
        );

        // order
        $select22 = new Select;
        $select22->from('foo')->order('c1');
        $sqlPrep22 = //
        $sqlStr22 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" ASC';
        $internalTests22 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processOrder'  => array(array(array('"c1"', Select::ORDER_ASCENDING)))
        );

        $select23 = new Select;
        $select23->from('foo')->order(array('c1', 'c2'));
        $sqlPrep23 = // same
        $sqlStr23 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" ASC, "c2" ASC';
        $internalTests23 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processOrder'  => array(array(array('"c1"', Select::ORDER_ASCENDING), array('"c2"', Select::ORDER_ASCENDING)))
        );

        $select24 = new Select;
        $select24->from('foo')->order(array('c1' => 'DESC', 'c2' => 'Asc')); // notice partially lower case ASC
        $sqlPrep24 = // same
        $sqlStr24 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" DESC, "c2" ASC';
        $internalTests24 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processOrder'  => array(array(array('"c1"', Select::ORDER_DESCENDING), array('"c2"', Select::ORDER_ASCENDING)))
        );

        $select25 = new Select;
        $select25->from('foo')->order(array('c1' => 'asc'))->order('c2 desc'); // notice partially lower case ASC
        $sqlPrep25 = // same
        $sqlStr25 = 'SELECT "foo".* FROM "foo" ORDER BY "c1" ASC, "c2" DESC';
        $internalTests25 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processOrder'  => array(array(array('"c1"', Select::ORDER_ASCENDING), array('"c2"', Select::ORDER_DESCENDING)))
        );

        // limit
        $select26 = new Select;
        $select26->from('foo')->limit(5);
        $sqlPrep26 = 'SELECT "foo".* FROM "foo" LIMIT ?';
        $sqlStr26 = 'SELECT "foo".* FROM "foo" LIMIT \'5\'';
        $params26 = array('limit' => 5);
        $internalTests26 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processLimit'  => array('?')
        );

        // limit with offset
        $select27 = new Select;
        $select27->from('foo')->limit(5)->offset(10);
        $sqlPrep27 = 'SELECT "foo".* FROM "foo" LIMIT ? OFFSET ?';
        $sqlStr27 = 'SELECT "foo".* FROM "foo" LIMIT \'5\' OFFSET \'10\'';
        $params27 = array('limit' => 5, 'offset' => 10);
        $internalTests27 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processLimit'  => array('?'),
            'processOffset' => array('?')
        );

        // joins with a few keywords in the on clause
        $select28 = new Select;
        $select28->from('foo')->join('zac', '(m = n AND c.x) BETWEEN x AND y.z OR (c.x < y.z AND c.x <= y.z AND c.x > y.z AND c.x >= y.z)');
        $sqlPrep28 = // same
        $sqlStr28 = 'SELECT "foo".*, "zac".* FROM "foo" INNER JOIN "zac" ON ("m" = "n" AND "c"."x") BETWEEN "x" AND "y"."z" OR ("c"."x" < "y"."z" AND "c"."x" <= "y"."z" AND "c"."x" > "y"."z" AND "c"."x" >= "y"."z")';
        $internalTests28 = array(
            'processSelect' => array(array(array('"foo".*'), array('"zac".*')), '"foo"'),
            'processJoins'  => array(array(array('INNER', '"zac"', '("m" = "n" AND "c"."x") BETWEEN "x" AND "y"."z" OR ("c"."x" < "y"."z" AND "c"."x" <= "y"."z" AND "c"."x" > "y"."z" AND "c"."x" >= "y"."z")')))
        );

        // order with compound name
        $select29 = new Select;
        $select29->from('foo')->order('c1.d2');
        $sqlPrep29 = //
        $sqlStr29 = 'SELECT "foo".* FROM "foo" ORDER BY "c1"."d2" ASC';
        $internalTests29 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processOrder'  => array(array(array('"c1"."d2"', Select::ORDER_ASCENDING)))
        );

        // group with compound name
        $select30 = new Select;
        $select30->from('foo')->group('c1.d2');
        $sqlPrep30 = // same
        $sqlStr30 = 'SELECT "foo".* FROM "foo" GROUP BY "c1"."d2"';
        $internalTests30 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processGroup'  => array(array('"c1"."d2"'))
        );

        // join with expression in ON part
        $select31 = new Select;
        $select31->from('foo')->join('zac', new Expression('(m = n AND c.x) BETWEEN x AND y.z'));
        $sqlPrep31 = // same
        $sqlStr31 = 'SELECT "foo".*, "zac".* FROM "foo" INNER JOIN "zac" ON (m = n AND c.x) BETWEEN x AND y.z';
        $internalTests31 = array(
            'processSelect' => array(array(array('"foo".*'), array('"zac".*')), '"foo"'),
            'processJoins'   => array(array(array('INNER', '"zac"', '(m = n AND c.x) BETWEEN x AND y.z')))
        );

        $select32subselect = new Select;
        $select32subselect->from('bar')->where->like('y', '%Foo%');
        $select32 = new Select;
        $select32->from(array('x' => $select32subselect));
        $sqlPrep32 = 'SELECT "x".* FROM (SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "x"';
        $sqlStr32 = 'SELECT "x".* FROM (SELECT "bar".* FROM "bar" WHERE "y" LIKE \'%Foo%\') AS "x"';
        $internalTests32 = array(
            'processSelect' => array(array(array('"x".*')), '(SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "x"'),
        );

        $select33 = new Select;
        $select33->from('table')->columns(array('*'))->where(array(
            'c1' => null,
            'c2' => array(1, 2, 3),
            new \Zend\Db\Sql\Predicate\IsNotNull('c3')
        ));
        $sqlPrep33 = 'SELECT "table".* FROM "table" WHERE "c1" IS NULL AND "c2" IN (?, ?, ?) AND "c3" IS NOT NULL';
        $sqlStr33 = 'SELECT "table".* FROM "table" WHERE "c1" IS NULL AND "c2" IN (\'1\', \'2\', \'3\') AND "c3" IS NOT NULL';
        $internalTests33 = array(
            'processSelect' => array(array(array('"table".*')), '"table"'),
            'processWhere'  => array('"c1" IS NULL AND "c2" IN (?, ?, ?) AND "c3" IS NOT NULL')
        );

        // @author Demian Katz
        $select34 = new Select;
        $select34->from('table')->order(array(
            new Expression('isnull(?) DESC', array('name'), array(Expression::TYPE_IDENTIFIER)),
            'name'
        ));
        $sqlPrep34 = 'SELECT "table".* FROM "table" ORDER BY isnull("name") DESC, "name" ASC';
        $sqlStr34 = 'SELECT "table".* FROM "table" ORDER BY isnull("name") DESC, "name" ASC';
        $internalTests34 = array(
            'processOrder'  => array(array(array('isnull("name") DESC'), array('"name"', Select::ORDER_ASCENDING)))
        );

        // join with Expression object in COLUMNS part (ZF2-514)
        // @co-author Koen Pieters (kpieters)
        $select35 = new Select;
        $select35->from('foo')->columns(array())->join('bar', 'm = n', array('thecount' => new Expression("COUNT(*)")));
        $sqlPrep35 = // same
        $sqlStr35 = 'SELECT COUNT(*) AS "thecount" FROM "foo" INNER JOIN "bar" ON "m" = "n"';
        $internalTests35 = array(
            'processSelect' => array(array(array('COUNT(*)', '"thecount"')), '"foo"'),
            'processJoins'   => array(array(array('INNER', '"bar"', '"m" = "n"')))
        );

        // multiple joins with expressions
        // reported by @jdolieslager
        $select36 = new Select;
        $select36->from('foo')
            ->join('tableA', new Predicate\Operator('id', '=', 1))
            ->join('tableB', new Predicate\Operator('id', '=', 2))
            ->join('tableC', new Predicate\PredicateSet(array(
                new Predicate\Operator('id', '=', 3),
                new Predicate\Operator('number', '>', 20)
            )));
        $sqlPrep36 = 'SELECT "foo".*, "tableA".*, "tableB".*, "tableC".* FROM "foo"'
            . ' INNER JOIN "tableA" ON "id" = :join1part1 INNER JOIN "tableB" ON "id" = :join2part1 '
            . 'INNER JOIN "tableC" ON "id" = :join3part1 AND "number" > :join3part2';
        $sqlStr36 = 'SELECT "foo".*, "tableA".*, "tableB".*, "tableC".* FROM "foo" '
            . 'INNER JOIN "tableA" ON "id" = \'1\' INNER JOIN "tableB" ON "id" = \'2\' '
            . 'INNER JOIN "tableC" ON "id" = \'3\' AND "number" > \'20\'';
        $internalTests36 = array();
        $useNamedParams36 = true;

        /**
         * @author robertbasic
         * @link https://github.com/zendframework/zf2/pull/2714
         */
        $select37 = new Select;
        $select37->from('foo')->columns(array('bar'), false);
        $sqlPrep37 = // same
        $sqlStr37 = 'SELECT "bar" AS "bar" FROM "foo"';
        $internalTests37 = array(
            'processSelect' => array(array(array('"bar"', '"bar"')), '"foo"')
        );

        // @link https://github.com/zendframework/zf2/issues/3294
        // Test TableIdentifier In Joins
        $select38 = new Select;
        $select38->from('foo')->columns(array())->join(new TableIdentifier('bar', 'baz'), 'm = n', array('thecount' => new Expression("COUNT(*)")));
        $sqlPrep38 = // same
        $sqlStr38 = 'SELECT COUNT(*) AS "thecount" FROM "foo" INNER JOIN "baz"."bar" ON "m" = "n"';
        $internalTests38 = array(
            'processSelect' => array(array(array('COUNT(*)', '"thecount"')), '"foo"'),
            'processJoins'   => array(array(array('INNER', '"baz"."bar"', '"m" = "n"')))
        );

        // subselect in join
        $select39subselect = new Select;
        $select39subselect->from('bar')->where->like('y', '%Foo%');
        $select39 = new Select;
        $select39->from('foo')->join(array('z' => $select39subselect), 'z.foo = bar.id');
        $sqlPrep39 = 'SELECT "foo".*, "z".* FROM "foo" INNER JOIN (SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "z" ON "z"."foo" = "bar"."id"';
        $sqlStr39 = 'SELECT "foo".*, "z".* FROM "foo" INNER JOIN (SELECT "bar".* FROM "bar" WHERE "y" LIKE \'%Foo%\') AS "z" ON "z"."foo" = "bar"."id"';
        $internalTests39 = array(
            'processJoins' => array(array(array('INNER', '(SELECT "bar".* FROM "bar" WHERE "y" LIKE ?) AS "z"', '"z"."foo" = "bar"."id"')))
        );

        // @link https://github.com/zendframework/zf2/issues/3294
        // Test TableIdentifier In Joins, with multiple joins
        $select40 = new Select;
        $select40->from('foo')
            ->join(array('a' => new TableIdentifier('another_foo', 'another_schema')), 'a.x = foo.foo_column')
            ->join('bar', 'foo.colx = bar.colx');
        $sqlPrep40 = // same
        $sqlStr40 = 'SELECT "foo".*, "a".*, "bar".* FROM "foo"'
            . ' INNER JOIN "another_schema"."another_foo" AS "a" ON "a"."x" = "foo"."foo_column"'
            . ' INNER JOIN "bar" ON "foo"."colx" = "bar"."colx"';
        $internalTests40 = array(
            'processSelect' => array(array(array('"foo".*'), array('"a".*'), array('"bar".*')), '"foo"'),
            'processJoins'  => array(array(
                array('INNER', '"another_schema"."another_foo" AS "a"', '"a"."x" = "foo"."foo_column"'),
                array('INNER', '"bar"', '"foo"."colx" = "bar"."colx"')
            ))
        );

        $select41 = new Select;
        $select41->from('foo')->quantifier(Select::QUANTIFIER_DISTINCT);
        $sqlPrep41 = // same
        $sqlStr41 = 'SELECT DISTINCT "foo".* FROM "foo"';
        $internalTests41 = array(
            'processSelect' => array(SELECT::QUANTIFIER_DISTINCT, array(array('"foo".*')), '"foo"'),
        );

        $select42 = new Select;
        $select42->from('foo')->quantifier(new Expression('TOP ?', array(10)));
        $sqlPrep42 = 'SELECT TOP ? "foo".* FROM "foo"';
        $sqlStr42 = 'SELECT TOP \'10\' "foo".* FROM "foo"';
        $internalTests42 = array(
            'processSelect' => array('TOP ?', array(array('"foo".*')), '"foo"'),
        );

        $select43 = new Select();
        $select43->from(array('x' => 'foo'))->columns(array('bar'), false);
        $sqlPrep43 = 'SELECT "bar" AS "bar" FROM "foo" AS "x"';
        $sqlStr43 = 'SELECT "bar" AS "bar" FROM "foo" AS "x"';
        $internalTests43 = array(
            'processSelect' => array(array(array('"bar"', '"bar"')), '"foo" AS "x"')
        );

        $select44 = new Select;
        $select44->from('foo')->where('a = b');
        $select44b = new Select;
        $select44b->from('bar')->where('c = d');
        $select44->combine($select44b, Select::COMBINE_UNION, 'ALL');
        $sqlPrep44 = // same
        $sqlStr44 = '( SELECT "foo".* FROM "foo" WHERE a = b ) UNION ALL ( SELECT "bar".* FROM "bar" WHERE c = d )';
        $internalTests44 = array(
            'processCombine' => array('UNION ALL', 'SELECT "bar".* FROM "bar" WHERE c = d')
        );

        // limit with offset
        $select45 = new Select;
        $select45->from('foo')->limit("5")->offset("10");
        $sqlPrep45 = 'SELECT "foo".* FROM "foo" LIMIT ? OFFSET ?';
        $sqlStr45 = 'SELECT "foo".* FROM "foo" LIMIT \'5\' OFFSET \'10\'';
        $params45 = array('limit' => 5, 'offset' => 10);
        $internalTests45 = array(
            'processSelect' => array(array(array('"foo".*')), '"foo"'),
            'processLimit'  => array('?'),
            'processOffset' => array('?')
        );

        /**
         * $select = the select object
         * $sqlPrep = the sql as a result of preparation
         * $params = the param container contents result of preparation
         * $sqlStr = the sql as a result of getting a string back
         * $internalTests what the internal functions should return (safe-guarding extension)
         */

        return array(
            //    $select    $sqlPrep    $params     $sqlStr    $internalTests    // use named param
            array($select0,  $sqlPrep0,  array(),    $sqlStr0,  $internalTests0),
            array($select1,  $sqlPrep1,  array(),    $sqlStr1,  $internalTests1),
            array($select2,  $sqlPrep2,  array(),    $sqlStr2,  $internalTests2),
            array($select3,  $sqlPrep3,  array(),    $sqlStr3,  $internalTests3),
            array($select4,  $sqlPrep4,  array(),    $sqlStr4,  $internalTests4),
            array($select5,  $sqlPrep5,  array(),    $sqlStr5,  $internalTests5),
            array($select6,  $sqlPrep6,  array(),    $sqlStr6,  $internalTests6),
            array($select7,  $sqlPrep7,  array(),    $sqlStr7,  $internalTests7),
            array($select8,  $sqlPrep8,  array(),    $sqlStr8,  $internalTests8),
            array($select9,  $sqlPrep9,  $params9,   $sqlStr9,  $internalTests9),
            array($select10, $sqlPrep10, array(),    $sqlStr10, $internalTests10),
            array($select11, $sqlPrep11, array(),    $sqlStr11, $internalTests11),
            array($select12, $sqlPrep12, array(),    $sqlStr12, $internalTests12),
            array($select13, $sqlPrep13, array(),    $sqlStr13, $internalTests13),
            array($select14, $sqlPrep14, array(),    $sqlStr14, $internalTests14),
            array($select15, $sqlPrep15, array(),    $sqlStr15, $internalTests15),
            array($select16, $sqlPrep16, $params16,  $sqlStr16, $internalTests16),
            array($select17, $sqlPrep17, array(),    $sqlStr17, $internalTests17),
            array($select18, $sqlPrep18, array(),    $sqlStr18, $internalTests18),
            array($select19, $sqlPrep19, array(),    $sqlStr19, $internalTests19),
            array($select20, $sqlPrep20, array(),    $sqlStr20, $internalTests20),
            array($select21, $sqlPrep21, $params21,  $sqlStr21, $internalTests21),
            array($select22, $sqlPrep22, array(),    $sqlStr22, $internalTests22),
            array($select23, $sqlPrep23, array(),    $sqlStr23, $internalTests23),
            array($select24, $sqlPrep24, array(),    $sqlStr24, $internalTests24),
            array($select25, $sqlPrep25, array(),    $sqlStr25, $internalTests25),
            array($select26, $sqlPrep26, $params26,  $sqlStr26, $internalTests26),
            array($select27, $sqlPrep27, $params27,  $sqlStr27, $internalTests27),
            array($select28, $sqlPrep28, array(),    $sqlStr28, $internalTests28),
            array($select29, $sqlPrep29, array(),    $sqlStr29, $internalTests29),
            array($select30, $sqlPrep30, array(),    $sqlStr30, $internalTests30),
            array($select31, $sqlPrep31, array(),    $sqlStr31, $internalTests31),
            array($select32, $sqlPrep32, array(),    $sqlStr32, $internalTests32),
            array($select33, $sqlPrep33, array(),    $sqlStr33, $internalTests33),
            array($select34, $sqlPrep34, array(),    $sqlStr34, $internalTests34),
            array($select35, $sqlPrep35, array(),    $sqlStr35, $internalTests35),
            array($select36, $sqlPrep36, array(),    $sqlStr36, $internalTests36,  $useNamedParams36),
            array($select37, $sqlPrep37, array(),    $sqlStr37, $internalTests37),
            array($select38, $sqlPrep38, array(),    $sqlStr38, $internalTests38),
            array($select39, $sqlPrep39, array(),    $sqlStr39, $internalTests39),
            array($select40, $sqlPrep40, array(),    $sqlStr40, $internalTests40),
            array($select41, $sqlPrep41, array(),    $sqlStr41, $internalTests41),
            array($select42, $sqlPrep42, array(),    $sqlStr42, $internalTests42),
            array($select43, $sqlPrep43, array(),    $sqlStr43, $internalTests43),
            array($select44, $sqlPrep44, array(),    $sqlStr44, $internalTests44),
            array($select45, $sqlPrep45, $params45,  $sqlStr45, $internalTests45),
        );
    }
}
