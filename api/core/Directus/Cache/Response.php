<?php

namespace Directus\Cache;

use Cache\TagInterop\TaggableCacheItemPoolInterface;

class Response extends Cache
{
    protected $ttl = null;
    protected $setTags = [];
    protected $invalidateTags = [];

    public function setTags($tags)
    {
        return $this->updateTagsArray('setTags', $tags);
    }

    public function invalidateTags($tags)
    {
        return $this->updateTagsArray('invalidateTags', $tags);
    }

    /**
     * @param string $arrayName
     * @param (array|string) $tags
     * @return $this
     */
    protected function updateTagsArray($arrayName, $tags)
    {
        $this->$arrayName = array_merge($this->$arrayName, (array)$tags);

        return $this;
    }

    public function ttl($time)
    {
        $this->ttl = $time;
    }

    public function process($key = null, $value = null)
    {
        $this->getPool()->invalidateTags($this->invalidateTags);

        if($key && !empty($this->setTags)) {
            $item = $this->set($key, $value)->setTags($this->setTags);

            if($this->ttl) {
                $item->expiresAfter($this->ttl);
            }

            $this->getPool()->save($item);
        }
    }
}