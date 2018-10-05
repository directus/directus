<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class InvalidResetPasswordTokenException extends UnauthorizedException
{
    const ERROR_CODE = 104;

    public function __construct($token)
    {
        parent::__construct('Invalid Reset Password token: ' . $token);
    }
}
