<?php

namespace Directus\Filesystem\Exception;

class FailedUploadException extends FilesystemException
{
    protected $uploadedError = 0;

    public function __construct($errorCode)
    {
        $this->uploadedError = $errorCode;
        parent::__construct(\Directus\get_uploaded_file_error($errorCode));
    }

    public function getErrorCode()
    {
        return static::ERROR_CODE + $this->uploadedError;
    }

    public function getStatusCode()
    {
        return \Directus\get_uploaded_file_status($this->uploadedError);
    }
}
