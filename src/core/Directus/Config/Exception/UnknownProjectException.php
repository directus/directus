<?php

namespace Directus\Config\Exception;

use Directus\Exception\ErrorException;

class UnknownProjectException extends ErrorException
{
    const ERROR_CODE = 24;

    public function __construct($project, $previous = null)
    {
        $message = "Unknown project: ${project}";

        parent::__construct($message, static::ERROR_CODE, $previous);
    }
}
