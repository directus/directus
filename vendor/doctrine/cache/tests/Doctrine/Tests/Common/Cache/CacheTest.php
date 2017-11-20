<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\Cache;
use ArrayObject;

abstract class CacheTest extends \Doctrine\Tests\DoctrineTestCase
{
    /**
     * @dataProvider provideDataToCache
     */
    public function testSetContainsFetchDelete($value)
    {
        $cache = $this->_getCacheDriver();

        // Test saving a value, checking if it exists, and fetching it back
        $this->assertTrue($cache->save('key', $value));
        $this->assertTrue($cache->contains('key'));
        if (is_object($value)) {
            $this->assertEquals($value, $cache->fetch('key'), 'Objects retrieved from the cache must be equal but not necessarily the same reference');
        } else {
            $this->assertSame($value, $cache->fetch('key'), 'Scalar and array data retrieved from the cache must be the same as the original, e.g. same type');
        }

        // Test deleting a value
        $this->assertTrue($cache->delete('key'));
        $this->assertFalse($cache->contains('key'));
        $this->assertFalse($cache->fetch('key'));
    }

    /**
     * @dataProvider provideDataToCache
     */
    public function testUpdateExistingEntry($value)
    {
        $cache = $this->_getCacheDriver();

        $this->assertTrue($cache->save('key', 'old-value'));
        $this->assertTrue($cache->contains('key'));

        $this->assertTrue($cache->save('key', $value));
        $this->assertTrue($cache->contains('key'));
        if (is_object($value)) {
            $this->assertEquals($value, $cache->fetch('key'), 'Objects retrieved from the cache must be equal but not necessarily the same reference');
        } else {
            $this->assertSame($value, $cache->fetch('key'), 'Scalar and array data retrieved from the cache must be the same as the original, e.g. same type');
        }
    }

    public function testCacheKeyIsCaseSensitive()
    {
        $cache = $this->_getCacheDriver();

        $this->assertTrue($cache->save('key', 'value'));
        $this->assertTrue($cache->contains('key'));
        $this->assertSame('value', $cache->fetch('key'));

        $this->assertFalse($cache->contains('KEY'));
        $this->assertFalse($cache->fetch('KEY'));

        $cache->delete('KEY');
        $this->assertTrue($cache->contains('key', 'Deleting cache item with different case must not affect other cache item'));
    }

    public function testFetchMultiple()
    {
        $cache  = $this->_getCacheDriver();
        $values = $this->provideDataToCache();
        $saved  = array();

        foreach ($values as $key => $value) {
            $cache->save($key, $value[0]);

            $saved[$key] = $value[0];
        }

        $keys = array_keys($saved);

        $this->assertEquals(
            $saved,
            $cache->fetchMultiple($keys),
            'Testing fetchMultiple with different data types'
        );
        $this->assertEquals(
            array_slice($saved, 0, 1),
            $cache->fetchMultiple(array_slice($keys, 0, 1)),
            'Testing fetchMultiple with a single key'
        );

        $keysWithNonExisting = array();
        $keysWithNonExisting[] = 'non_existing1';
        $keysWithNonExisting[] = $keys[0];
        $keysWithNonExisting[] = 'non_existing2';
        $keysWithNonExisting[] = $keys[1];
        $keysWithNonExisting[] = 'non_existing3';

        $this->assertEquals(
            array_slice($saved, 0, 2),
            $cache->fetchMultiple($keysWithNonExisting),
            'Testing fetchMultiple with a subset of keys and mixed with non-existing ones'
        );
    }

    public function testFetchMultipleWithNoKeys()
    {
        $cache = $this->_getCacheDriver();

        $this->assertSame(array(), $cache->fetchMultiple(array()));
    }

    public function testSaveMultiple()
    {
        $cache = $this->_getCacheDriver();
        $cache->deleteAll();

        $data = array_map(function ($value) {
            return $value[0];
        }, $this->provideDataToCache());

        $this->assertTrue($cache->saveMultiple($data));

        $keys = array_keys($data);

        $this->assertEquals($data, $cache->fetchMultiple($keys));
    }

    public function provideDataToCache()
    {
        $obj = new \stdClass();
        $obj->foo = 'bar';
        $obj2 = new \stdClass();
        $obj2->bar = 'foo';
        $obj2->obj = $obj;
        $obj->obj2 = $obj2;

        return array(
            'array' => array(array('one', 2, 3.01)),
            'string' => array('value'),
            'string_invalid_utf8' => array("\xc3\x28"),
            'string_null_byte' => array('with'."\0".'null char'),
            'integer' => array(1),
            'float' => array(1.5),
            'object' => array(new ArrayObject(array('one', 2, 3.01))),
            'object_recursive' => array($obj),
            'true' => array(true),
            // the following are considered FALSE in boolean context, but caches should still recognize their existence
            'null' => array(null),
            'false' => array(false),
            'array_empty' => array(array()),
            'string_zero' => array('0'),
            'integer_zero' => array(0),
            'float_zero' => array(0.0),
            'string_empty' => array(''),
        );
    }

