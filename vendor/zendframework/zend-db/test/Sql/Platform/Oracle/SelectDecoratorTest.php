<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\Oracle;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\Oracle as OraclePlatform;
use Zend\Db\Sql\Platform\Oracle\SelectDecorator;
use Zend\Db\Sql\Select;

class SelectDecoratorTest extends TestCase
{
    /**
     * @testdox integration test: Testing SelectDecorator will use Select to produce properly Oracle
     *                            dialect prepared sql
     * @covers \Zend\Db\Sql\Platform\SqlServer\SelectDecorator::prepareStatement
     * @covers \Zend\Db\Sql\Platform\SqlServer\SelectDecorator::processLimitOffset
     * @dataProvider dataProvider
     */
    public function testPrepareStatement(
        Select $select,
        $expectedSql,
        $expectedParams,
        $notUsed,
        $expectedFormatParamCount
    ) {
        $driver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $driver->expects($this->exactly($expectedFormatParamCount))
            ->method('formatParameterName')
            ->will($this->returnValue('?'));

        // test
        $adapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([
                $driver,
                new OraclePlatform(),
            ])
            ->getMock();

        $parameterContainer = new ParameterContainer;
        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $statement->expects($this->any())
            ->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));

        $statement->expects($this->once())->method('setSql')->with($expectedSql);

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $selectDecorator->prepareStatement($adapter, $statement);

        self::assertEquals($expectedParams, $parameterContainer->getNamedArray());
    }

    // @codingStandardsIgnoreStart
    /**
     * @testdox integration test: Testing SelectDecorator will use Select to produce properly Oracle
     *                            dialect sql statements
     * @covers \Zend\Db\Sql\Platform\Oracle\SelectDecorator::getSqlString
     * @dataProvider dataProvider
     */
    // @codingStandardsIgnoreEnd
    public function testGetSqlString(Select $select, $ignored, $alsoIgnored, $expectedSql)
    {
        $parameterContainer = new ParameterContainer;
        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $statement->expects($this->any())
            ->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        self::assertEquals($expectedSql, $selectDecorator->getSqlString(new OraclePlatform));
    }

    /**
     * Data provider for testGetSqlString
     *
     * @return array
     */
    public function dataProvider()
    {
        $select0 = new Select;
        $select0->from(['x' => 'foo']);
        $expectedSql0 = 'SELECT "x".* FROM "foo" "x"';
        $expectedFormatParamCount0 = 0;

        $select1a = new Select('test');
        $select1b = new Select(['a' => $select1a]);
        $select1 = new Select(['b' => $select1b]);
        $expectedSql1 = 'SELECT "b".* FROM (SELECT "a".* FROM (SELECT "test".* FROM "test") "a") "b"';
        $expectedFormatParamCount1 = 0;

        $select2a = new Select('test');
        $select2a->limit(2);
        $select2b = new Select(['a' => $select2a]);
        $select2 = new Select(['b' => $select2b]);
        // @codingStandardsIgnoreStart
        $expectedSql2_1 = 'SELECT "b".* FROM (SELECT "a".* FROM (SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "test".* FROM "test" ) b WHERE rownum <= (:offset2+:limit2)) WHERE b_rownum >= (:offset2 + 1)) "a") "b"';
        $expectedSql2_2 = 'SELECT "b".* FROM (SELECT "a".* FROM (SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "test".* FROM "test" ) b WHERE rownum <= (0+2)) WHERE b_rownum >= (0 + 1)) "a") "b"';
        // @codingStandardsIgnoreEnd
        $expectedFormatParamCount2 = 0;
        $expectedParams2 = ['offset2' => 0, 'limit2' => 2];

        $select3a = new Select('test');
        $select3a->offset(2);
        $select3b = new Select(['a' => $select3a]);
        $select3 = new Select(['b' => $select3b]);
        // @codingStandardsIgnoreStart
        $expectedSql3_1 = 'SELECT "b".* FROM (SELECT "a".* FROM (SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "test".* FROM "test" ) b ) WHERE b_rownum > (:offset2)) "a") "b"';
        $expectedSql3_2 = 'SELECT "b".* FROM (SELECT "a".* FROM (SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "test".* FROM "test" ) b ) WHERE b_rownum > (2)) "a") "b"';
        // @codingStandardsIgnoreEnd
        $expectedFormatParamCount3 = 0;
        $expectedParams3 = ['offset2' => 2];

        $select4a = new Select('test');
        $select4a->limit(2);
        $select4a->offset(2);
        $select4b = new Select(['a' => $select4a]);
        $select4 = new Select(['b' => $select4b]);
        // @codingStandardsIgnoreStart
        $expectedSql4_1 = 'SELECT "b".* FROM (SELECT "a".* FROM (SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "test".* FROM "test" ) b WHERE rownum <= (:offset2+:limit2)) WHERE b_rownum >= (:offset2 + 1)) "a") "b"';
        $expectedSql4_2 = 'SELECT "b".* FROM (SELECT "a".* FROM (SELECT * FROM (SELECT b.*, rownum b_rownum FROM ( SELECT "test".* FROM "test" ) b WHERE rownum <= (2+2)) WHERE b_rownum >= (2 + 1)) "a") "b"';
        // @codingStandardsIgnoreEnd
        $expectedFormatParamCount4 = 0;
        $expectedParams4 = ['offset2' => 2, 'limit2' => 2];

        return [
            [$select0, $expectedSql0, [], $expectedSql0, $expectedFormatParamCount0],
            [$select1, $expectedSql1, [], $expectedSql1, $expectedFormatParamCount1],
            [$select2, $expectedSql2_1, $expectedParams2, $expectedSql2_2, $expectedFormatParamCount2],
            [$select3, $expectedSql3_1, $expectedParams3, $expectedSql3_2, $expectedFormatParamCount3],
            [$select4, $expectedSql4_1, $expectedParams4, $expectedSql4_2, $expectedFormatParamCount4],
        ];
    }
}
