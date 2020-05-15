<?php

namespace Directus\Exception;

class UnprocessableEntityException extends Exception implements UnprocessableEntityExceptionInterface
{
    const ERROR_CODE = 12;
}