    public function testDeleteIsSuccessfulWhenKeyDoesNotExist()
    {
        $cache = $this->_getCacheDriver();

        $cache->delete('key');
        $this->assertFalse($cache->contains('key'));
        $this->assertTrue($cache->delete('key'));
    }

    public function testDeleteAll()
    {
        $cache = $this->_getCacheDriver();

        $this->assertTrue($cache->save('key1', 1));
        $this->assertTrue($cache->save('key2', 2));
        $this->assertTrue($cache->deleteAll());
        $this->assertFalse($cache->contains('key1'));
        $this->assertFalse($cache->contains('key2'));
    }

    /**
     * @dataProvider provideCacheIds
     */
    public function testCanHandleSpecialCacheIds($id)
    {
        $cache = $this->_getCacheDriver();

        $this->assertTrue($cache->save($id, 'value'));
        $this->assertTrue($cache->contains($id));
        $this->assertEquals('value', $cache->fetch($id));

        $this->assertTrue($cache->delete($id));
        $this->assertFalse($cache->contains($id));
        $this->assertFalse($cache->fetch($id));
    }

    public function testNoCacheIdCollisions()
    {
        $cache = $this->_getCacheDriver();

        $ids = $this->provideCacheIds();

        // fill cache with each id having a different value
        foreach ($ids as $index => $id) {
            $cache->save($id[0], $index);
        }

        // then check value of each cache id
        foreach ($ids as $index => $id) {
            $value = $cache->fetch($id[0]);
            $this->assertNotFalse($value, sprintf('Failed to retrieve data for cache id "%s".', $id[0]));
            if ($index !== $value) {
                $this->fail(sprintf('Cache id "%s" collides with id "%s".', $id[0], $ids[$value][0]));
            }
        }
    }

    /**
     * Returns cache ids with special characters that should still work.
     *
     * For example, the characters :\/<>"*?| are not valid in Windows filenames. So they must be encoded properly.
     * Each cache id should be considered different from the others.
     *
     * @return array
     */
    public function provideCacheIds()
    {
        return array(
            array(':'),
            array('\\'),
            array('/'),
            array('<'),
            array('>'),
            array('"'),
            array('*'),
            array('?'),
            array('|'),
            array('['),
            array(']'),
            array('ä'),
            array('a'),
            array('é'),
            array('e'),
            array('.'), // directory traversal
            array('..'), // directory traversal
            array('-'),
            array('_'),
            array('$'),
            array('%'),
            array(' '),
            array("\0"),
            array(''),
            array(str_repeat('a', 300)), // long key
            array(str_repeat('a', 113)),
        );
    }

    public function testLifetime()
    {
        $cache = $this->_getCacheDriver();
        $cache->save('expire', 'value', 1);
        $this->assertTrue($cache->contains('expire'), 'Data should not be expired yet');
        // @TODO should more TTL-based tests pop up, so then we should mock the `time` API instead
        sleep(2);
        $this->assertFalse($cache->contains('expire'), 'Data should be expired');
    }

    public function testNoExpire()
    {
        $cache = $this->_getCacheDriver();
        $cache->save('noexpire', 'value', 0);
        // @TODO should more TTL-based tests pop up, so then we should mock the `time` API instead
        sleep(1);
        $this->assertTrue($cache->contains('noexpire'), 'Data with lifetime of zero should not expire');
    }

    public function testLongLifetime()
    {
        $cache = $this->_getCacheDriver();
        $cache->save('longlifetime', 'value', 30 * 24 * 3600 + 1);
        $this->assertTrue($cache->contains('longlifetime'), 'Data with lifetime > 30 days should be accepted');
    }

    public function testDeleteAllAndNamespaceVersioningBetweenCaches()
    {
        if ( ! $this->isSharedStorage()) {
            $this->markTestSkipped('The cache storage needs to be shared.');
        }

        $cache1 = $this->_getCacheDriver();
        $cache2 = $this->_getCacheDriver();

        $this->assertTrue($cache1->save('key1', 1));
        $this->assertTrue($cache2->save('key2', 2));

        /* Both providers are initialized with the same namespace version, so
         * they can see entries set by each other.
         */
        $this->assertTrue($cache1->contains('key1'));
        $this->assertTrue($cache1->contains('key2'));
        $this->assertTrue($cache2->contains('key1'));
        $this->assertTrue($cache2->contains('key2'));

        /* Deleting all entries through one provider will only increment the
         * namespace version on that object (and in the cache itself, which new
         * instances will use to initialize). The second provider will retain
         * its original version and still see stale data.
         */
        $this->assertTrue($cache1->deleteAll());
        $this->assertFalse($cache1->contains('key1'));
        $this->assertFalse($cache1->contains('key2'));
        $this->assertTrue($cache2->contains('key1'));
        $this->assertTrue($cache2->contains('key2'));

        /* A new cache provider should not see the deleted entries, since its
         * namespace version will be initialized.
         */
        $cache3 = $this->_getCacheDriver();
        $this->assertFalse($cache3->contains('key1'));
        $this->assertFalse($cache3->contains('key2'));
    }

