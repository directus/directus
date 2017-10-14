<?php

namespace Directus\Cache;

class Response extends Cache
{
    protected $setTags = [];

    public function setTags($tags)
    {
        $this->setTags(array_merge($this->setTags, (array)$tags));

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