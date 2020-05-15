<?php

namespace Directus\Database\Exception;

use Directus\Exception\NotFoundException;

class CollectionNotManagedException extends NotFoundException
{
    const ERROR_CODE = 205;

    public function __construct($collection)
    {
        $message = sprintf('Collection "%s" is not being managed by Directus', $collection);
        parent::__construct($message, static::ERROR_CODE);
    }
}
