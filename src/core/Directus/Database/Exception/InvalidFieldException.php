<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class InvalidFieldException extends UnprocessableEntityException
{
    const ERROR_CODE = 202;

    public function __construct($field, $collection)
    {
        $message = sprintf('Invalid field "%s" in "%s"', $field, $collection);

        parent::__construct($message);
    }
}
