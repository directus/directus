<?php

namespace Directus\Database\Exception;

use Directus\Exception\RuntimeException;

class RevisionInvalidDeltaException extends RuntimeException
{
    const ERROR_CODE = 208;

    public function __construct($id = null)
    {
        if ($id !== null) {
            $message = sprintf('Revision with Id "%s" has an invalid delta', $id);
        } else {
            $message = 'Revision has an invalid delta';
        }

        parent::__construct($message, static::ERROR_CODE);
    }
}
