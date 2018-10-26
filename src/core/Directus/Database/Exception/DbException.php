<?php

namespace Directus\Database\Exception;

use Directus\Exception\Exception;

class DbException extends Exception
{
    protected $httpStatus = 422;
}
