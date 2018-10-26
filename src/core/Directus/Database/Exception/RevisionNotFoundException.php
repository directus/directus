<?php

namespace Directus\Database\Exception;

use Directus\Exception\NotFoundException;

class RevisionNotFoundException extends NotFoundException
{
    const ERROR_CODE = 207;

    public function __construct($id = null)
    {
        if ($id !== null) {
            $message = sprintf('Revision with Id "%s" not found', $id);
        } else {
            $message = 'Revision not found';
        }

        parent::__construct($message, static::ERROR_CODE);
    }
}
