<?php

namespace Directus\Exception;

class UnauthorizedLocationException extends Exception implements UnauthorizedExceptionInterface
{
    const ERROR_CODE = 19;

    public function __construct()
    {
        parent::__construct('You are not allowed to sign in from this location', static::ERROR_CODE);
    }
}
