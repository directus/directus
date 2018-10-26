<?php

namespace Directus\Database\Exception;

use Directus\Exception\ErrorException;

class ConnectionFailedException extends ErrorException
{
    const ERROR_CODE = 11;

    public function __construct($previous = null)
    {
        $message = 'Failed to connect to the database';

        parent::__construct($message, static::ERROR_CODE, $previous);
    }
}
