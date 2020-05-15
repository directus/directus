<?php

namespace Directus\Mail\Exception;

use Directus\Exception\ErrorExceptionInterface;
use Directus\Exception\Exception;

class MailNotSentException extends Exception implements ErrorExceptionInterface
{
    const ERROR_CODE = 503;

    public function __construct()
    {
        parent::__construct("It seems like there's some issue when sending the mail. Please try again later.", static::ERROR_CODE);
    }
}
