<?php

namespace Directus\Permissions\Exception;

class ForbiddenCollectionDeleteException extends PermissionException
{
    const ERROR_CODE = 303;

    public function __construct($collection)
    {
        $message = sprintf(
            'Deleting item from "%s" collection was denied',
            $collection
        );

        parent::__construct($message, static::ERROR_CODE);
    }
}
