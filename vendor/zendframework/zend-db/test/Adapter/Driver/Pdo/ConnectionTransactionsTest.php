<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use ZendTest\Db\TestAsset\ConnectionWrapper;

/**
 * Tests for {@see \Zend\Db\Adapter\Driver\Pdo\Connection} transaction support
 *
 * @covers \Zend\Db\Adapter\Driver\Pdo\Connection
 * @covers \Zend\Db\Adapter\Driver\AbstractConnection
 */
class ConnectionTransactionsTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Wrapper
     */
    protected $wrapper;

    /**
     * {@inheritDoc}
     */
    protected function setUp()
    {
        $this->wrapper = new ConnectionWrapper();
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction()
     */
    public function testBeginTransactionReturnsInstanceOfConnection()
    {
        $this->assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->beginTransaction());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     */
    public function testBeginTransactionSetsInTransactionAtTrue()
    {
        $this->wrapper->beginTransaction();
        $this->assertTrue($this->wrapper->inTransaction());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     */
    public function testCommitReturnsInstanceOfConnection()
    {
        $this->wrapper->beginTransaction();
        $this->assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->commit());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     */
    public function testCommitSetsInTransactionAtFalse()
    {
        $this->wrapper->beginTransaction();
        $this->wrapper->commit();
        $this->assertFalse($this->wrapper->inTransaction());
    }

    /**
     * Standalone commit after a SET autocommit=0;
     *
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     */
    public function testCommitWithoutBeginReturnsInstanceOfConnection()
    {
        $this->assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->commit());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     */
    public function testNestedTransactionsCommit()
    {
        $nested = 0;

        $this->assertFalse($this->wrapper->inTransaction());

        // 1st transaction
        $this->wrapper->beginTransaction();
        $this->assertTrue($this->wrapper->inTransaction());
        $this->assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // 2nd transaction
        $this->wrapper->beginTransaction();
        $this->assertTrue($this->wrapper->inTransaction());
        $this->assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // 1st commit
        $this->wrapper->commit();
        $this->assertTrue($this->wrapper->inTransaction());
        $this->assertSame(-- $nested, $this->wrapper->getNestedTransactionsCount());

        // 2nd commit
        $this->wrapper->commit();
        $this->assertFalse($this->wrapper->inTransaction());
        $this->assertSame(-- $nested, $this->wrapper->getNestedTransactionsCount());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     */
    public function testNestedTransactionsRollback()
    {
        $nested = 0;

        $this->assertFalse($this->wrapper->inTransaction());

        // 1st transaction
        $this->wrapper->beginTransaction();
        $this->assertTrue($this->wrapper->inTransaction());
        $this->assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // 2nd transaction
        $this->wrapper->beginTransaction();
        $this->assertTrue($this->wrapper->inTransaction());
        $this->assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // Rollback
        $this->wrapper->rollback();
        $this->assertFalse($this->wrapper->inTransaction());
        $this->assertSame(0, $this->wrapper->getNestedTransactionsCount());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     * @expectedException \Zend\Db\Adapter\Exception\RuntimeException
     * @expectedExceptionMessage Must be connected before you can rollback
     */
    public function testRollbackDisconnectedThrowsException()
    {
        $this->wrapper->disconnect();
        $this->wrapper->rollback();
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     */
    public function testRollbackReturnsInstanceOfConnection()
    {
        $this->wrapper->beginTransaction();
        $this->assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->rollback());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     */
    public function testRollbackSetsInTransactionAtFalse()
    {
        $this->wrapper->beginTransaction();
        $this->wrapper->rollback();
        $this->assertFalse($this->wrapper->inTransaction());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     * @expectedException \Zend\Db\Adapter\Exception\RuntimeException
     * @expectedExceptionMessage Must call beginTransaction() before you can rollback
     */
    public function testRollbackWithoutBeginThrowsException()
    {
        $this->wrapper->rollback();
    }

    /**
     * Standalone commit after a SET autocommit=0;
     *
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     */
    public function testStandaloneCommit()
    {
        $this->assertFalse($this->wrapper->inTransaction());
        $this->assertSame(0, $this->wrapper->getNestedTransactionsCount());

        $this->wrapper->commit();

        $this->assertFalse($this->wrapper->inTransaction());
        $this->assertSame(0, $this->wrapper->getNestedTransactionsCount());
    }
}
