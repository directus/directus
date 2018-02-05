<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Driver\Pdo\Statement;

class StatementIntegrationTest extends TestCase
{
    /**
     * @var Statement
     */
    protected $statement;

    /**
     * @var \PHPUnit_Framework_MockObject_MockObject
     */
    protected $pdoStatementMock;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $driver = $this->getMockBuilder('Zend\Db\Adapter\Driver\Pdo\Pdo')
            ->setMethods(['createResult'])
            ->disableOriginalConstructor()
            ->getMock();

        $this->statement = new Statement;
        $this->statement->setDriver($driver);
        $this->statement->initialize(new TestAsset\CtorlessPdo(
            $this->pdoStatementMock = $this->getMockBuilder('PDOStatement')
                ->setMethods(['execute', 'bindParam'])
                ->getMock()
        ));
    }

    /**
     * Tears down the fixture, for example, closes a network connection.
     * This method is called after a test is executed.
     */
    protected function tearDown()
    {
    }

    public function testStatementExecuteWillConvertPhpBoolToPdoBoolWhenBinding()
    {
        $this->pdoStatementMock->expects($this->any())->method('bindParam')->with(
            $this->equalTo(':foo'),
            $this->equalTo(false),
            $this->equalTo(\PDO::PARAM_BOOL)
        );
        $this->statement->execute(['foo' => false]);
    }

    public function testStatementExecuteWillUsePdoStrByDefaultWhenBinding()
    {
        $this->pdoStatementMock->expects($this->any())->method('bindParam')->with(
            $this->equalTo(':foo'),
            $this->equalTo('bar'),
            $this->equalTo(\PDO::PARAM_STR)
        );
        $this->statement->execute(['foo' => 'bar']);
    }
}
