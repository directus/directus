<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\IbmDb2;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\IbmDb2 as IbmDb2Platform;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Platform\IbmDb2\SelectDecorator;
use Zend\Db\Sql\Select;
use Zend\Db\Sql\Where;

class SelectDecoratorTest extends TestCase
{
    /**
     * @testdox integration test: Testing SelectDecorator will use Select to produce properly IBM Db2
     *                            dialect prepared sql
     * @covers \Zend\Db\Sql\Platform\SqlServer\SelectDecorator::prepareStatement
     * @covers \Zend\Db\Sql\Platform\SqlServer\SelectDecorator::processLimitOffset
     * @dataProvider dataProvider
     */
    public function testPrepareStatement(
        Select $select,
        $expectedPrepareSql,
        $expectedParams,
        $notUsed,
        $supportsLimitOffset
    ) {
        $driver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $driver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));

        // test
        $adapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([
                $driver,
                new IbmDb2Platform(),
            ])
            ->getMock();

        $parameterContainer = new ParameterContainer;
        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();

        $statement->expects($this->any())->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));
        $statement->expects($this->once())->method('setSql')->with($expectedPrepareSql);

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $selectDecorator->setSupportsLimitOffset($supportsLimitOffset);
        $selectDecorator->prepareStatement($adapter, $statement);

        self::assertEquals($expectedParams, $parameterContainer->getNamedArray());
    }

    /**
     * @testdox integration test: Testing SelectDecorator will use Select to produce properly Ibm DB2
     *                            dialect sql statements
     * @covers \Zend\Db\Sql\Platform\IbmDb2\SelectDecorator::getSqlString
     * @dataProvider dataProvider
     */
    public function testGetSqlString(Select $select, $ignored0, $ignored1, $expectedSql, $supportsLimitOffset)
    {
        $parameterContainer = new ParameterContainer;
        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $statement->expects($this->any())->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $selectDecorator->setSupportsLimitOffset($supportsLimitOffset);

        self::assertEquals($expectedSql, @$selectDecorator->getSqlString(new IbmDb2Platform));
    }

    /**
     * Data provider for testGetSqlString
     *
     * @return array
     */
    public function dataProvider()
    {
        $select0 = new Select;
        $select0->from(['x' => 'foo'])->limit(5);
        $expectedParams0 = [ 'limit' => 5, 'offset' => 0 ];
        // @codingStandardsIgnoreStart
        $expectedPrepareSql0 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN ? AND ?';
        $expectedSql0 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN 0 AND 5';
        // @codingStandardsIgnoreEnd

        $select1 = new Select;
        $select1->from(['x' => 'foo'])->limit(5)->offset(10);
        $expectedParams1 = [ 'limit' => 15, 'offset' => 11 ];
        // @codingStandardsIgnoreStart
        $expectedPrepareSql1 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN ? AND ?';
        $expectedSql1 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN 11 AND 15';
        // @codingStandardsIgnoreEnd

        $select2 = new Select;
        $select2->columns([new Expression('DISTINCT(id) as id')])->from(['x' => 'foo'])->limit(5)->offset(10);
        $expectedParams2 = [ 'limit' => 15, 'offset' => 11];
        // @codingStandardsIgnoreStart
        $expectedPrepareSql2 = 'SELECT DISTINCT(id) as id FROM ( SELECT DISTINCT(id) as id, DENSE_RANK() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN ? AND ?';
        $expectedSql2 = 'SELECT DISTINCT(id) as id FROM ( SELECT DISTINCT(id) as id, DENSE_RANK() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN 11 AND 15';
        // @codingStandardsIgnoreEnd

        $select3 = new Select;
        $where3  = new Where();
        $where3->greaterThan('x.id', '10')->AND->lessThan('x.id', '31');
        $select3->from(['x' => 'foo'])->where($where3)->limit(5)->offset(10);
        $expectedParams3 = [ 'limit' => 15, 'offset' => 11, 'where1' => '10', 'where2' => '31' ];
        // @codingStandardsIgnoreStart
        $expectedPrepareSql3 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" WHERE "x"."id" > ? AND "x"."id" < ? ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN ? AND ?';
        $expectedSql3 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" WHERE "x"."id" > \'10\' AND "x"."id" < \'31\' ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN 11 AND 15';
        // @codingStandardsIgnoreEnd

        $select4 = new Select;
        $where4  = $where3;
        $select4->from(['x' => 'foo'])->where($where4)->limit(5);
        $expectedParams4 = [ 'limit' => 5, 'offset' => 0, 'where1' => 10, 'where2' => 31 ];
        // @codingStandardsIgnoreStart
        $expectedPrepareSql4 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" WHERE "x"."id" > ? AND "x"."id" < ? ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN ? AND ?';
        $expectedSql4 = 'SELECT * FROM ( SELECT "x".*, ROW_NUMBER() OVER () AS ZEND_DB_ROWNUM FROM "foo" "x" WHERE "x"."id" > \'10\' AND "x"."id" < \'31\' ) AS ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION WHERE ZEND_IBMDB2_SERVER_LIMIT_OFFSET_EMULATION.ZEND_DB_ROWNUM BETWEEN 0 AND 5';
        // @codingStandardsIgnoreEnd

        $select5 = new Select;
        $select5->from(['x' => 'foo'])->limit(5);
        $expectedParams5 = [];
        $expectedPrepareSql5 = 'SELECT "x".* FROM "foo" "x" LIMIT 5';
        $expectedSql5 = 'SELECT "x".* FROM "foo" "x" LIMIT 5';

        $select6 = new Select;
        $select6->columns([new Expression('DISTINCT(id) as id')])->from(['x' => 'foo'])->limit(5)->offset(10);
        $expectedParams6 = [];
        $expectedPrepareSql6 = 'SELECT DISTINCT(id) as id FROM "foo" "x" LIMIT 5 OFFSET 10';
        $expectedSql6 = 'SELECT DISTINCT(id) as id FROM "foo" "x" LIMIT 5 OFFSET 10';

        return [
            [$select0, $expectedPrepareSql0, $expectedParams0, $expectedSql0, false],
            [$select1, $expectedPrepareSql1, $expectedParams1, $expectedSql1, false],
            [$select2, $expectedPrepareSql2, $expectedParams2, $expectedSql2, false],
            [$select3, $expectedPrepareSql3, $expectedParams3, $expectedSql3, false],
            [$select4, $expectedPrepareSql4, $expectedParams4, $expectedSql4, false],
            [$select5, $expectedPrepareSql5, $expectedParams5, $expectedSql5, true],
            [$select6, $expectedPrepareSql6, $expectedParams6, $expectedSql6, true],
        ];
    }
}
