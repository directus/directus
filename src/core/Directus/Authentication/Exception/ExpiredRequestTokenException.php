<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\Exception;

class ExpiredRequestTokenException extends Exception
{
    const ERROR_CODE = 110;

    public function __construct()
    {
        parent::__construct('Expired Request Token');
    }

    public function getStatusCode()
    {
        return 401;
    }
}
