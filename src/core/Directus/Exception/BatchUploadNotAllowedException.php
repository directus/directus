<?php

namespace Directus\Exception;

class BatchUploadNotAllowedException extends BadRequestException
{
    const ERROR_CODE = 15;

    public function __construct()
    {
        parent::__construct('Batch upload is not allowed');
    }
}
