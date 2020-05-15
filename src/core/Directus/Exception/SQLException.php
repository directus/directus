<?php

namespace Directus\Exception;

use Directus\Exception\UnprocessableEntityException;

class SQLException extends UnprocessableEntityException
{
    const ERROR_CODE = 404;

    public function __construct($message = '')
    {
        parent::__construct($message, static::ERROR_CODE);
    }
}
