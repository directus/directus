<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use Zend\Db\Adapter\Driver\Pdo\Connection;

class ConnectionTest extends \PHPUnit_Framework_TestCase
{

    /**
     * @var Connection
     */
    protected $connection = null;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->connection = new Connection();
    }

    /**
     * Test getResource method tries to connect to  the database, it should never return null
     *
     * @covers Zend\Db\Adapter\Driver\Pdo\Connection::getResource
     */
    public function testResource()
    {
        $this->setExpectedException('Zend\Db\Adapter\Exception\InvalidConnectionParametersException');
        $this->connection->getResource();
    }
}
