<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\Oracle;

use Zend\Db\Sql\Platform\Oracle\SelectDecorator;
use Zend\Db\Sql\Select;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\Oracle as OraclePlatform;

class SelectDecoratorTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @testdox integration test: Testing SelectDecorator will use Select an internal state to prepare a proper from alias sql statement
     * @covers Zend\Db\Sql\Platform\Oracle\SelectDecorator::getSqlString
     * @dataProvider dataProvider
     */
    public function testGetSqlString(Select $select, $expectedSql)
    {
        $parameterContainer = new ParameterContainer;
        $statement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $statement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($parameterContainer));

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $this->assertEquals($expectedSql, $selectDecorator->getSqlString(new OraclePlatform));
    }

    /**
     * Data provider for testGetSqlString
     *
     * @return array
     */
    public function dataProvider()
    {
        $select0 = new Select;
        $select0->from(array('x' => 'foo'));
        $expectedSql0 = 'SELECT "x".* FROM "foo" "x"';

        return array(
            array($select0, $expectedSql0),
        );
    }

}
