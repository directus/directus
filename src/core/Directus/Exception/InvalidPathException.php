<?php

namespace Directus\Exception;

class InvalidPathException extends Exception implements ErrorExceptionInterface
{
    const ERROR_CODE = 16;

    public function __construct($message)
    {
        parent::__construct($message);
    }
}
