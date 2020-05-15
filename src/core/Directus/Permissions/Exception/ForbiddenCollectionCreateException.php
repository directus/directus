<?php

namespace Directus\Permissions\Exception;

class ForbiddenCollectionCreateException extends PermissionException
{
    const ERROR_CODE = 301;

    public function __construct($collection)
    {
        $message = sprintf(
            'Creating item to "%s" collection was denied',
            $collection
        );
        parent::__construct($message, static::ERROR_CODE);
    }
}
