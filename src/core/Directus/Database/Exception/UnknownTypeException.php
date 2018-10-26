<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class UnknownTypeException extends UnprocessableEntityException
{
    const ERROR_CODE = 401;

    public function __construct($type)
    {
        parent::__construct('Unknown type: ' . (string)$type);
    }
}
