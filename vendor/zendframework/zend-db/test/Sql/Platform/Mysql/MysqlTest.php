<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\Mysql;

use Zend\Db\Sql\Platform\Mysql\Mysql;

class MysqlTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @testdox unit test / object test: Test Mysql object has Select proxy
     * @covers Zend\Db\Sql\Platform\Mysql\Mysql::__construct
     */
    public function testConstruct()
    {
        $mysql = new Mysql;
        $decorators = $mysql->getDecorators();

        list($type, $decorator) = each($decorators);
        $this->assertEquals('Zend\Db\Sql\Select', $type);
        $this->assertInstanceOf('Zend\Db\Sql\Platform\Mysql\SelectDecorator', $decorator);
    }

}
