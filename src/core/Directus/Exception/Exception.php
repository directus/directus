<?php

namespace Directus\Exception;

class Exception extends \Exception
{
    const ERROR_CODE = 0;

    protected $attributes = [];

    /**
     * Allows child class to extend the error code value method
     *
     * @return int
     */
    public function getErrorCode()
    {
        return static::ERROR_CODE;
    }

    /**
     * Gets the error attributes
     *
     * @return array
     */
    public function getAttributes()
    {
        return $this->attributes;
    }

    /**
     * Returns the HTTP Status Code
     *
     * @return int
     */
    public function getStatusCode()
    {
        return 500;
    }
}
