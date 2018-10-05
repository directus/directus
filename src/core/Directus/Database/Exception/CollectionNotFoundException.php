<?php

namespace Directus\Database\Exception;

use Directus\Exception\NotFoundException;

class CollectionNotFoundException extends NotFoundException
{
    const ERROR_CODE = 200;

    public function __construct($name)
    {
        parent::__construct(sprintf('Unable to find collection: %s', $name), static::ERROR_CODE);
    }
}
