<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2013 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use Zend\Db\Adapter\Platform\SqlServer;

/**
 * @group integration
 * @group integration-sqlserver
 */
class SqlServerIntegrationTest extends \PHPUnit_Framework_TestCase
{
    public $adapters = array();

    public function testQuoteValueWithSqlServer()
    {
        if (!$this->adapters['pdo_sqlsrv']) {
            $this->markTestSkipped('SQLServer (pdo_sqlsrv) not configured in unit test configuration file');
        }
        $sqlite = new SqlServer($this->adapters['pdo_sqlsrv']);
        $value = $sqlite->quoteValue('value');
        $this->assertEquals('\'value\'', $value);

    }
}
