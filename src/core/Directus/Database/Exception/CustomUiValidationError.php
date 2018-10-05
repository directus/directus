<?php

namespace Directus\Database\Exception;

class CustomUiValidationError extends DbException
{
    protected $httpStatus = 422;

}
