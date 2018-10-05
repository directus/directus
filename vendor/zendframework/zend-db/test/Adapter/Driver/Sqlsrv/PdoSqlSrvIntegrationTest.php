<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Driver\Sqlsrv;

use Zend\Db\Adapter\Driver\Pdo\Pdo;

/**
 * @group integration
 * @group integration-sqlserver
 */
class PdoSqlSrvIntegrationTest extends AbstractIntegrationTest
{
    public function testParameterizedQuery()
    {
        $driver = new Pdo($this->adapters['pdo_sqlsrv']);

        $stmt = $driver->createStatement('SELECT ? as col_one');
        $result = $stmt->execute(['a']);
        $row = $result->current();
        $this->assertEquals('a', $row['col_one']);
    }
}
