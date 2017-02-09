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
     * @group integration-sqlserver
     * @covers Zend\Db\Adapter\Driver\Sqlsrv\Sqlsrv::checkEnvironment
     */
    public function testCheckEnvironment()
    {
        $sqlserver = new Sqlsrv([]);
        $this->assertNull($sqlserver->checkEnvironment());
    }

    public function testCreateStatement()
    {
        $driver = new Sqlsrv([]);

        $resource = sqlsrv_connect(
            $this->variables['hostname'], [
                'UID' => $this->variables['username'],
                'PWD' => $this->variables['password']
            ]
        );

        $driver->getConnection()->setResource($resource);

        $stmt = $driver->createStatement('SELECT 1');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Sqlsrv\Statement', $stmt);
        $stmt = $driver->createStatement($resource);
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Sqlsrv\Statement', $stmt);
        $stmt = $driver->createStatement();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Sqlsrv\Statement', $stmt);

        $this->setExpectedException('Zend\Db\Adapter\Exception\InvalidArgumentException', 'only accepts an SQL string or a Sqlsrv resource');
        $driver->createStatement(new \stdClass);
    }
}
