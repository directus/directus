<?php

namespace Directus\Permissions\Exception;

class ForbiddenCollectionAlterException extends PermissionException
{
    const ERROR_CODE = 306;

    public function __construct($collection)
    {
        $message = sprintf(
            'Altering collection "%s" was denied',
            $collection
        );

        parent::__construct($message, static::ERROR_CODE);
    }
}
