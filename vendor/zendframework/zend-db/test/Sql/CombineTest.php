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
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\StatementContainer;
use Zend\Db\Sql\Combine;
use Zend\Db\Sql\Predicate\Expression;
use Zend\Db\Sql\Select;

class CombineTest extends TestCase
{
    /**
     * @var Combine
     */
    protected $combine;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->combine = new Combine;
    }

    public function testRejectsInvalidStatement()
    {
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');

        $this->combine->combine('foo');
    }

    public function testGetSqlString()
    {
        $this->combine
                ->union(new Select('t1'))
                ->intersect(new Select('t2'))
                ->except(new Select('t3'))
                ->union(new Select('t4'));

        self::assertEquals(
            // @codingStandardsIgnoreStart
            '(SELECT "t1".* FROM "t1") INTERSECT (SELECT "t2".* FROM "t2") EXCEPT (SELECT "t3".* FROM "t3") UNION (SELECT "t4".* FROM "t4")',
            // @codingStandardsIgnoreEnd
            $this->combine->getSqlString()
        );
    }

    public function testGetSqlStringWithModifier()
    {
        $this->combine
                ->union(new Select('t1'))
                ->union(new Select('t2'), 'ALL');

        self::assertEquals(
            '(SELECT "t1".* FROM "t1") UNION ALL (SELECT "t2".* FROM "t2")',
            $this->combine->getSqlString()
        );
    }

    public function testGetSqlStringFromArray()
    {
        $this->combine->combine([
            [new Select('t1')],
            [new Select('t2'), Combine::COMBINE_INTERSECT, 'ALL'],
            [new Select('t3'), Combine::COMBINE_EXCEPT],
        ]);

        self::assertEquals(
            '(SELECT "t1".* FROM "t1") INTERSECT ALL (SELECT "t2".* FROM "t2") EXCEPT (SELECT "t3".* FROM "t3")',
            $this->combine->getSqlString()
        );

        $this->combine = new Combine();
        $this->combine->combine([
            new Select('t1'),
            new Select('t2'),
            new Select('t3'),
        ]);

        self::assertEquals(
            '(SELECT "t1".* FROM "t1") UNION (SELECT "t2".* FROM "t2") UNION (SELECT "t3".* FROM "t3")',
            $this->combine->getSqlString()
        );
    }

    public function testGetSqlStringEmpty()
    {
        self::assertNull($this->combine->getSqlString());
    }

    public function testPrepareStatementWithModifier()
    {
        $select1 = new Select('t1');
        $select1->where(['x1' => 10]);
        $select2 = new Select('t2');
        $select2->where(['x2' => 20]);

        $this->combine->combine([
            $select1,
            $select2,
        ]);

        $adapter = $this->getMockAdapter();

        $statement = $this->combine->prepareStatement($adapter, new StatementContainer);
        self::assertInstanceOf('Zend\Db\Adapter\StatementContainerInterface', $statement);
        self::assertEquals(
            '(SELECT "t1".* FROM "t1" WHERE "x1" = ?) UNION (SELECT "t2".* FROM "t2" WHERE "x2" = ?)',
            $statement->getSql()
        );
    }

    public function testAlignColumns()
    {
        $select1 = new Select('t1');
        $select1->columns([
            'c0' => 'c0',
            'c1' => 'c1',
        ]);
        $select2 = new Select('t2');
        $select2->columns([
            'c1' => 'c1',
            'c2' => 'c2',
        ]);

        $this->combine
                ->union([$select1, $select2])
                ->alignColumns();

        self::assertEquals(
            [
                'c0' => 'c0',
                'c1' => 'c1',
                'c2' => new Expression('NULL'),
            ],
            $select1->getRawState('columns')
        );

        self::assertEquals(
            [
                'c0' => new Expression('NULL'),
                'c1' => 'c1',
                'c2' => 'c2',
            ],
            $select2->getRawState('columns')
        );
    }

    public function testGetRawState()
    {
        $select = new Select('t1');
        $this->combine->combine($select);
        self::assertSame(
            [
                'combine' => [
                    [
                        'select'   => $select,
                        'type'     => Combine::COMBINE_UNION,
                        'modifier' => '',
                    ],
                ],
                'columns' => [
                    '0' => '*',
                ],
            ],
            $this->combine->getRawState()
        );
    }

    /**
     *
     * @return \PHPUnit_Framework_MockObject_MockObject|\Zend\Db\Adapter\Adapter
     */
    protected function getMockAdapter()
    {
        $parameterContainer = new ParameterContainer();

        $mockStatement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $mockStatement->expects($this->any())->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));


        $setGetSqlFunction = function ($sql = null) use ($mockStatement) {
            static $sqlValue;
            if ($sql) {
                $sqlValue = $sql;
                return $mockStatement;
            }
            return $sqlValue;
        };
        $mockStatement->expects($this->any())->method('setSql')->will($this->returnCallback($setGetSqlFunction));
        $mockStatement->expects($this->any())->method('getSql')->will($this->returnCallback($setGetSqlFunction));

        $mockDriver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $mockDriver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));
        $mockDriver->expects($this->any())->method('createStatement')->will($this->returnValue($mockStatement));

        return $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([$mockDriver])
            ->getMock();
    }
}
