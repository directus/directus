<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Ddl\AlterTable;
use Zend\Db\Sql\Ddl\Column;
use Zend\Db\Sql\Ddl\Constraint;

class AlterTableTest extends TestCase
{
    /**
     * @covers \Zend\Db\Sql\Ddl\AlterTable::setTable
     */
    public function testSetTable()
    {
        $at = new AlterTable();
        self::assertEquals('', $at->getRawState('table'));
        self::assertSame($at, $at->setTable('test'));
        self::assertEquals('test', $at->getRawState('table'));
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\AlterTable::addColumn
     */
    public function testAddColumn()
    {
        $at = new AlterTable();
        /** @var \Zend\Db\Sql\Ddl\Column\ColumnInterface $colMock */
        $colMock = $this->getMockBuilder('Zend\Db\Sql\Ddl\Column\ColumnInterface')->getMock();
        self::assertSame($at, $at->addColumn($colMock));
        self::assertEquals([$colMock], $at->getRawState($at::ADD_COLUMNS));
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\AlterTable::changeColumn
     */
    public function testChangeColumn()
    {
        $at = new AlterTable();
        /** @var \Zend\Db\Sql\Ddl\Column\ColumnInterface $colMock */
        $colMock = $this->getMockBuilder('Zend\Db\Sql\Ddl\Column\ColumnInterface')->getMock();
        self::assertSame($at, $at->changeColumn('newname', $colMock));
        self::assertEquals(['newname' => $colMock], $at->getRawState($at::CHANGE_COLUMNS));
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\AlterTable::dropColumn
     */
    public function testDropColumn()
    {
        $at = new AlterTable();
        self::assertSame($at, $at->dropColumn('foo'));
        self::assertEquals(['foo'], $at->getRawState($at::DROP_COLUMNS));
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\AlterTable::dropConstraint
     */
    public function testDropConstraint()
    {
        $at = new AlterTable();
        self::assertSame($at, $at->dropConstraint('foo'));
        self::assertEquals(['foo'], $at->getRawState($at::DROP_CONSTRAINTS));
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\AlterTable::addConstraint
     */
    public function testAddConstraint()
    {
        $at = new AlterTable();
        /** @var \Zend\Db\Sql\Ddl\Constraint\ConstraintInterface $conMock */
        $conMock = $this->getMockBuilder('Zend\Db\Sql\Ddl\Constraint\ConstraintInterface')->getMock();
        self::assertSame($at, $at->addConstraint($conMock));
        self::assertEquals([$conMock], $at->getRawState($at::ADD_CONSTRAINTS));
    }

    /**
     * @covers \Zend\Db\Sql\Ddl\AlterTable::getSqlString
     * @todo   Implement testGetSqlString().
     */
    public function testGetSqlString()
    {
        $at = new AlterTable('foo');
        $at->addColumn(new Column\Varchar('another', 255));
        $at->changeColumn('name', new Column\Varchar('new_name', 50));
        $at->dropColumn('foo');
        $at->addConstraint(new Constraint\ForeignKey('my_fk', 'other_id', 'other_table', 'id', 'CASCADE', 'CASCADE'));
        $at->dropConstraint('my_index');
        $expected = <<<EOS
ALTER TABLE "foo"
 ADD COLUMN "another" VARCHAR(255) NOT NULL,
 CHANGE COLUMN "name" "new_name" VARCHAR(50) NOT NULL,
 DROP COLUMN "foo",
 ADD CONSTRAINT "my_fk" FOREIGN KEY ("other_id") REFERENCES "other_table" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
 DROP CONSTRAINT "my_index"
EOS;

        $actual = $at->getSqlString();
        self::assertEquals(
            str_replace(["\r", "\n"], "", $expected),
            str_replace(["\r", "\n"], "", $actual)
        );
    }
}
