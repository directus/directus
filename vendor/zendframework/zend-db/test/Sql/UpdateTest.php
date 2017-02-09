<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use Zend\Db\Sql\Join;
use Zend\Db\Sql\Update;
use Zend\Db\Sql\Where;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\TableIdentifier;
use ZendTest\Db\TestAsset\TrustingSql92Platform;

class UpdateTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Update
     */
    protected $update;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->update = new Update;
    }

    /**
     * Tears down the fixture, for example, closes a network connection.
     * This method is called after a test is executed.
     */
    protected function tearDown()
    {
    }

    /**
     * @covers Zend\Db\Sql\Update::table
     */
    public function testTable()
    {
        $this->update->table('foo', 'bar');
        $this->assertEquals('foo', $this->readAttribute($this->update, 'table'));

        $tableIdentifier = new TableIdentifier('foo', 'bar');
        $this->update->table($tableIdentifier);
        $this->assertEquals($tableIdentifier, $this->readAttribute($this->update, 'table'));
    }

    /**
     * @covers Zend\Db\Sql\Update::__construct
     */
    public function testConstruct()
    {
        $update = new Update('foo');
        $this->assertEquals('foo', $this->readAttribute($update, 'table'));
    }

    /**
     * @covers Zend\Db\Sql\Update::set
     */
    public function testSet()
    {
        $this->update->set(['foo' => 'bar']);
        $this->assertEquals(['foo' => 'bar'], $this->update->getRawState('set'));
    }

    /**
     * @covers Zend\Db\Sql\Update::set
     */
    public function testSortableSet()
    {
        $this->update->set([
            'two'   => 'с_two',
            'three' => 'с_three',
        ]);
        $this->update->set(['one' => 'с_one'], 10);

        $this->assertEquals(
            [
                'one'   => 'с_one',
                'two'   => 'с_two',
                'three' => 'с_three',
            ],
            $this->update->getRawState('set')
        );
    }

    /**
     * @covers Zend\Db\Sql\Update::where
     */
    public function testWhere()
    {
        $this->update->where('x = y');
        $this->update->where(['foo > ?' => 5]);
        $this->update->where(['id' => 2]);
        $this->update->where(['a = b'], Where::OP_OR);
        $this->update->where(['c1' => null]);
        $this->update->where(['c2' => [1, 2, 3]]);
        $this->update->where([new \Zend\Db\Sql\Predicate\IsNotNull('c3')]);
        $where = $this->update->where;

        $predicates = $this->readAttribute($where, 'predicates');
        $this->assertEquals('AND', $predicates[0][0]);
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[0][1]);

        $this->assertEquals('AND', $predicates[1][0]);
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Expression', $predicates[1][1]);

        $this->assertEquals('AND', $predicates[2][0]);
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Operator', $predicates[2][1]);

        $this->assertEquals('OR', $predicates[3][0]);
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\Literal', $predicates[3][1]);

        $this->assertEquals('AND', $predicates[4][0]);
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\IsNull', $predicates[4][1]);

        $this->assertEquals('AND', $predicates[5][0]);
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\In', $predicates[5][1]);

        $this->assertEquals('AND', $predicates[6][0]);
        $this->assertInstanceOf('Zend\Db\Sql\Predicate\IsNotNull', $predicates[6][1]);

        $where = new Where;
        $this->update->where($where);
        $this->assertSame($where, $this->update->where);

        $this->update->where(function ($what) use ($where) {
            $this->assertSame($where, $what);
        });

        $this->setExpectedException('Zend\Db\Sql\Exception\InvalidArgumentException', 'Predicate cannot be null');
        $this->update->where(null);
    }

    /**
     * @group ZF2-240
     * @covers Zend\Db\Sql\Update::where
     */
    public function testPassingMultipleKeyValueInWhereClause()
    {
        $update = clone $this->update;
        $update->table('table');
        $update->set(['fld1' => 'val1']);
        $update->where(['id1' => 'val1', 'id2' => 'val2']);
        $this->assertEquals('UPDATE "table" SET "fld1" = \'val1\' WHERE "id1" = \'val1\' AND "id2" = \'val2\'', $update->getSqlString(new TrustingSql92Platform()));
    }

    /**
     * @covers Zend\Db\Sql\Update::getRawState
     */
    public function testGetRawState()
    {
        $this->update->table('foo')
            ->set(['bar' => 'baz'])
            ->where('x = y');

        $this->assertEquals('foo', $this->update->getRawState('table'));
        $this->assertEquals(true, $this->update->getRawState('emptyWhereProtection'));
        $this->assertEquals(['bar' => 'baz'], $this->update->getRawState('set'));
        $this->assertInstanceOf('Zend\Db\Sql\Where', $this->update->getRawState('where'));
    }

    /**
     * @covers Zend\Db\Sql\Update::prepareStatement
     */
    public function testPrepareStatement()
    {
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMock('Zend\Db\Adapter\Adapter', null, [$mockDriver]);

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $pContainer = new \Zend\Db\Adapter\ParameterContainer([]);
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($pContainer));

        $mockStatement->expects($this->at(1))
            ->method('setSql')
            ->with($this->equalTo('UPDATE "foo" SET "bar" = ?, "boo" = NOW() WHERE x = y'));

        $this->update->table('foo')
            ->set(['bar' => 'baz', 'boo' => new Expression('NOW()')])
            ->where('x = y');

        $this->update->prepareStatement($mockAdapter, $mockStatement);

        // with TableIdentifier
        $this->update = new Update;
        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMock('Zend\Db\Adapter\Adapter', null, [$mockDriver]);

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $pContainer = new \Zend\Db\Adapter\ParameterContainer([]);
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($pContainer));

        $mockStatement->expects($this->at(1))
            ->method('setSql')
            ->with($this->equalTo('UPDATE "sch"."foo" SET "bar" = ?, "boo" = NOW() WHERE x = y'));

        $this->update->table(new TableIdentifier('foo', 'sch'))
            ->set(['bar' => 'baz', 'boo' => new Expression('NOW()')])
            ->where('x = y');

        $this->update->prepareStatement($mockAdapter, $mockStatement);
    }

    /**
     * @covers Zend\Db\Sql\Update::getSqlString
     */
    public function testGetSqlString()
    {
        $this->update->table('foo')
            ->set(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null])
            ->where('x = y');

        $this->assertEquals('UPDATE "foo" SET "bar" = \'baz\', "boo" = NOW(), "bam" = NULL WHERE x = y', $this->update->getSqlString(new TrustingSql92Platform()));

        // with TableIdentifier
        $this->update = new Update;
        $this->update->table(new TableIdentifier('foo', 'sch'))
            ->set(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null])
            ->where('x = y');

        $this->assertEquals('UPDATE "sch"."foo" SET "bar" = \'baz\', "boo" = NOW(), "bam" = NULL WHERE x = y', $this->update->getSqlString(new TrustingSql92Platform()));
    }

    /**
     * @group 6768
     * @group 6773
     */
    public function testGetSqlStringForFalseUpdateValueParameter()
    {
        $this->update = new Update;
        $this->update->table(new TableIdentifier('foo', 'sch'))
            ->set(['bar' => false, 'boo' => 'test', 'bam' => true])
            ->where('x = y');
        $this->assertEquals('UPDATE "sch"."foo" SET "bar" = \'\', "boo" = \'test\', "bam" = \'1\' WHERE x = y', $this->update->getSqlString(new TrustingSql92Platform()));
    }

    /**
     * @covers Zend\Db\Sql\Update::__get
     */
    public function testGetUpdate()
    {
        $getWhere = $this->update->__get('where');
        $this->assertInstanceOf('Zend\Db\Sql\Where', $getWhere);
    }

    /**
     * @covers Zend\Db\Sql\Update::__get
     */
    public function testGetUpdateFails()
    {
        $getWhat = $this->update->__get('what');
        $this->assertNull($getWhat);
    }

    /**
     * @covers Zend\Db\Sql\Update::__clone
     */
    public function testCloneUpdate()
    {
        $update1 = clone $this->update;
        $update1->table('foo')
                ->set(['bar' => 'baz'])
                ->where('x = y');

        $update2 = clone $this->update;
        $update2->table('foo')
            ->set(['bar' => 'baz'])
            ->where([
                'id = ?'=>1
            ]);
        $this->assertEquals('UPDATE "foo" SET "bar" = \'baz\' WHERE id = \'1\'', $update2->getSqlString(new TrustingSql92Platform));
    }

    /**
     * @coversNothing
     */
    public function testSpecificationconstantsCouldBeOverridedByExtensionInPrepareStatement()
    {
        $updateIgnore = new UpdateIgnore();

        $mockDriver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $mockDriver->expects($this->any())->method('getPrepareType')->will($this->returnValue('positional'));
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockAdapter = $this->getMock('Zend\Db\Adapter\Adapter', null, [$mockDriver]);

        $mockStatement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $pContainer = new \Zend\Db\Adapter\ParameterContainer([]);
        $mockStatement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($pContainer));

        $mockStatement->expects($this->at(1))
            ->method('setSql')
            ->with($this->equalTo('UPDATE IGNORE "foo" SET "bar" = ?, "boo" = NOW() WHERE x = y'));

        $updateIgnore->table('foo')
            ->set(['bar' => 'baz', 'boo' => new Expression('NOW()')])
            ->where('x = y');

        $updateIgnore->prepareStatement($mockAdapter, $mockStatement);
    }

    /**
     * @coversNothing
     */
    public function testSpecificationconstantsCouldBeOverridedByExtensionInGetSqlString()
    {
        $this->update = new UpdateIgnore();

        $this->update->table('foo')
            ->set(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null])
            ->where('x = y');

        $this->assertEquals('UPDATE IGNORE "foo" SET "bar" = \'baz\', "boo" = NOW(), "bam" = NULL WHERE x = y', $this->update->getSqlString(new TrustingSql92Platform()));

        // with TableIdentifier
        $this->update = new UpdateIgnore();
        $this->update->table(new TableIdentifier('foo', 'sch'))
            ->set(['bar' => 'baz', 'boo' => new Expression('NOW()'), 'bam' => null])
            ->where('x = y');

        $this->assertEquals('UPDATE IGNORE "sch"."foo" SET "bar" = \'baz\', "boo" = NOW(), "bam" = NULL WHERE x = y', $this->update->getSqlString(new TrustingSql92Platform()));
    }

    /**
     * @covers Zend\Db\Sql\Update::where
     */
    public function testJoin()
    {
        $this->update->table('Document');
        $this->update->set(['x' => 'y'])
            ->join(
                'User', // table name
                'User.UserId = Document.UserId' // expression to join on (will be quoted by platform object before insertion),
                // default JOIN INNER
            )
            ->join(
                'Category',
                'Category.CategoryId = Document.CategoryId',
                Join::JOIN_LEFT // (optional), one of inner, outer, left, right
            );

        $this->assertEquals('UPDATE "Document" INNER JOIN "User" ON "User"."UserId" = "Document"."UserId" LEFT JOIN "Category" ON "Category"."CategoryId" = "Document"."CategoryId" SET "x" = \'y\'',
            $this->update->getSqlString(new TrustingSql92Platform()));
    }

    /**
     * @testdox unit test: Test join() returns Update object (is chainable)
     * @covers Zend\Db\Sql\Update::join
     */
    public function testJoinChainable()
    {
        $return = $this->update->join('baz', 'foo.fooId = baz.fooId', Join::JOIN_LEFT);
        $this->assertSame($this->update, $return);
    }
}

class UpdateIgnore extends Update
{
    const SPECIFICATION_UPDATE = 'updateIgnore';

    protected $specifications = [
        self::SPECIFICATION_UPDATE => 'UPDATE IGNORE %1$s',
        self::SPECIFICATION_SET => 'SET %1$s',
        self::SPECIFICATION_WHERE  => 'WHERE %1$s'
    ];

    protected function processupdateIgnore(\Zend\Db\Adapter\Platform\PlatformInterface $platform, \Zend\Db\Adapter\Driver\DriverInterface $driver = null, \Zend\Db\Adapter\ParameterContainer $parameterContainer = null)
    {
        return parent::processUpdate($platform, $driver, $parameterContainer);
    }
}
