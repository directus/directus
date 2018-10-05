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
use Zend\Db\Adapter\Driver\Pdo\Connection;
use Zend\Db\Adapter\Driver\Pdo\Pdo;
use Zend\Db\Adapter\Driver\Pdo\Result;
use Zend\Db\Adapter\Driver\Pdo\Statement;
use Zend\Db\Adapter\ParameterContainer;

class StatementTest extends TestCase
{
    /**
     * @var Statement
     */
    protected $statement;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        $this->statement = new Statement;
    }

    /**
     * Tears down the fixture, for example, closes a network connection.
     * This method is called after a test is executed.
     */
    protected function tearDown()
    {
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::setDriver
     */
    public function testSetDriver()
    {
        self::assertEquals($this->statement, $this->statement->setDriver(new Pdo([])));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::setParameterContainer
     */
    public function testSetParameterContainer()
    {
        self::assertSame($this->statement, $this->statement->setParameterContainer(new ParameterContainer));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::getParameterContainer
     * @todo   Implement testGetParameterContainer().
     */
    public function testGetParameterContainer()
    {
        $container = new ParameterContainer;
        $this->statement->setParameterContainer($container);
        self::assertSame($container, $this->statement->getParameterContainer());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::getResource
     */
    public function testGetResource()
    {
        $pdo = new TestAsset\SqliteMemoryPdo();
        $stmt = $pdo->prepare('SELECT 1');
        $this->statement->setResource($stmt);

        self::assertSame($stmt, $this->statement->getResource());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::setSql
     */
    public function testSetSql()
    {
        $this->statement->setSql('SELECT 1');
        self::assertEquals('SELECT 1', $this->statement->getSql());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::getSql
     */
    public function testGetSql()
    {
        $this->statement->setSql('SELECT 1');
        self::assertEquals('SELECT 1', $this->statement->getSql());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::prepare
     * @todo   Implement testPrepare().
     */
    public function testPrepare()
    {
        $this->statement->initialize(new TestAsset\SqliteMemoryPdo());
        self::assertNull($this->statement->prepare('SELECT 1'));
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::isPrepared
     */
    public function testIsPrepared()
    {
        self::assertFalse($this->statement->isPrepared());
        $this->statement->initialize(new TestAsset\SqliteMemoryPdo());
        $this->statement->prepare('SELECT 1');
        self::assertTrue($this->statement->isPrepared());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Statement::execute
     */
    public function testExecute()
    {
        $this->statement->setDriver(new Pdo(new Connection($pdo = new TestAsset\SqliteMemoryPdo())));
        $this->statement->initialize($pdo);
        $this->statement->prepare('SELECT 1');
        self::assertInstanceOf('Zend\Db\Adapter\Driver\Pdo\Result', $this->statement->execute());
    }
}
