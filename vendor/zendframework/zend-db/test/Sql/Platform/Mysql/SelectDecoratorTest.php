<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\Mysql;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\Mysql as MysqlPlatform;
use Zend\Db\Sql\Platform\Mysql\SelectDecorator;
use Zend\Db\Sql\Select;

class SelectDecoratorTest extends TestCase
{
    /**
     * @testdox integration test: Testing SelectDecorator will use Select an internal state to prepare
     *                            a proper limit/offset sql statement
     * @covers \Zend\Db\Sql\Platform\Mysql\SelectDecorator::prepareStatement
     * @covers \Zend\Db\Sql\Platform\Mysql\SelectDecorator::processLimit
     * @covers \Zend\Db\Sql\Platform\Mysql\SelectDecorator::processOffset
     * @dataProvider dataProvider
     */
    public function testPrepareStatement(Select $select, $expectedSql, $expectedParams)
    {
        $driver = $this->getMockBuilder('Zend\Db\Adapter\Driver\DriverInterface')->getMock();
        $driver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));

        // test
        $adapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([
                $driver,
                new MysqlPlatform(),
            ])
            ->getMock();

        $parameterContainer = new ParameterContainer;
        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $statement->expects($this->any())->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));

        $statement->expects($this->once())->method('setSql')->with($expectedSql);

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $selectDecorator->prepareStatement($adapter, $statement);

        self::assertEquals($expectedParams, $parameterContainer->getNamedArray());
    }

    /**
     * @testdox integration test: Testing SelectDecorator will use Select an internal state to prepare
     *                            a proper limit/offset sql statement
     * @covers \Zend\Db\Sql\Platform\Mysql\SelectDecorator::getSqlString
     * @covers \Zend\Db\Sql\Platform\Mysql\SelectDecorator::processLimit
     * @covers \Zend\Db\Sql\Platform\Mysql\SelectDecorator::processOffset
     * @dataProvider dataProvider
     */
    public function testGetSqlString(Select $select, $ignore, $alsoIgnore, $expectedSql)
    {
        $parameterContainer = new ParameterContainer;
        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $statement->expects($this->any())->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        self::assertEquals($expectedSql, $selectDecorator->getSqlString(new MysqlPlatform));
    }

    public function dataProvider()
    {
        $select0 = new Select;
        $select0->from('foo')->limit(5)->offset(10);
        $expectedPrepareSql0 = 'SELECT `foo`.* FROM `foo` LIMIT ? OFFSET ?';
        $expectedParams0 = ['offset' => 10, 'limit' => 5];
        $expectedSql0 = 'SELECT `foo`.* FROM `foo` LIMIT 5 OFFSET 10';

        // offset without limit
        $select1 = new Select;
        $select1->from('foo')->offset(10);
        $expectedPrepareSql1 = 'SELECT `foo`.* FROM `foo` LIMIT 18446744073709551615 OFFSET ?';
        $expectedParams1 = ['offset' => 10];
        $expectedSql1 = 'SELECT `foo`.* FROM `foo` LIMIT 18446744073709551615 OFFSET 10';

        // offset and limit are not type casted when injected into parameter container
        $select2 = new Select;
        $select2->from('foo')->limit('5')->offset('10000000000000000000');
        $expectedPrepareSql2 = 'SELECT `foo`.* FROM `foo` LIMIT ? OFFSET ?';
        $expectedParams2 = ['offset' => '10000000000000000000', 'limit' => '5'];
        $expectedSql2 = 'SELECT `foo`.* FROM `foo` LIMIT 5 OFFSET 10000000000000000000';

        return [
            [$select0, $expectedPrepareSql0, $expectedParams0, $expectedSql0],
            [$select1, $expectedPrepareSql1, $expectedParams1, $expectedSql1],
            [$select2, $expectedPrepareSql2, $expectedParams2, $expectedSql2],
        ];
    }
}
