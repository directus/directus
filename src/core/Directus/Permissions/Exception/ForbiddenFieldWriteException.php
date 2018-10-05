<?php

namespace Directus\Permissions\Exception;

class ForbiddenFieldWriteException extends PermissionException
{
    const ERROR_CODE = 305;

    public function __construct($collection, $field)
    {
        $message = sprintf(
            'Write access to "%s" field in "%s" collection was denied',
            $field,
            $collection
        );

        parent::__construct($message, static::ERROR_CODE);
    }
}
