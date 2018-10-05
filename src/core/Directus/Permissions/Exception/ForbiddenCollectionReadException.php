<?php

namespace Directus\Permissions\Exception;

class ForbiddenCollectionReadException extends PermissionException
{
    const ERROR_CODE = 300;

    public function __construct($collection)
    {
        $message = sprintf('Reading items from "%s" collection was denied', $collection);
        parent::__construct($message, static::ERROR_CODE);
    }
}
