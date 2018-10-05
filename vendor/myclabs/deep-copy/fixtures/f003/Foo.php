<?php

namespace DeepCopy\f003;

class Foo
{
    private $name;
    private $prop;

    public function __construct($name)
    {
        $this->name = $name;
    }

    public function getProp()
    {
        return $this->prop;
    }

    public function setProp($prop)
    {
        $this->prop = $prop;

        return $this;
    }
}