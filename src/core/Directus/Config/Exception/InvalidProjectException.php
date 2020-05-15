<?php

namespace Directus\Config\Exception;

use Directus\Exception\ErrorException;

class InvalidProjectException extends ErrorException
{
    const ERROR_CODE = 22;

    public function __construct($previous = null)
    {
        $message = 'Current configuration context only supports default project name (_)';

        parent::__construct($message, static::ERROR_CODE, $previous);
    }

    public function getStatusCode()
    {
        return 400;
    }
}
