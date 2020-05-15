<?php

namespace Directus\Exception;

class ForbiddenLastAdminException extends Exception implements ForbiddenExceptionInterface
{
    const ERROR_CODE = 216;

    public function __construct()
    {
        $message = 'Cannot delete the last admin user. There should always be at least 1 active admin user';
        parent::__construct($message, static::ERROR_CODE);
    }
}
