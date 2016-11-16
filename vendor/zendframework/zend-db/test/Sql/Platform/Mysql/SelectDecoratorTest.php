<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\Mysql;

use Zend\Db\Sql\Platform\Mysql\SelectDecorator;
use Zend\Db\Sql\Select;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\Mysql as MysqlPlatform;

class SelectDecoratorTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @testdox integration test: Testing SelectDecorator will use Select an internal state to prepare a proper limit/offset sql statement
     * @covers Zend\Db\Sql\Platform\Mysql\SelectDecorator::prepareStatement
     * @covers Zend\Db\Sql\Platform\Mysql\SelectDecorator::processLimit
     * @covers Zend\Db\Sql\Platform\Mysql\SelectDecorator::processOffset
     * @dataProvider dataProvider
     */
    public function testPrepareStatement(Select $select, $expectedSql, $expectedParams)
    {
        $driver = $this->getMock('Zend\Db\Adapter\Driver\DriverInterface');
        $driver->expects($this->any())->method('formatParameterName')->will($this->returnValue('?'));

        // test
        $adapter = $this->getMock(
            'Zend\Db\Adapter\Adapter',
            null,
            array(
                $driver,
                new MysqlPlatform()
            )
        );

        $parameterContainer = new ParameterContainer;
        $statement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $statement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($parameterContainer));

        $statement->expects($this->once())->method('setSql')->with($expectedSql);

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $selectDecorator->prepareStatement($adapter, $statement);

        $this->assertEquals($expectedParams, $parameterContainer->getNamedArray());
    }

    /**
     * @testdox integration test: Testing SelectDecorator will use Select an internal state to prepare a proper limit/offset sql statement
     * @covers Zend\Db\Sql\Platform\Mysql\SelectDecorator::getSqlString
     * @covers Zend\Db\Sql\Platform\Mysql\SelectDecorator::processLimit
     * @covers Zend\Db\Sql\Platform\Mysql\SelectDecorator::processOffset
     * @dataProvider dataProvider
     */
    public function testGetSqlString(Select $select, $notUsed, $notUsed, $expectedSql)
    {
        $parameterContainer = new ParameterContainer;
        $statement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $statement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($parameterContainer));

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $this->assertEquals($expectedSql, $selectDecorator->getSqlString(new MysqlPlatform));
    }

    public function dataProvider()
    {
        $select0 = new Select;
        $select0->from('foo')->limit(5)->offset(10);
        $expectedPrepareSql0 = 'SELECT `foo`.* FROM `foo` LIMIT ? OFFSET ?';
        $expectedParams0 = array('offset' => 10, 'limit' => 5);
        $expectedSql0 = 'SELECT `foo`.* FROM `foo` LIMIT 5 OFFSET 10';

        return array(
            array($select0, $expectedPrepareSql0, $expectedParams0, $expectedSql0),
        );
    }

}
