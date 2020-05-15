<?php

namespace Directus\Database\Exception;

use Directus\Exception\NotFoundException;

class ItemNotFoundException extends NotFoundException
{
    const ERROR_CODE = 203;

    public function __construct($message = null)
    {
        if (!$message) {
            $message = 'Item not found';
        }

        parent::__construct($message, static::ERROR_CODE);
    }
}
