<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\NotFoundException;

class UserSuspendedException extends NotFoundException
{
    const ERROR_CODE = 103;

    public function __construct()
    {
        parent::__construct('Your account is suspended due to maximum allowed login attempts. Please contact your administrator to activate your account.', static::ERROR_CODE);
    }
}
