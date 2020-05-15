<?php

namespace Directus\Database\Exception;

use Directus\Exception\ForbiddenException;

class ForbiddenFieldAccessException extends ForbiddenException
{
    const ERROR_CODE = 215;

    public function __construct($field)
    {
        $message = sprintf('Unable to access "%s" related data', $field);

        parent::__construct($message);
    }
}
