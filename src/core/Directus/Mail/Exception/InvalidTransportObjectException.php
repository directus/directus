<?php

namespace Directus\Mail\Exception;

use Directus\Exception\ErrorExceptionInterface;
use Directus\Exception\Exception;
use Directus\Mail\Transports\AbstractTransport;

class InvalidTransportObjectException extends Exception implements ErrorExceptionInterface
{
    const ERROR_CODE = 502;

    public function __construct($object)
    {
        parent::__construct(
            sprintf(
                'Mailer Transport instance must be an instance of "%s" instead "%s" was given.',
                AbstractTransport::class,
                get_class($object)
            ),
            static::ERROR_CODE
        );
    }
}
