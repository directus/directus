<?php

namespace DeepCopy\f007;

use DateTimeZone;

class FooDateTimeZone extends DateTimeZone
{
    public $cloned = false;

    public function __clone()
    {
        $this->cloned = true;
    }
}
