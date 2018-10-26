<?php

namespace Directus\Validator\Exception;

use Directus\Exception\UnprocessableEntityException;

class InvalidRequestException extends UnprocessableEntityException
{
    const ERROR_CODE = 4;
}
