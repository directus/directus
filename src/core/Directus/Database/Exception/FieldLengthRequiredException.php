<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class FieldLengthRequiredException extends UnprocessableEntityException
{
    const ERROR_CODE = 402;

    public function __construct($field)
    {
        $message = 'Missing length';

        if ($field) {
            $message .= ' for: ' . $field;
        }

        parent::__construct($message, static::ERROR_CODE);
    }
}
