<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\NotFoundException;

class InvalidOTPException extends NotFoundException
{
    const ERROR_CODE = 112;

    public function __construct()
    {
        parent::__construct('Invalid user OTP', static::ERROR_CODE);
    }
}
