<?php

namespace Directus\Permissions\Exception;

class ForbiddenFieldReadException extends PermissionException
{
    const ERROR_CODE = 304;

    public function __construct($collection, $field)
    {
        $message = sprintf(
            'Reading "%s" field  in "%s" collection was denied',
            $field,
            $collection
        );

        parent::__construct($message, static::ERROR_CODE);
    }
}
