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
use Zend\Db\Adapter\Driver\IbmDb2\Statement;

/**
 * @group integration
 * @group integration-ibm_db2
 */
class StatementIntegrationTest extends \PHPUnit_Framework_TestCase
{

    protected $variables = array(
        'database' => 'ZEND_DB_ADAPTER_DRIVER_IBMDB2_DATABASE',
        'username' => 'ZEND_DB_ADAPTER_DRIVER_IBMDB2_USERNAME',
        'password' => 'ZEND_DB_ADAPTER_DRIVER_IBMDB2_PASSWORD',
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

        if (!extension_loaded('ibm_db2')) {
            $this->fail('The phpunit group integration-ibm_db2 was enabled, but the extension is not loaded.');
        }
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Statement::initialize
     */
    public function testInitialize()
    {
        $db2Resource = db2_connect($this->variables['database'], $this->variables['username'], $this->variables['password']);

        $statement = new Statement;
        $this->assertSame($statement, $statement->initialize($db2Resource));
        unset($stmtResource, $db2Resource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Statement::getResource
     */
    public function testGetResource()
    {
        $db2Resource = db2_connect($this->variables['database'], $this->variables['username'], $this->variables['password']);

        $statement = new Statement;
        $statement->initialize($db2Resource);
        $statement->prepare("SELECT 'foo'");
        $resource = $statement->getResource();
        $this->assertEquals('DB2 Statement', get_resource_type($resource));
        unset($resource, $db2Resource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Statement::prepare
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Statement::isPrepared
     */
    public function testPrepare()
    {
        $db2Resource = db2_connect($this->variables['database'], $this->variables['username'], $this->variables['password']);

        $statement = new Statement;
        $statement->initialize($db2Resource);
        $this->assertFalse($statement->isPrepared());
        $this->assertSame($statement, $statement->prepare("SELECT 'foo' FROM SYSIBM.SYSDUMMY1"));
        $this->assertTrue($statement->isPrepared());
        unset($resource, $db2Resource);
    }

    /**
     * @covers Zend\Db\Adapter\Driver\IbmDb2\Statement::execute
     */
    public function testExecute()
    {
        $ibmdb2 = new IbmDb2($this->variables);
        $statement = $ibmdb2->createStatement("SELECT 'foo' FROM SYSIBM.SYSDUMMY1");
        $this->assertSame($statement, $statement->prepare());

        $result = $statement->execute();
        $this->assertInstanceOf('Zend\Db\Adapter\Driver\IbmDb2\Result', $result);

        unset($resource, $ibmdb2);
    }
}
