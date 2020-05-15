<?php

namespace Directus\Cache\Exception;

use Directus\Exception\ErrorException;

class InvalidCacheConfigurationException extends ErrorException
{
    const ERROR_CODE = 23;
    const STATUS_CODE = 503;

    public function __construct($adapter)
    {
        parent::__construct('Invalid Configuration for "' . $adapter . '" cache adapter.', static::ERROR_CODE);
    }

    public function getStatusCode()
    {
        return static::STATUS_CODE;
    }
}
