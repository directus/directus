<?php

namespace Directus\Exception;

class NotFoundException extends Exception implements NotFoundExceptionInterface
{
    const ERROR_CODE = 1;
}
