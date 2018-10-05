<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Pdo;

use PHPUnit\Framework\TestCase;
use ZendTest\Db\TestAsset\ConnectionWrapper;

/**
 * Tests for {@see \Zend\Db\Adapter\Driver\Pdo\Connection} transaction support
 *
 * @covers \Zend\Db\Adapter\Driver\Pdo\Connection
 * @covers \Zend\Db\Adapter\Driver\AbstractConnection
 */
class ConnectionTransactionsTest extends TestCase
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
        self::assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->beginTransaction());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     */
    public function testBeginTransactionSetsInTransactionAtTrue()
    {
        $this->wrapper->beginTransaction();
        self::assertTrue($this->wrapper->inTransaction());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     */
    public function testCommitReturnsInstanceOfConnection()
    {
        $this->wrapper->beginTransaction();
        self::assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->commit());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     */
    public function testCommitSetsInTransactionAtFalse()
    {
        $this->wrapper->beginTransaction();
        $this->wrapper->commit();
        self::assertFalse($this->wrapper->inTransaction());
    }

    /**
     * Standalone commit after a SET autocommit=0;
     *
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     */
    public function testCommitWithoutBeginReturnsInstanceOfConnection()
    {
        self::assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->commit());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::commit()
     */
    public function testNestedTransactionsCommit()
    {
        $nested = 0;

        self::assertFalse($this->wrapper->inTransaction());

        // 1st transaction
        $this->wrapper->beginTransaction();
        self::assertTrue($this->wrapper->inTransaction());
        self::assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // 2nd transaction
        $this->wrapper->beginTransaction();
        self::assertTrue($this->wrapper->inTransaction());
        self::assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // 1st commit
        $this->wrapper->commit();
        self::assertTrue($this->wrapper->inTransaction());
        self::assertSame(-- $nested, $this->wrapper->getNestedTransactionsCount());

        // 2nd commit
        $this->wrapper->commit();
        self::assertFalse($this->wrapper->inTransaction());
        self::assertSame(-- $nested, $this->wrapper->getNestedTransactionsCount());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::beginTransaction()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     */
    public function testNestedTransactionsRollback()
    {
        $nested = 0;

        self::assertFalse($this->wrapper->inTransaction());

        // 1st transaction
        $this->wrapper->beginTransaction();
        self::assertTrue($this->wrapper->inTransaction());
        self::assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // 2nd transaction
        $this->wrapper->beginTransaction();
        self::assertTrue($this->wrapper->inTransaction());
        self::assertSame(++ $nested, $this->wrapper->getNestedTransactionsCount());

        // Rollback
        $this->wrapper->rollback();
        self::assertFalse($this->wrapper->inTransaction());
        self::assertSame(0, $this->wrapper->getNestedTransactionsCount());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     */
    public function testRollbackDisconnectedThrowsException()
    {
        $this->wrapper->disconnect();

        $this->expectException('\Zend\Db\Adapter\Exception\RuntimeException');
        $this->expectExceptionMessage('Must be connected before you can rollback');
        $this->wrapper->rollback();
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     */
    public function testRollbackReturnsInstanceOfConnection()
    {
        $this->wrapper->beginTransaction();
        self::assertInstanceOf('\Zend\Db\Adapter\Driver\Pdo\Connection', $this->wrapper->rollback());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::inTransaction()
     */
    public function testRollbackSetsInTransactionAtFalse()
    {
        $this->wrapper->beginTransaction();
        $this->wrapper->rollback();
        self::assertFalse($this->wrapper->inTransaction());
    }

    /**
     * @covers \Zend\Db\Adapter\Driver\Pdo\Connection::rollback()
     */
    public function testRollbackWithoutBeginThrowsException()
    {
        $this->expectException('\Zend\Db\Adapter\Exception\RuntimeException');
        $this->expectExceptionMessage('Must call beginTransaction() before you can rollback');
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
        self::assertFalse($this->wrapper->inTransaction());
        self::assertSame(0, $this->wrapper->getNestedTransactionsCount());

        $this->wrapper->commit();

        self::assertFalse($this->wrapper->inTransaction());
        self::assertSame(0, $this->wrapper->getNestedTransactionsCount());
    }
}
