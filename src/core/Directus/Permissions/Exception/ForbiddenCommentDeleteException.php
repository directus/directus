<?php

namespace Directus\Permissions\Exception;

class ForbiddenCommentDeleteException extends PermissionException
{
    const ERROR_CODE = 212;

    public function __construct($collection)
    {
        parent::__construct(sprintf('Deleting a comment from "%s" collection was denied', $collection), static::ERROR_CODE);
    }
}
