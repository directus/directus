<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class ExpiredResetPasswordToken extends UnauthorizedException
{
    const ERROR_CODE = 105;

    public function __construct($token)
    {
        parent::__construct('Expired Reset Password token: ' . $token);
    }
}
