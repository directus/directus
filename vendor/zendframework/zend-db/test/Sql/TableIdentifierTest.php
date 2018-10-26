<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql;

use PHPUnit\Framework\TestCase;
use stdClass;
use Zend\Db\Sql\TableIdentifier;

/**
 * Tests for {@see \Zend\Db\Sql\TableIdentifier}
 *
 * @covers \Zend\Db\Sql\TableIdentifier
 */
class TableIdentifierTest extends TestCase
{
    public function testGetTable()
    {
        $tableIdentifier = new TableIdentifier('foo');

        self::assertSame('foo', $tableIdentifier->getTable());
    }

    public function testGetDefaultSchema()
    {
        $tableIdentifier = new TableIdentifier('foo');

        self::assertNull($tableIdentifier->getSchema());
    }

    public function testGetSchema()
    {
        $tableIdentifier = new TableIdentifier('foo', 'bar');

        self::assertSame('bar', $tableIdentifier->getSchema());
    }

    public function testGetTableFromObjectStringCast()
    {
        $table = $this->getMockBuilder('stdClass')->setMethods(['__toString'])->getMock();

        $table->expects($this->once())->method('__toString')->will($this->returnValue('castResult'));

        $tableIdentifier = new TableIdentifier($table);

        self::assertSame('castResult', $tableIdentifier->getTable());
        self::assertSame('castResult', $tableIdentifier->getTable());
    }

    public function testGetSchemaFromObjectStringCast()
    {
        $schema = $this->getMockBuilder('stdClass')->setMethods(['__toString'])->getMock();

        $schema->expects($this->once())->method('__toString')->will($this->returnValue('castResult'));

        $tableIdentifier = new TableIdentifier('foo', $schema);

        self::assertSame('castResult', $tableIdentifier->getSchema());
        self::assertSame('castResult', $tableIdentifier->getSchema());
    }

    /**
     * @dataProvider invalidTableProvider
     *
     * @param mixed $invalidTable
     */
    public function testRejectsInvalidTable($invalidTable)
    {
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');

        new TableIdentifier($invalidTable);
    }

    /**
     * @dataProvider invalidSchemaProvider
     *
     * @param mixed $invalidSchema
     */
    public function testRejectsInvalidSchema($invalidSchema)
    {
        $this->expectException('Zend\Db\Sql\Exception\InvalidArgumentException');

        new TableIdentifier('foo', $invalidSchema);
    }

    /**
     * Data provider
     *
     * @return mixed[][]
     */
    public function invalidTableProvider()
    {
        return array_merge(
            [[null]],
            $this->invalidSchemaProvider()
        );
    }

    /**
     * Data provider
     *
     * @return mixed[][]
     */
    public function invalidSchemaProvider()
    {
        return [
            [''],
            [new stdClass()],
            [[]],
        ];
    }
}
