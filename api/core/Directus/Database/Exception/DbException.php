<?php

namespace Directus\Database\Exception;

use Directus\Exception\HttpExceptionInterface;
use Directus\Exception\Traits\HttpExceptionTrait;

class DbException extends \Exception implements HttpExceptionInterface
{
    use HttpExceptionTrait;

    protected $httpStatus = 422;
}
