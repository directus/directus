<?php

namespace Directus\Exception;

class MissingStorageConfigurationException extends Exception
{
    const ERROR_CODE = 20;

    public function __construct(\Exception $previous = null)
    {
        parent::__construct('Missing Storage Configuration', static::ERROR_CODE, $previous);
    }
}
