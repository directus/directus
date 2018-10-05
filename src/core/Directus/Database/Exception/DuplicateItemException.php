<?php

namespace Directus\Database\Exception;

use Directus\Exception\ConflictExceptionInterface;
use Directus\Exception\Exception;

class DuplicateItemException extends Exception implements ConflictExceptionInterface
{
    const ERROR_CODE = 204;

    public function __construct($collection, $key)
    {
        $message = sprintf('Duplicate key "%s" for collection "%s"', $key, $collection);
        parent::__construct($message, static::ERROR_CODE);
    }
}
