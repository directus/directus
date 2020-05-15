<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnauthorizedException;

class ForbiddenSystemTableDirectAccessException extends UnauthorizedException
{
    const ERROR_CODE = 201;

    public function __construct($table)
    {
        parent::__construct('Direct Access to System collections are not allowed');
    }
}
