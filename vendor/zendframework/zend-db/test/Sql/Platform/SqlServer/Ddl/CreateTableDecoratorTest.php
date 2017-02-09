<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\SqlServer\Ddl;

use Zend\Db\Sql\Ddl\CreateTable;
use Zend\Db\Sql\Platform\SqlServer\Ddl\CreateTableDecorator;
use Zend\Db\Sql\Ddl\Column\Column;

class CreateTableDecoratorTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Platform\SqlServer\Ddl\CreateTableDecorator::getSqlString
     */
    public function testGetSqlString()
    {
        $ctd = new CreateTableDecorator();

        $ct = new CreateTable('foo');
        $this->assertEquals("CREATE TABLE \"foo\" ( \n)", $ctd->setSubject($ct)->getSqlString());

        $ct = new CreateTable('foo', true);
        $this->assertEquals("CREATE TABLE \"#foo\" ( \n)", $ctd->setSubject($ct)->getSqlString());

        $ct = new CreateTable('foo');
        $ct->addColumn(new Column('bar'));
        $this->assertEquals("CREATE TABLE \"foo\" ( \n    \"bar\" INTEGER NOT NULL \n)", $ctd->setSubject($ct)->getSqlString());

        $ct = new CreateTable('foo', true);
        $ct->addColumn(new Column('bar'));
        $this->assertEquals("CREATE TABLE \"#foo\" ( \n    \"bar\" INTEGER NOT NULL \n)", $ctd->setSubject($ct)->getSqlString());
    }
}
