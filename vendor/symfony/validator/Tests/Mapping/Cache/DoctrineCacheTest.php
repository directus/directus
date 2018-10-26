<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Mapping\Cache;

use Doctrine\Common\Cache\ArrayCache;
use Symfony\Component\Validator\Mapping\Cache\DoctrineCache;

class DoctrineCacheTest extends AbstractCacheTest
{
    protected function setUp()
    {
        $this->cache = new DoctrineCache(new ArrayCache());
    }
}
