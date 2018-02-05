<?php
/**
 * Zend Framework (http://framework.zend.com/)
 *
 * @link      http://github.com/zendframework/zf2 for the canonical source repository
 * @copyright Copyright (c) 2005-2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace ZendTest\Db\Adapter\Platform;

use PHPUnit\Framework\TestCase;
use Zend\Db\Adapter\Driver\Pdo;
use Zend\Db\Adapter\Platform\Sqlite;

/**
 * @group integration
 * @group integration-sqlite
 */
class SqliteIntegrationTest extends TestCase
{
    public $adapters = [];

    public function testQuoteValueWithPdoSqlite()
    {
        if (! $this->adapters['pdo_sqlite'] instanceof \PDO) {
            $this->markTestSkipped('SQLite (PDO_SQLITE) not configured in unit test configuration file');
        }
        $sqlite = new Sqlite($this->adapters['pdo_sqlite']);
        $value = $sqlite->quoteValue('value');
        self::assertEquals('\'value\'', $value);

        $sqlite = new Sqlite(new Pdo\Pdo(new Pdo\Connection($this->adapters['pdo_sqlite'])));
        $value = $sqlite->quoteValue('value');
        self::assertEquals('\'value\'', $value);
    }
}
