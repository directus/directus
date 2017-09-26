<?php

namespace Directus\Database\Exception;

class DuplicateEntryException extends DbException
{
    protected $httpStatus = 409;

    public function __construct($message, $code = 0, \Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);

        preg_match("/Duplicate entry '([^']+)' for key '([^']+)'/i", $message, $output);

        if ($output) {
            $messageFormat = 'Duplicate value: %s<br>(%s)';
            $this->message = sprintf($messageFormat, $output[1], $output[2]);
        }
    }
}
