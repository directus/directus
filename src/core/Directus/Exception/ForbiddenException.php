<?php

namespace Directus\Exception;

class ForbiddenException extends Exception implements ForbiddenExceptionInterface
{
    const ERROR_CODE = 10;
}
