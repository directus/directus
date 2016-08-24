<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Ddl;

use Zend\Db\Sql\Ddl\DropTable;

class DropTableTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers Zend\Db\Sql\Ddl\DropTable::getSqlString
     */
    public function testGetSqlString()
    {
        $dt = new DropTable('foo');
        $this->assertEquals('DROP TABLE "foo"', $dt->getSqlString());
    }
}
