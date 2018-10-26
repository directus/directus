<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class FieldLengthNotSupportedException extends UnprocessableEntityException
{
    const ERROR_CODE = 403;

    public function __construct($field)
    {
        $message = sprintf('field "%s" does not support length', $field);

        parent::__construct($message, static::ERROR_CODE);
    }
}
