<?php

namespace Directus\Exception;

class UnauthorizedException extends Exception implements UnauthorizedExceptionInterface
{
    const ERROR_CODE = 3;

    public function __construct($message = '')
    {
        parent::__construct($message, static::ERROR_CODE);
    }
}
