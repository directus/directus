<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\SqlServer;

use Zend\Db\Sql\Platform\SqlServer\SelectDecorator;
use Zend\Db\Sql\Select;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\SqlServer as SqlServerPlatform;

class SelectDecoratorTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @testdox integration test: Testing SelectDecorator will use Select an internal state to prepare a proper limit/offset sql statement
     * @covers Zend\Db\Sql\Platform\SqlServer\SelectDecorator::prepareStatement
     * @covers Zend\Db\Sql\Platform\SqlServer\SelectDecorator::processLimitOffset
     * @dataProvider dataProvider
     */
    public function testPrepareStatement(Select $select, $expectedSql, $expectedParams)
    {
        // test
        $adapter = $this->getMock(
            'Zend\Db\Adapter\Adapter',
            null,
            array(
                $this->getMock('Zend\Db\Adapter\Driver\DriverInterface'),
                new SqlServerPlatform()
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
     * @covers Zend\Db\Sql\Platform\SqlServer\SelectDecorator::getSqlString
     * @covers Zend\Db\Sql\Platform\SqlServer\SelectDecorator::processLimitOffset
     * @dataProvider dataProvider
     */
    public function testGetSqlString(Select $select, $notUsed, $notUsed, $expectedSql)
    {
        $parameterContainer = new ParameterContainer;
        $statement = $this->getMock('Zend\Db\Adapter\Driver\StatementInterface');
        $statement->expects($this->any())->method('getParameterContainer')->will($this->returnValue($parameterContainer));

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        $this->assertEquals($expectedSql, $selectDecorator->getSqlString(new SqlServerPlatform));
    }

    public function dataProvider()
    {
        $select0 = new Select;
        $select0->from('foo')->columns(array('bar', 'baz'))->order('bar')->limit(5)->offset(10);
        $expectedPrepareSql0 = 'SELECT [bar], [baz] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [baz], ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?';
        $expectedParams0 = array('offset' => 10, 'limit' => 5, 'offsetForSum' => 10);
        $expectedSql0 = 'SELECT [bar], [baz] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [baz], ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 5+10';

        $select1 = new Select;
        $select1->from('foo')->columns(array('bar', 'bam' => 'baz'))->limit(5)->offset(10);
        $expectedPrepareSql1 = 'SELECT [bar], [bam] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [bam], ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?';
        $expectedParams1 = array('offset' => 10, 'limit' => 5, 'offsetForSum' => 10);
        $expectedSql1 = 'SELECT [bar], [bam] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [bam], ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 5+10';

        $select2 = new Select;
        $select2->from('foo')->order('bar')->limit(5)->offset(10);
        $expectedPrepareSql2 = 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?';
        $expectedParams2 = array('offset' => 10, 'limit' => 5, 'offsetForSum' => 10);
        $expectedSql2 = 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 5+10';

        $select3 = new Select;
        $select3->from('foo');
        $expectedPrepareSql3 = 'SELECT [foo].* FROM [foo]';
        $expectedParams3 = array();
        $expectedSql3 = 'SELECT [foo].* FROM [foo]';

        return array(
            array($select0, $expectedPrepareSql0, $expectedParams0, $expectedSql0),
            array($select1, $expectedPrepareSql1, $expectedParams1, $expectedSql1),
            array($select2, $expectedPrepareSql2, $expectedParams2, $expectedSql2),
            array($select3, $expectedPrepareSql3, $expectedParams3, $expectedSql3)
        );
    }

}
