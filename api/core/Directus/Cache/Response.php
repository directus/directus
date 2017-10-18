<?php

namespace Directus\Cache;

class Response extends Cache
{
    protected $tags = [];

    public function tag($tags)
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
        if($key && !empty($this->tags)) {
            return $this->set($key, $value, $this->tags, $this->defaultTtl);
        }

        return false;
    }
}