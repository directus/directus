<?php

namespace Directus\Exception;

class HttpException extends Exception
{
    protected $httpStatus;
    protected $httpHeaders;

    /**
     * Gets exception http status code
     *
     * @return mixed
     */
    public function getStatus()
    {
        return $this->httpStatus;
    }

    /**
     * Get exception http headers
     *
     * @return mixed
     */
    public function getHeaders()
    {
        return $this->httpHeaders;
    }
}
