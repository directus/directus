<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Sql\Platform\SqlServer;

use PHPUnit\Framework\TestCase;
use Zend\Db\Sql\Platform\SqlServer\SqlServer;

class SqlServerTest extends TestCase
{
    /**
     * @testdox unit test / object test: Test SqlServer object has Select proxy
     * @covers \Zend\Db\Sql\Platform\SqlServer\SqlServer::__construct
     */
    public function testConstruct()
    {
        $sqlServer = new SqlServer;
        $decorators = $sqlServer->getDecorators();

        $type = key($decorators);
        $decorator = current($decorators);
        self::assertEquals('Zend\Db\Sql\Select', $type);
        self::assertInstanceOf('Zend\Db\Sql\Platform\SqlServer\SelectDecorator', $decorator);
    }
}
