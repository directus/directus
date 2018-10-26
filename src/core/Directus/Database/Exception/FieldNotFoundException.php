<?php

namespace Directus\Database\Exception;

use Directus\Exception\NotFoundException;

class FieldNotFoundException extends NotFoundException
{
    const ERROR_CODE = 202;

    public function __construct($field)
    {
        $message = sprintf('Unable to find field "%s"', $field);

        parent::__construct($message, static::ERROR_CODE);
    }
}
