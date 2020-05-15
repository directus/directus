<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class InvalidTokenException extends UnauthorizedException
{
    const ERROR_CODE = 101;

    public function __construct()
    {
        parent::__construct('Invalid Authentication Token');
    }
}
