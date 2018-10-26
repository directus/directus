<?php

namespace Directus\Mail\Exception;

use Directus\Exception\ErrorExceptionInterface;
use Directus\Exception\Exception;

class TransportNotFoundException extends Exception implements ErrorExceptionInterface
{
    const ERROR_CODE = 500;

    public function __construct($transport)
    {
        parent::__construct(sprintf('Mailer Transport "%s" not found', $transport), static::ERROR_CODE);
    }
}
