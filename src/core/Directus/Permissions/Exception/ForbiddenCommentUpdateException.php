<?php

namespace Directus\Permissions\Exception;

class ForbiddenCommentUpdateException extends PermissionException
{
    const ERROR_CODE = 211;

    public function __construct($collection)
    {
        parent::__construct(sprintf('Updating a comment to "%s" collection was denied', $collection), static::ERROR_CODE);
    }
}
