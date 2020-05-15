<?php

namespace Directus\Exception;

class InvalidPayloadException extends BadRequestException
{
    const ERROR_CODE = 13;

    public function __construct()
    {
        parent::__construct('Invalid or Empty Payload');
    }
}
