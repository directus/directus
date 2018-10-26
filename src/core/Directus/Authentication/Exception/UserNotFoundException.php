<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\NotFoundException;

class UserNotFoundException extends NotFoundException
{
    const ERROR_CODE = 106;

    public function __construct()
    {
        parent::__construct('User not found', static::ERROR_CODE);
    }
}
