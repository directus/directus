<?php

namespace Directus\Exception;

class InvalidDatabaseConnectionException extends Exception implements BadRequestExceptionInterface
{
    const ERROR_CODE = 19;

    public function __construct()
    {
        parent::__construct('Invalid database connection');
    }
}
