<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Metadata\Source;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Adapter;
use Zend\Db\Metadata\Source\SqliteMetadata;

/**
 * @requires extension pdo_sqlite
 */
class SqliteMetadataTest extends TestCase
{
    /**
     * @var SqliteMetadata
     */
    protected $metadata;

    /**
     * @var Adapter
     */
    protected $adapter;

    /**
     * Sets up the fixture, for example, opens a network connection.
     * This method is called before a test is executed.
     */
    protected function setUp()
    {
        if (! extension_loaded('pdo_sqlite')) {
            $this->markTestSkipped('I cannot test without the pdo_sqlite extension');
        }
        $this->adapter = new Adapter([
            'driver' => 'Pdo',
            'dsn' => 'sqlite::memory:',
        ]);
        $this->metadata = new SqliteMetadata($this->adapter);
    }

    public function testGetSchemas()
    {
        $schemas = $this->metadata->getSchemas();
        self::assertContains('main', $schemas);
        self::assertCount(1, $schemas);
    }

    public function testGetTableNames()
    {
        $tables = $this->metadata->getTableNames('main');
        self::assertCount(0, $tables);
    }

    public function testGetColumnNames()
    {
        $columns = $this->metadata->getColumnNames(null, 'main');
        self::assertCount(0, $columns);
    }

    public function testGetConstraints()
    {
        $constraints = $this->metadata->getConstraints(null, 'main');
        self::assertCount(0, $constraints);
        self::assertContainsOnlyInstancesOf(
            'Zend\Db\Metadata\Object\ConstraintObject',
            $constraints
        );
    }

    /**
     * @group ZF2-3719
     */
    public function testGetConstraintKeys()
    {
        $keys = $this->metadata->getConstraintKeys(
            null,
            null,
            'main'
        );
        self::assertCount(0, $keys);
        self::assertContainsOnlyInstancesOf(
            'Zend\Db\Metadata\Object\ConstraintKeyObject',
            $keys
        );
    }

    public function testGetTriggers()
    {
        $triggers = $this->metadata->getTriggers('main');
        self::assertCount(0, $triggers);
        self::assertContainsOnlyInstancesOf(
            'Zend\Db\Metadata\Object\TriggerObject',
            $triggers
        );
    }
}
