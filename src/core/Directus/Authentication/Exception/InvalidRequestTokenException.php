<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\Exception;

class InvalidRequestTokenException extends Exception
{
    const ERROR_CODE = 109;

    public function __construct()
    {
        parent::__construct('Invalid Request Token');
    }

    public function getStatusCode()
    {
        return 401;
    }
}
