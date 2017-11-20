<?php

/*
 * This file is part of php-cache organization.
 *
 * (c) 2015 Aaron Scherer <aequasi@gmail.com>, Tobias Nyholm <tobias.nyholm@gmail.com>
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Cache\Adapter\Common;

use Cache\Adapter\Common\Exception\InvalidArgumentException;
use Cache\TagInterop\TaggableCacheItemInterface;

/**
 * @author Aaron Scherer <aequasi@gmail.com>
 * @author Tobias Nyholm <tobias.nyholm@gmail.com>
 */
class CacheItem implements PhpCacheItem
{
    /**
     * @type array
     */
    private $prevTags = [];

    /**
     * @type array
     */
    private $tags = [];

    /**
     * @type \Closure
     */
    private $callable;

    /**
     * @type string
     */
    private $key;

    /**
     * @type mixed
     */
    private $value;

    /**
     * The expiration timestamp is the source of truth. This is the UTC timestamp
     * when the cache item expire. A value of zero means it never expires. A nullvalue
     * means that no expiration is set.
     *
     * @type int|null
     */
    private $expirationTimestamp = null;

    /**
     * @type bool
     */
    private $hasValue = false;

    /**
     * @param string        $key
     * @param \Closure|bool $callable or boolean hasValue
     */
    public function __construct($key, $callable = null, $value = null)
    {
        $this->key = $key;

        if ($callable === true) {
            $this->hasValue = true;
            $this->value    = $value;
        } elseif ($callable !== false) {
            // This must be a callable or null
            $this->callable = $callable;
        }
    }

    /**
     * {@inheritdoc}
     */
    public function getKey()
    {
        return $this->key;
    }

    /**
     * {@inheritdoc}
     */
    public function set($value)
    {
        $this->value    = $value;
        $this->hasValue = true;
        $this->callable = null;

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function get()
    {
        if (!$this->isHit()) {
            return;
        }

        return $this->value;
    }

    /**
     * {@inheritdoc}
     */
    public function isHit()
    {
        $this->initialize();

        if (!$this->hasValue) {
            return false;
        }

        if ($this->expirationTimestamp !== null) {
            return $this->expirationTimestamp > time();
        }

        return true;
    }

    /**
     * {@inheritdoc}
     */
    public function getExpirationTimestamp()
    {
        return $this->expirationTimestamp;
    }

    /**
     * {@inheritdoc}
     */
    public function expiresAt($expiration)
    {
        if ($expiration instanceof \DateTimeInterface) {
            $this->expirationTimestamp = $expiration->getTimestamp();
        } elseif (is_int($expiration) || null === $expiration) {
            $this->expirationTimestamp = $expiration;
        } else {
            throw new InvalidArgumentException('Cache item ttl/expiresAt must be of type integer or \DateTimeInterface.');
        }

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function expiresAfter($time)
    {
        if ($time === null) {
            $this->expirationTimestamp = null;
        } elseif ($time instanceof \DateInterval) {
            $date = new \DateTime();
            $date->add($time);
            $this->expirationTimestamp = $date->getTimestamp();
        } elseif (is_int($time)) {
            $this->expirationTimestamp = time() + $time;
        } else {
            throw new InvalidArgumentException('Cache item ttl/expiresAfter must be of type integer or \DateInterval.');
        }

        return $this;
    }

    /**
     * {@inheritdoc}
     */
    public function getPreviousTags()
    {
        $this->initialize();

        return $this->prevTags;
    }

    /**
     * {@inheritdoc}
     */
    public function getTags()
    {
        return $this->tags;
    }

    /**
     * {@inheritdoc}
     */
    public function setTags(array $tags)
    {
        $this->tags = [];
        $this->tag($tags);

        return $this;
    }

    /**
     * Adds a tag to a cache item.
     *
     * @param string|string[] $tags A tag or array of tags
     *
     * @throws InvalidArgumentException When $tag is not valid.
     *
     * @return TaggableCacheItemInterface
     */
    private function tag($tags)
    {
        $this->initialize();

        if (!is_array($tags)) {
            $tags = [$tags];
        }
        foreach ($tags as $tag) {
            if (!is_string($tag)) {
                throw new InvalidArgumentException(sprintf('Cache tag must be string, "%s" given', is_object($tag) ? get_class($tag) : gettype($tag)));
            }
            if (isset($this->tags[$tag])) {
                continue;
            }
            if (!isset($tag[0])) {
                throw new InvalidArgumentException('Cache tag length must be greater than zero');
            }
            if (isset($tag[strcspn($tag, '{}()/\@:')])) {
                throw new InvalidArgumentException(sprintf('Cache tag "%s" contains reserved characters {}()/\@:', $tag));
            }
            $this->tags[$tag] = $tag;
        }

        return $this;
    }

    /**
     * If callable is not null, execute it an populate this object with values.
     */
    private function initialize()
    {
        if ($this->callable !== null) {
            // $f will be $adapter->fetchObjectFromCache();
            $f                         = $this->callable;
            $result                    = $f();
            $this->hasValue            = $result[0];
            $this->value               = $result[1];
            $this->prevTags            = isset($result[2]) ? $result[2] : [];
            $this->expirationTimestamp = null;

            if (isset($result[3]) && is_int($result[3])) {
                $this->expirationTimestamp = $result[3];
            }

            $this->callable = null;
        }
    }

    /**
     * @internal This function should never be used and considered private.
     *
     * Move tags from $tags to $prevTags
     */
    public function moveTagsToPrevious()
    {
        $this->prevTags = $this->tags;
        $this->tags     = [];
    }
}
