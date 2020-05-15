<?php

namespace Directus\Exception;

class ProjectAlreadyExistException extends Exception implements ConflictExceptionInterface
{
    const ERROR_CODE = 18;

    public function __construct($name)
    {
        $message = sprintf('A project named "%s" already exists.', $name);

        parent::__construct($message, static::ERROR_CODE);
    }
}
