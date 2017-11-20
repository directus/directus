<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\Cache;
use Doctrine\Common\Cache\SQLite3Cache;
use SQLite3;

/**
 * @requires extension sqlite3
 */
class SQLite3Test extends CacheTest
{
    private $file;
    private $sqlite;

    protected function setUp()
    {
        $this->file = tempnam(null, 'doctrine-cache-test-');
        unlink($this->file);
        $this->sqlite = new SQLite3($this->file);
    }

    protected function tearDown()
    {
        $this->sqlite = null;  // DB must be closed before
        unlink($this->file);
    }

    public function testGetStats()
    {
        $this->assertNull($this->_getCacheDriver()->getStats());
    }

    /**
     * {@inheritDoc}
     */
    protected function _getCacheDriver()
    {
        return new SQLite3Cache($this->sqlite, 'test_table');
    }
}
