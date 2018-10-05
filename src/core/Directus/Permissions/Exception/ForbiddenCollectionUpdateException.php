<?php

namespace Directus\Permissions\Exception;

class ForbiddenCollectionUpdateException extends PermissionException
{
    const ERROR_CODE = 302;

    public function __construct($collection)
    {
        // TODO: Create more specific error. the "why" the user cannot update it
        // level permission or not permission at all
        $message = sprintf(
            'Updating item from "%s" collection was denied',
            $collection
        );

        parent::__construct($message, static::ERROR_CODE);
    }
}
