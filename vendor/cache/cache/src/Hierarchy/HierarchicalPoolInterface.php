<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Hierarchy;

use Psr\Cache\CacheItemPoolInterface;

/**
 * Let you use hierarchy if you start your tag key with the HIERARCHY_SEPARATOR.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
interface HierarchicalPoolInterface extends CacheItemPoolInterface
{
    const HIERARCHY_SEPARATOR = '|';
}
