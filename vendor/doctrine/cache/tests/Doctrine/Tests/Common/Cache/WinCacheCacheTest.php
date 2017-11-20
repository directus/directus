<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\WincacheCache;

/**
 * @requires extension wincache
 */
class WincacheCacheTest extends CacheTest
{
    protected function _getCacheDriver()
    {
        return new WincacheCache();
    }
}