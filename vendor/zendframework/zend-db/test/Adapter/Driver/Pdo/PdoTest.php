<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use Zend\Db\Adapter\Driver\DriverInterface;
use Zend\Db\Adapter\Driver\Pdo\Pdo;

class PdoTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Pdo
     */
    protected $pdo;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->pdo = new Pdo([]);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Pdo\Pdo::getDatabasePlatformName
     */
    public function testGetDatabasePlatformName()
    {
        // Test platform name for SqlServer
        $this->pdo->getConnection()->setConnectionParameters(['pdodriver' => 'sqlsrv']);
        $this->assertEquals('SqlServer', $this->pdo->getDatabasePlatformName());
        $this->assertEquals('SQLServer', $this->pdo->getDatabasePlatformName(DriverInterface::NAME_FORMAT_NATURAL));
    }
}
