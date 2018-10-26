<?php

namespace Doctrine\Common\Cache;

use function time;

/**
 * Array cache driver.
 *
 * @link   www.doctrine-project.org
 */
class ArrayCache extends CacheProvider
{
    /** @var array[] $data each element being a tuple of [$data, $expiration], where the expiration is int|bool */
    private $data = [];

    /** @var int */
    private $hitsCount = 0;

    /** @var int */
    private $missesCount = 0;

    /** @var int */
    private $upTime;

    /**
     * {@inheritdoc}
     */
    public function __construct()
    {
        $this->upTime = time();
    }

    /**
     * {@inheritdoc}
     */
    protected function doFetch($id)
    {
        if (! $this->doContains($id)) {
            $this->missesCount += 1;

            return false;
        }

        $this->hitsCount += 1;

        return $this->data[$id][0];
    }

    /**
     * {@inheritdoc}
     */
    protected function doContains($id)
    {
        if (! isset($this->data[$id])) {
            return false;
        }

        $expiration = $this->data[$id][1];

        if ($expiration && $expiration < time()) {
            $this->doDelete($id);

            return false;
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doSave($id, $data, $lifeTime = 0)
    {
        $this->data[$id] = [$data, $lifeTime ? time() + $lifeTime : false];

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doDelete($id)
    {
        unset($this->data[$id]);

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doFlush()
    {
        $this->data = [];

        return true;
    }

    /**
     * {@inheritdoc}
     */
    protected function doGetStats()
    {
        return [
            Cache::STATS_HITS             => $this->hitsCount,
            Cache::STATS_MISSES           => $this->missesCount,
            Cache::STATS_UPTIME           => $this->upTime,
            Cache::STATS_MEMORY_USAGE     => null,
            Cache::STATS_MEMORY_AVAILABLE => null,
        ];
    }
}
