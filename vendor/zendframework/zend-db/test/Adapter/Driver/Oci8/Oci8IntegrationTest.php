<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Oci8;

use Zend\Db\Adapter\Driver\Oci8\Oci8;

/**
 * @group integration
 * @group integration-oracle
 */
class Oci8IntegrationTest extends AbstractIntegrationTest
{
    /**
     * @group integration-oci8
     * @covers \Zend\Db\Adapter\Driver\Oci8\Oci8::checkEnvironment
     */
    public function testCheckEnvironment()
    {
        $sqlserver = new Oci8([]);
        self::assertNull($sqlserver->checkEnvironment());
    }

    public function testCreateStatement()
    {
        $driver = new Oci8([]);
        $resource = oci_connect(
            $this->variables['username'],
            $this->variables['password'],
            $this->variables['hostname']
        );

        $driver->getConnection()->setResource($resource);

        $stmt = $driver->createStatement('SELECT * FROM DUAL');
        self::assertInstanceOf('Zend\Db\Adapter\Driver\Oci8\Statement', $stmt);
        $stmt = $driver->createStatement();
        self::assertInstanceOf('Zend\Db\Adapter\Driver\Oci8\Statement', $stmt);

        $this->expectException('Zend\Db\Adapter\Exception\InvalidArgumentException');
        $this->expectExceptionMessage('only accepts an SQL string or an oci8 resource');
        $driver->createStatement(new \stdClass);
    }
}
