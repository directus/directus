<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class UnknownFilterException extends UnprocessableEntityException
{
    const ERROR_CODE = 214;

    public function __construct($operator)
    {
        parent::__construct('Unknown filter: ' . (string)$operator);
    }
}
