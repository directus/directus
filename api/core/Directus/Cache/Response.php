<?php

namespace Directus\Cache;

class Response extends Cache
{
    protected $tags = [];

    public function setTags($tags)
    {
        $this->tags = array_merge($this->tags, (array)$tags);

        return $this;
    }

    public function ttl($time)
    {
        $this->ttl = $time;
    }

    public function process($key = null, $value = null)
    {
        if($key && !empty($this->setTags)) {
            $item = $this->set($key, $value)->setTags($this->setTags);

            if($this->ttl) {
                $item->expiresAfter($this->ttl);
            }

            $this->getPool()->save($item);
        }
    }
}