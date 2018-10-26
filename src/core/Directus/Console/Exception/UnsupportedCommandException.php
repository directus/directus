<?php

namespace Directus\Console\Exception;

class UnsupportedCommandException extends \Exception
{

    public function __toString()
    {
        return __CLASS__ . ": [{$this->code}]: {$this->message}\n";
    }
}
