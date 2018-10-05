<?php

namespace Directus\Database\Exception;

use Directus\Exception\Exception;
use Directus\Exception\UnprocessableEntityExceptionInterface;

class FieldAlreadyHasUniqueKeyException extends Exception implements UnprocessableEntityExceptionInterface
{
    public function __construct($field)
    {
        parent::__construct(sprintf('Field "%s" already a unique key constraint', $field));
    }
}
