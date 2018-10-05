<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\SqlServer;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\ParameterContainer;
use Zend\Db\Adapter\Platform\SqlServer as SqlServerPlatform;
use Zend\Db\Sql\Expression;
use Zend\Db\Sql\Platform\SqlServer\SelectDecorator;
use Zend\Db\Sql\Select;

class SelectDecoratorTest extends TestCase
{
    /**
     * @testdox integration test: Testing SelectDecorator will use Select an internal state to prepare
     *                            a proper limit/offset sql statement
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
        $driver->expects($this->exactly($expectedFormatParamCount))->method('formatParameterName')
            ->will($this->returnValue('?'));

        // test
        $adapter = $this->getMockBuilder('Zend\Db\Adapter\Adapter')
            ->setMethods()
            ->setConstructorArgs([
                $driver,
                new SqlServerPlatform(),
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
     * @covers \Zend\Db\Sql\Platform\SqlServer\SelectDecorator::getSqlString
     * @covers \Zend\Db\Sql\Platform\SqlServer\SelectDecorator::processLimitOffset
     * @dataProvider dataProvider
     */
    public function testGetSqlString(Select $select, $ignored, $alsoIgnored, $expectedSql)
    {
        $parameterContainer = new ParameterContainer;
        $statement = $this->getMockBuilder('Zend\Db\Adapter\Driver\StatementInterface')->getMock();
        $statement->expects($this->any())->method('getParameterContainer')
            ->will($this->returnValue($parameterContainer));

        $selectDecorator = new SelectDecorator;
        $selectDecorator->setSubject($select);
        self::assertEquals($expectedSql, $selectDecorator->getSqlString(new SqlServerPlatform));
    }

    public function dataProvider()
    {
        $select0 = new Select;
        $select0->from('foo')->columns(['bar', 'baz'])->order('bar')->limit(5)->offset(10);
        // @codingStandardsIgnoreStart
        $expectedPrepareSql0 = 'SELECT [bar], [baz] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [baz], ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?';
        // @codingStandardsIgnoreEnd
        $expectedParams0 = ['offset' => 10, 'limit' => 5, 'offsetForSum' => 10];
        // @codingStandardsIgnoreStart
        $expectedSql0 = 'SELECT [bar], [baz] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [baz], ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 5+10';
        // @codingStandardsIgnoreEnd
        $expectedFormatParamCount0 = 3;

        $select1 = new Select;
        $select1->from('foo')->columns(['bar', 'bam' => 'baz'])->limit(5)->offset(10);
        // @codingStandardsIgnoreStart
        $expectedPrepareSql1 = 'SELECT [bar], [bam] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [bam], ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?';
        // @codingStandardsIgnoreEnd
        $expectedParams1 = ['offset' => 10, 'limit' => 5, 'offsetForSum' => 10];
        // @codingStandardsIgnoreStart
        $expectedSql1 = 'SELECT [bar], [bam] FROM ( SELECT [foo].[bar] AS [bar], [foo].[baz] AS [bam], ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 5+10';
        // @codingStandardsIgnoreEnd
        $expectedFormatParamCount1 = 3;

        $select2 = new Select;
        $select2->from('foo')->order('bar')->limit(5)->offset(10);
        // @codingStandardsIgnoreStart
        $expectedPrepareSql2 = 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?';
        // @codingStandardsIgnoreEnd
        $expectedParams2 = ['offset' => 10, 'limit' => 5, 'offsetForSum' => 10];
        // @codingStandardsIgnoreStart
        $expectedSql2 = 'SELECT * FROM ( SELECT [foo].*, ROW_NUMBER() OVER (ORDER BY [bar] ASC) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 5+10';
        // @codingStandardsIgnoreEnd
        $expectedFormatParamCount2 = 3;

        $select3 = new Select;
        $select3->from('foo');
        $expectedPrepareSql3 = 'SELECT [foo].* FROM [foo]';
        $expectedParams3 = [];
        $expectedSql3 = 'SELECT [foo].* FROM [foo]';
        $expectedFormatParamCount3 = 0;

        $select4 = new Select;
        $select4->from('foo')->columns([new Expression('DISTINCT(bar) as bar')])->limit(5)->offset(10);
        // @codingStandardsIgnoreStart
        $expectedPrepareSql4 = 'SELECT DISTINCT(bar) as bar FROM ( SELECT DISTINCT(bar) as bar, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN ?+1 AND ?+?';
        // @codingStandardsIgnoreEnd
        $expectedParams4 = ['offset' => 10, 'limit' => 5, 'offsetForSum' => 10];
        // @codingStandardsIgnoreStart
        $expectedSql4 = 'SELECT DISTINCT(bar) as bar FROM ( SELECT DISTINCT(bar) as bar, ROW_NUMBER() OVER (ORDER BY (SELECT 1)) AS [__ZEND_ROW_NUMBER] FROM [foo] ) AS [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION] WHERE [ZEND_SQL_SERVER_LIMIT_OFFSET_EMULATION].[__ZEND_ROW_NUMBER] BETWEEN 10+1 AND 5+10';
        // @codingStandardsIgnoreEnd
        $expectedFormatParamCount4 = 3;

        return [
            [$select0, $expectedPrepareSql0, $expectedParams0, $expectedSql0, $expectedFormatParamCount0],
            [$select1, $expectedPrepareSql1, $expectedParams1, $expectedSql1, $expectedFormatParamCount1],
            [$select2, $expectedPrepareSql2, $expectedParams2, $expectedSql2, $expectedFormatParamCount2],
            [$select3, $expectedPrepareSql3, $expectedParams3, $expectedSql3, $expectedFormatParamCount3],
            [$select4, $expectedPrepareSql4, $expectedParams4, $expectedSql4, $expectedFormatParamCount4],
        ];
    }
}
