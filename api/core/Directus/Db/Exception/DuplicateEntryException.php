<?php

namespace Directus\Db\Exception;

class DuplicateEntryException extends DbException
{
    public function __construct($message, $code = 0, \Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);

        preg_match("/Duplicate entry '([^']+)'/i", $message, $output);

        if ($output) {
            $this->message = 'Duplicate value: '.$output[1];
        }
    }
}
