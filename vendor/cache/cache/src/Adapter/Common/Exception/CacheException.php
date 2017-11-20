<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Common\Exception;

use Psr\Cache\CacheException as CacheExceptionInterface;

/**
 * A base exception. All exceptions in this organization will extend this exception.
 *
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
abstract class CacheException extends \RuntimeException implements CacheExceptionInterface
{
}
