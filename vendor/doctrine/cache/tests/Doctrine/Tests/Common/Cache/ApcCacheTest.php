<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\ApcCache;

/**
 * @requires extension apc
 */
class ApcCacheTest extends CacheTest
{
    protected function setUp()
    {
        if (!ini_get('apc.enable_cli')) {
            $this->markTestSkipped('APC must be enabled for the CLI with the ini setting apc.enable_cli=1');
        }
    }

    protected function _getCacheDriver()
    {
        return new ApcCache();
    }

    public function testLifetime()
    {
        $this->markTestSkipped('The APC cache TTL is not working in a single process/request. See https://bugs.php.net/bug.php?id=58084');
    }
}
