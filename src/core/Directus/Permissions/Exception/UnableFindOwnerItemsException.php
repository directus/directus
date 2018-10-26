<?php

namespace Directus\Permissions\Exception;

class UnableFindOwnerItemsException extends PermissionException
{
    const ERROR_CODE = 309;

    public function __construct($collection)
    {
        $message = sprintf('Unable to find items owned by a specific user/role from "%s" collection.', $collection);
        parent::__construct($message, static::ERROR_CODE);
    }
}
