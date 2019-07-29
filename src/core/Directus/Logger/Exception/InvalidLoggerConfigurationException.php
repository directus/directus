<?php

namespace Directus\Logger\Exception;

use Directus\Exception\ErrorException;

class InvalidLoggerConfigurationException extends ErrorException
{
    const ERROR_CODE = 24;
    const STATUS_CODE = 503;

    public function __construct($variable)
    {
        parent::__construct('Invalid Configuration for logger "' . $variable . '" variable.', static::ERROR_CODE);
    }

    public function getStatusCode()
    {
        return static::STATUS_CODE;
    }
}
