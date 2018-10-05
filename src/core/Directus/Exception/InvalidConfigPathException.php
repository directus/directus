<?php

namespace Directus\Exception;

class InvalidConfigPathException extends Exception implements UnprocessableEntityExceptionInterface
{
    const ERROR_CODE = 17;

    public function __construct($path)
    {
        $message = sprintf('Unable to create the config. File at "%s" already exists.', $path);

        parent::__construct($message);
    }
}
