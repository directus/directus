<?php

namespace Directus\Cache\Exception;

use Directus\Exception\ErrorException;

class InvalidCacheAdapterException extends ErrorException
{
    const ERROR_CODE = 22;
    const STATUS_CODE = 503;

    public function __construct()
    {
        parent::__construct("Valid cache adapters are 'apc', 'apcu', 'filesystem', 'memcached', 'memcache', 'redis', 'rediscluster'.", static::ERROR_CODE);
    }

    public function getStatusCode()
    {
        return static::STATUS_CODE;
    }
}
