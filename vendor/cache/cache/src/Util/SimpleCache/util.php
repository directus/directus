<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Util\SimpleCache;

use Psr\SimpleCache\CacheInterface;

if (!function_exists('\Cache\Util\SimpleCache\remember')) {
    function remember(CacheInterface $cache, $key, $ttl, callable $createResult)
    {
        $res = $cache->get($key);
        if ($res) {
            return $res;
        }

        $res = $createResult();
        $cache->set($key, $res, $ttl);

        return $res;
    }
}
