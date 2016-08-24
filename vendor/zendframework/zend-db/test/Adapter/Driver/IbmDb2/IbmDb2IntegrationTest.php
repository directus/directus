<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\IbmDb2;

use Zend\Db\Adapter\Driver\IbmDb2\IbmDb2;

/**
 * @group integration
 * @group integration-ibm_db2
 */
class IbmDb2IntegrationTest extends AbstractIntegrationTest
{
    /**
     * @group integration-ibm_db2
     * @covers Zend\Db\Adapter\Driver\IbmDb2\IbmDb2::checkEnvironment
     */
    public function testCheckEnvironment()
    {
        $ibmdb2 = new IbmDb2(array());
        $this->assertNull($ibmdb2->checkEnvironment());
    }

    public function testCreateStatement()
    {
        $driver = new IbmDb2(array());

        $resource = db2_connect(
            $this->variables['database'],
            $this->variables['username'],
            $this->variables['password']
        );

        $stmtResource = db2_prepare($resource, 'SELECT 1 FROM SYSIBM.SYSDUMMY1');

        $driver->getConnection()->setResource($resource);

        $stmt = $driver->createStatement('SELECT 1 FROM SYSIBM.SYSDUMMY1');
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\IbmDb2\Statement', $stmt);
        $stmt = $driver->createStatement($stmtResource);
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\IbmDb2\Statement', $stmt);
        $stmt = $driver->createStatement();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\IbmDb2\Statement', $stmt);

        $this->setExpectedException('Zend\Db\Adapter\Exception\InvalidArgumentException', 'only accepts an SQL string or a ibm_db2 resource');
        $driver->createStatement(new \stdClass);
    }

}
