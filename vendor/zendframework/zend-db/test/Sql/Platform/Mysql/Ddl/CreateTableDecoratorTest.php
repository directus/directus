<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\Mysql\Ddl;

use Zend\Db\Adapter\Platform\Mysql;
use Zend\Db\Sql\Ddl\Column\Column;
use Zend\Db\Sql\Ddl\Constraint\PrimaryKey;
use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Platform\Mysql\Ddl\CreateTableDecorator;

class CreateTableDecoratorTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Platform\Mysql\Ddl\CreateTableDecorator::setSubject
     */
    public function testSetSubject()
    {
        $ctd = new CreateTableDecorator();
        $ct = new CreateTable;
        $this->assertSame($ctd, $ctd->setSubject($ct));
    }

    /**
     * @covers Zend\Db\Sql\Platform\Mysql\Ddl\CreateTableDecorator::getSqlString
     */
    public function testGetSqlString()
    {
        $ctd = new CreateTableDecorator();
        $ct = new CreateTable('foo');
        $ctd->setSubject($ct);

        $col = new Column('bar');
        $col->setOption('zerofill', true);
        $col->setOption('unsigned', true);
        $col->setOption('identity', true);
        $col->setOption('column-format', 'FIXED');
        $col->setOption('storage', 'memory');
        $col->setOption('comment', 'baz');
        $col->addConstraint(new PrimaryKey());
        $ct->addColumn($col);

        $this->assertEquals(
            "CREATE TABLE `foo` ( \n    `bar` INTEGER UNSIGNED ZEROFILL NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT 'baz' COLUMN_FORMAT FIXED STORAGE MEMORY \n)",
            @$ctd->getSqlString(new Mysql())
        );
    }
}
