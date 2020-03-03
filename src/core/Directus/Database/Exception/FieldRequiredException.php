<?php

namespace Directus\Database\Exception;

use Directus\Exception\UnprocessableEntityException;

class FieldRequiredException extends UnprocessableEntityException
{
    const ERROR_CODE = 404;
 
    public function __construct()
    {
        parent::__construct("Can't make this field required. There are items in this collection with no value for this field.", static::ERROR_CODE);
    }

}
