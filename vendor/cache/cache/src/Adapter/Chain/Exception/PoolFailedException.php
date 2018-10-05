<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Chain\Exception;

use Cache\Adapter\Common\Exception\CachePoolException;

/**
 * When a cache pool fails with its operation.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class PoolFailedException extends CachePoolException
{
}
