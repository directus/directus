<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Oci8;

use Zend\Db\Adapter\Driver\Oci8\Oci8;
use Zend\Db\Adapter\Driver\Oci8\Statement;

/**
 * @group integration
 * @group integration-oracle
 */
class StatementIntegrationTest extends \PHPUnit_Framework_TestCase
{

    protected $variables = array(
        'hostname' => 'ZEND_DB_ADAPTER_DRIVER_OCI8_HOSTNAME',
        'username' => 'ZEND_DB_ADAPTER_DRIVER_OCI8_USERNAME',
        'password' => 'ZEND_DB_ADAPTER_DRIVER_OCI8_PASSWORD',
    );

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        foreach ($this->variables as $name => $value) {
            if (!isset($GLOBALS[$value])) {
                $this->fail('Missing required variable ' . $value . ' from phpunit.xml for this integration test');
            }
            $this->variables[$name] = $GLOBALS[$value];
        }

        if (!extension_loaded('oci8')) {
            $this->fail('The phpunit group integration-oracle was enabled, but the extension is not loaded.');
        }
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Statement::initialize
     */
    public function testInitialize()
    {
        $ociResource = oci_connect($this->variables['username'], $this->variables['password']);

        $statement = new Statement;
        $this->assertSame($statement, $statement->initialize($ociResource));
        unset($stmtResource, $ociResource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Statement::getResource
     */
    public function testGetResource()
    {
        $ociResource = oci_connect($this->variables['username'], $this->variables['password']);

        $statement = new Statement;
        $statement->initialize($ociResource);
        $statement->prepare('SELECT * FROM DUAL');
        $resource = $statement->getResource();
        $this->assertEquals('oci8 statement', get_resource_type($resource));
        unset($resource, $ociResource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Statement::prepare
     * @covers Zend\Db\Adapter\Driver\Oci8\Statement::isPrepared
     */
    public function testPrepare()
    {
        $ociResource = oci_connect($this->variables['username'], $this->variables['password']);

        $statement = new Statement;
        $statement->initialize($ociResource);
        $this->assertFalse($statement->isPrepared());
        $this->assertSame($statement, $statement->prepare('SELECT * FROM DUAL'));
        $this->assertTrue($statement->isPrepared());
        unset($resource, $ociResource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\Oci8\Statement::execute
     */
    public function testExecute()
    {
        $oci8 = new Oci8($this->variables);
        $statement = $oci8->createStatement('SELECT * FROM DUAL');
        $this->assertSame($statement, $statement->prepare());

        $result = $statement->execute();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\Oci8\Result', $result);

        unset($resource, $oci8);
    }
}
