<?php

namespace Directus\Filesystem\Exception;

use Directus\Exception\Exception;

class FilesystemException extends Exception
{
    const ERROR_CODE = 600;

    public function __construct($message = '')
    {
        parent::__construct($message, static::ERROR_CODE);
    }
}
