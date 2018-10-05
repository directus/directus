<?php

namespace Symfony\Component\Validator\Tests\Mapping\Cache;

use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\Validator\Mapping\Cache\Psr6Cache;
use Symfony\Component\Validator\Mapping\ClassMetadata;

/**
 * @author Kévin Dunglas <dunglas@gmail.com>
 */
class Psr6CacheTest extends AbstractCacheTest
{
    protected function setUp()
    {
        $this->cache = new Psr6Cache(new ArrayAdapter());
    }

    public function testNameCollision()
    {
        $metadata = new ClassMetadata('Foo\\Bar');

        $this->cache->write($metadata);
        $this->assertFalse($this->cache->has('Foo_Bar'));
    }
}
