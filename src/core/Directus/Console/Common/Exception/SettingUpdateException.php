<?php

namespace Directus\Console\Common\Exception;

class SettingUpdateException extends \Exception
{

    public function __toString()
    {
        return __CLASS__ . ": [{$this->code}]: {$this->message}\n";
    }
}
