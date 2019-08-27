<?php

namespace Directus\Validator\Exception;

use Directus\Exception\UnprocessableEntityException;

class InvalidRequestException extends UnprocessableEntityException
{
    protected $uploadedError = 4;

    public function __construct($message = '', $errorCode = "")
    {
        $this->uploadedError = $errorCode ?: $this->uploadedError ;
        parent::__construct($message, $this->uploadedError);
    }

    public function getErrorCode()
    {
        return $this->uploadedError;
    }
}
