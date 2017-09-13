<?php

namespace Directus\Cache;

use Cache\TagInterop\TaggableCacheItemPoolInterface;

class Response extends Cache
{
    protected $setTags = [];
    protected $invalidateTags = [];

    public function setTags($tag)
    {
        return $this->updateTagsArray('setTags', $tag);
    }

    public function invalidateTags($tag)
    {
        return $this->updateTagsArray('invalidateTags', $tag);
    }

    protected function updateTagsArray($array, $tag)
    {
        if(is_array($tag)) {
            $this->$array = $tag;
        } elseif(is_scalar($tag)) {
            $this->$array[] = $tag;
        }

        return $this;
    }

    public function process($key = null, $value = null)
    {
        $this->getPool()->invalidateTags($this->invalidateTags);

        if($key && !empty($this->setTags)) {
            $item = $this->set($key, $value)->setTags($this->setTags);

            $this->getPool()->save($item);
        }
    }
}