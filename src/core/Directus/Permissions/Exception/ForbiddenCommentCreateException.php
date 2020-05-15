<?php

namespace Directus\Permissions\Exception;

class ForbiddenCommentCreateException extends PermissionException
{
    const ERROR_CODE = 210;

    public function __construct($collection)
    {
        parent::__construct(sprintf('Adding a comment to "%s" collection was denied', $collection), static::ERROR_CODE);
    }
}
