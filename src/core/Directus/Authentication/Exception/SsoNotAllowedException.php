<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\UnauthorizedException;

class SsoNotAllowedException extends UnauthorizedException
{
    const ERROR_CODE = 115;

    public function __construct()
    {
        parent::__construct('SSO not allowed with 2FA enabled');
    }
}
