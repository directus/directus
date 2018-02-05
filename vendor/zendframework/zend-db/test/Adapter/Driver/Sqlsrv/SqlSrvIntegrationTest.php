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

/**
 * @group integration
 * @group integration-sqlserver
 */
class SqlSrvIntegrationTest extends AbstractIntegrationTest
{
    /**
     * @var Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv
     */
    private $driver;

    /**
     * @var resource SQL Server Connection
     */
    private $resource;

    public function setUp()
    {
        parent::setUp();
        $this->resource = $this->adapters['sqlsrv'];
        $this->driver = new Sqlsrv($this->resource);
    }

    /**
     * @group integration-sqlserver
     * @covers \Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::checkEnvironment
     */
    public function testCheckEnvironment()
    {
        $sqlserver = new Sqlsrv([]);
        self::assertNull($sqlserver->checkEnvironment());
    }

    public function testCreateStatement()
    {
        $stmt = $this->driver->createStatement('SELECT 1');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Sqlsrv\Statement', $stmt);
        $stmt = $this->driver->createStatement($this->resource);
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Sqlsrv\Statement', $stmt);
        $stmt = $this->driver->createStatement();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Sqlsrv\Statement', $stmt);

        $this->setExpectedException(
            'Zend\Db\Adapter\Exception\InvalidArgumentException',
            'only accepts an SQL string or a Sqlsrv resource'
        );
        $this->driver->createStatement(new \stdClass);
    }

    public function testParameterizedQuery()
    {
        $stmt = $this->driver->createStatement('SELECT ? as col_one');
        $result = $stmt->execute(['a']);
        $row = $result->current();
        $this->assertEquals('a', $row['col_one']);
    }
}
