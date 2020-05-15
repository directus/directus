<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class UserNotAuthenticatedException extends UnauthorizedException
{
    const ERROR_CODE = 108;

    public function __construct($message = 'User not authenticated')
    {
        parent::__construct($message);
    }
}
