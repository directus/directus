<?php

namespace Directus\Database\Exception;

use Directus\Exception\ErrorException;
use Throwable;

class ConnectionFailedException extends ErrorException
{
    const ERROR_CODE = 11;

    public function __construct(Throwable $previous = null)
    {
        $message = 'Failed to connect to the database';

        parent::__construct($message, static::ERROR_CODE, $previous);
    }
}
