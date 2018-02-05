<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Sqlsrv;

use Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv;
use Zend\Db\Adapter\Driver\Sqlsrv\Statement;

/**
 * @group integration
 * @group integration-sqlserver
 */
class StatementIntegrationTest extends AbstractIntegrationTest
{
    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Statement::initialize
     */
    public function testInitialize()
    {
        $sqlsrvResource = sqlsrv_connect(
            $this->variables['hostname'],
            ['UID' => $this->variables['username'], 'PWD' => $this->variables['password']]
        );

        $statement = new Statement;
        self::assertSame($statement, $statement->initialize($sqlsrvResource));
        unset($stmtResource, $sqlsrvResource);
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Statement::getResource
     */
    public function testGetResource()
    {
        $sqlsrvResource = sqlsrv_connect(
            $this->variables['hostname'],
            ['UID' => $this->variables['username'], 'PWD' => $this->variables['password']]
        );

        $statement = new Statement;
        $statement->initialize($sqlsrvResource);
        $statement->prepare("SELECT 'foo'");
        $resource = $statement->getResource();
        self::assertEquals('SQL Server Statement', get_resource_type($resource));
        unset($resource, $sqlsrvResource);
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Statement::prepare
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Statement::isPrepared
     */
    public function testPrepare()
    {
        $sqlsrvResource = sqlsrv_connect(
            $this->variables['hostname'],
            ['UID' => $this->variables['username'], 'PWD' => $this->variables['password']]
        );

        $statement = new Statement;
        $statement->initialize($sqlsrvResource);
        self::assertFalse($statement->isPrepared());
        self::assertSame($statement, $statement->prepare("SELECT 'foo'"));
        self::assertTrue($statement->isPrepared());
        unset($resource, $sqlsrvResource);
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Statement::execute
     */
    public function testExecute()
    {
        $sqlsrv = new Sqlsrv($this->variables);
        $statement = $sqlsrv->createStatement("SELECT 'foo'");
        self::assertSame($statement, $statement->prepare());

        $result = $statement->execute();
        self::assertInstanceOf('Zend\Db\Adapter\Driver\Sqlsrv\Result', $result);

        unset($resource, $sqlsrvResource);
    }
}