    public function testFlushAll()
    {
        $cache = $this->_getCacheDriver();

        $this->assertTrue($cache->save('key1', 1));
        $this->assertTrue($cache->save('key2', 2));
        $this->assertTrue($cache->flushAll());
        $this->assertFalse($cache->contains('key1'));
        $this->assertFalse($cache->contains('key2'));
    }

    public function testFlushAllAndNamespaceVersioningBetweenCaches()
    {
        if ( ! $this->isSharedStorage()) {
            $this->markTestSkipped('The cache storage needs to be shared.');
        }

        $cache1 = $this->_getCacheDriver();
        $cache2 = $this->_getCacheDriver();

        /* Deleting all elements from the first provider should increment its
         * namespace version before saving the first entry.
         */
        $cache1->deleteAll();
        $this->assertTrue($cache1->save('key1', 1));

        /* The second provider will be initialized with the same namespace
         * version upon its first save operation.
         */
        $this->assertTrue($cache2->save('key2', 2));

        /* Both providers have the same namespace version and can see entries
         * set by each other.
         */
        $this->assertTrue($cache1->contains('key1'));
        $this->assertTrue($cache1->contains('key2'));
        $this->assertTrue($cache2->contains('key1'));
        $this->assertTrue($cache2->contains('key2'));

        /* Flushing all entries through one cache will remove all entries from
         * the cache but leave their namespace version as-is.
         */
        $this->assertTrue($cache1->flushAll());
        $this->assertFalse($cache1->contains('key1'));
        $this->assertFalse($cache1->contains('key2'));
        $this->assertFalse($cache2->contains('key1'));
        $this->assertFalse($cache2->contains('key2'));

        /* Inserting a new entry will use the same, incremented namespace
         * version, and it will be visible to both providers.
         */
        $this->assertTrue($cache1->save('key1', 1));
        $this->assertTrue($cache1->contains('key1'));
        $this->assertTrue($cache2->contains('key1'));

        /* A new cache provider will be initialized with the original namespace
         * version and not share any visibility with the first two providers.
         */
        $cache3 = $this->_getCacheDriver();
        $this->assertFalse($cache3->contains('key1'));
        $this->assertFalse($cache3->contains('key2'));
        $this->assertTrue($cache3->save('key3', 3));
        $this->assertTrue($cache3->contains('key3'));
    }

    public function testNamespace()
    {
        $cache = $this->_getCacheDriver();

        $cache->setNamespace('ns1_');

        $this->assertTrue($cache->save('key1', 1));
        $this->assertTrue($cache->contains('key1'));

        $cache->setNamespace('ns2_');

        $this->assertFalse($cache->contains('key1'));
    }

    public function testDeleteAllNamespace()
    {
        $cache = $this->_getCacheDriver();

        $cache->setNamespace('ns1');
        $this->assertFalse($cache->contains('key1'));
        $cache->save('key1', 'test');
        $this->assertTrue($cache->contains('key1'));

        $cache->setNamespace('ns2');
        $this->assertFalse($cache->contains('key1'));
        $cache->save('key1', 'test');
        $this->assertTrue($cache->contains('key1'));

        $cache->setNamespace('ns1');
        $this->assertTrue($cache->contains('key1'));
        $cache->deleteAll();
        $this->assertFalse($cache->contains('key1'));

        $cache->setNamespace('ns2');
        $this->assertTrue($cache->contains('key1'));
        $cache->deleteAll();
        $this->assertFalse($cache->contains('key1'));
    }

    /**
     * @group DCOM-43
     */
    public function testGetStats()
    {
        $cache = $this->_getCacheDriver();
        $stats = $cache->getStats();

        $this->assertArrayHasKey(Cache::STATS_HITS, $stats);
        $this->assertArrayHasKey(Cache::STATS_MISSES, $stats);
        $this->assertArrayHasKey(Cache::STATS_UPTIME, $stats);
        $this->assertArrayHasKey(Cache::STATS_MEMORY_USAGE, $stats);
        $this->assertArrayHasKey(Cache::STATS_MEMORY_AVAILABLE, $stats);
    }

    public function testSaveReturnsTrueWithAndWithoutTTlSet()
    {
        $cache = $this->_getCacheDriver();
        $cache->deleteAll();
        $this->assertTrue($cache->save('without_ttl', 'without_ttl'));
        $this->assertTrue($cache->save('with_ttl', 'with_ttl', 3600));
    }

    public function testValueThatIsFalseBooleanIsProperlyRetrieved()
    {
        $cache = $this->_getCacheDriver();
        $cache->deleteAll();

        $this->assertTrue($cache->save('key1', false));
        $this->assertTrue($cache->contains('key1'));
        $this->assertFalse($cache->fetch('key1'));
    }

    /**
     * Return whether multiple cache providers share the same storage.
     *
     * This is used for skipping certain tests for shared storage behavior.
     *
     * @return bool
     */
    protected function isSharedStorage()
    {
        return true;
    }

    /**
     * @return \Doctrine\Common\Cache\CacheProvider
     */
    abstract protected function _getCacheDriver();
}
