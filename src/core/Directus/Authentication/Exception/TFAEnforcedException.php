<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class TFAEnforcedException extends UnauthorizedException
{
    const ERROR_CODE = 113;
    const ERROR_MESSAGE = "2FA enforced but not activated for user";

    public function __construct()
    {
        parent::__construct(static::ERROR_MESSAGE);
    }
}
