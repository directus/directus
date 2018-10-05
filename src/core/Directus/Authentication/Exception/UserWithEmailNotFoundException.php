<?php

namespace Directus\Authentication\Exception;

use Directus\Exception\NotFoundException;

class UserWithEmailNotFoundException extends NotFoundException
{
    const ERROR_CODE = 107;

    public function __construct($email)
    {
        $this->attributes['email'] = $email;
        $message = sprintf('User with email "%s" not found', $email);

        parent::__construct($message, static::ERROR_CODE);
    }
}
