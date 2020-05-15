<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Hierarchy\Tests\Helper;

use Cache\Hierarchy\HierarchicalCachePoolTrait;

/**
 * A cache pool used in tests.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class CachePool
{
    use HierarchicalCachePoolTrait;

    private $storeValues = [];

    /**
     * @param array $storeValues
     */
    public function __construct(array $storeValues = [])
    {
        $this->storeValues = $storeValues;
    }

    public function exposeClearHierarchyKeyCache()
    {
        $this->clearHierarchyKeyCache();
    }

    public function exposeGetHierarchyKey($key, &$pathKey = null)
    {
        return $this->getHierarchyKey($key, $pathKey);
    }

    protected function getDirectValue($key)
    {
        return array_shift($this->storeValues);
    }
}
