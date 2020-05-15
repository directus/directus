<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class FieldAlreadyExistsException extends UnprocessableEntityException
{
    const ERROR_CODE = 308;

    public function __construct($field)
    {
        parent::__construct(sprintf('Field "%s" already exists', $field));
    }
}
