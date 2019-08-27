<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class TFAEnforcedException extends UnauthorizedException
{
    const ERROR_CODE = 113;

    public function __construct()
    {
        parent::__construct('2FA enforced but not activated for user');
    }
}
