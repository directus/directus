<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\NotFoundException;

class Missing2FAPasswordException extends NotFoundException
{
    const ERROR_CODE = 111;

    public function __construct()
    {
        parent::__construct('User missing 2FA OTP', static::ERROR_CODE);
    }
}
