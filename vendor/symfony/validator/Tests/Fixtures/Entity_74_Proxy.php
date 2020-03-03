<?php

namespace Symfony\Component\Validator\Tests\Fixtures;

class Entity_74_Proxy extends Entity_74
{
    public string $notUnset;

    public function __construct()
    {
        unset($this->uninitialized);
    }

    public function __get($name)
    {
        return 42;
    }
}
