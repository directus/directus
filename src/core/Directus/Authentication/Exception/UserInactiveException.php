<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class UserInactiveException extends UnauthorizedException
{
    const ERROR_CODE = 103;

    public function __construct()
    {
        parent::__construct('User inactive');
    }
}
