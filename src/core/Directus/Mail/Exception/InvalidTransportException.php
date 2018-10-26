<?php

namespace Directus\Mail\Exception;

use Directus\Exception\ErrorExceptionInterface;
use Directus\Exception\Exception;
use Directus\Mail\Transports\AbstractTransport;

class InvalidTransportException extends Exception implements ErrorExceptionInterface
{
    const ERROR_CODE = 501;

    public function __construct($class)
    {
        parent::__construct(
            sprintf(
                'Mailer Transport option must be an instance of %s, string or callable, instead "%s" was given.',
                AbstractTransport::class,
                (string)$class
            ),
            static::ERROR_CODE
        );
    }
}
