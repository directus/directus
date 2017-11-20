<?php

namespace Doctrine\Tests\Common\Cache;

use Doctrine\Common\Cache\Cache;
use Doctrine\Common\Cache\PredisCache;
use Predis\Client;
use Predis\Connection\ConnectionException;

class PredisCacheTest extends CacheTest
{
    private $client;

    protected function setUp()
    {
        if (!class_exists('Predis\Client')) {
            $this->markTestSkipped('Predis\Client is missing. Make sure to "composer install" to have all dev dependencies.');
        }

        $this->client = new Client();

        try {
            $this->client->connect();
        } catch (ConnectionException $e) {
            $this->markTestSkipped('Cannot connect to Redis because of: ' . $e);
        }
    }

    public function testHitMissesStatsAreProvided()
    {
        $cache = $this->_getCacheDriver();
        $stats = $cache->getStats();

        $this->assertNotNull($stats[Cache::STATS_HITS]);
        $this->assertNotNull($stats[Cache::STATS_MISSES]);
    }

    /**
     * @return PredisCache
     */
    protected function _getCacheDriver()
    {
        return new PredisCache($this->client);
    }

    /**
     * {@inheritDoc}
     *
     * @dataProvider provideDataToCache
     */
    public function testSetContainsFetchDelete($value)
    {
        if (array() === $value) {
            $this->markTestIncomplete(
                'Predis currently doesn\'t support saving empty array values. '
                . 'See https://github.com/nrk/predis/issues/241'
            );
        }

        parent::testSetContainsFetchDelete($value);
    }

    /**
     * {@inheritDoc}
     *
     * @dataProvider provideDataToCache
     */
    public function testUpdateExistingEntry($value)
    {
        if (array() === $value) {
            $this->markTestIncomplete(
                'Predis currently doesn\'t support saving empty array values. '
                . 'See https://github.com/nrk/predis/issues/241'
            );
        }

        parent::testUpdateExistingEntry($value);
    }

    public function testAllowsGenericPredisClient()
    {
        /* @var $predisClient \Predis\ClientInterface */
        $predisClient = $this->getMock('Predis\\ClientInterface');

        $this->assertInstanceOf('Doctrine\\Common\\Cache\\PredisCache', new PredisCache($predisClient));
    }
}
