<?php

namespace DeepCopy\f002;

class A
{
    private $prop1;
    private $prop2;

    public function getProp1()
    {
        return $this->prop1;
    }

    public function setProp1($prop)
    {
        $this->prop1 = $prop;

        return $this;
    }

    public function getProp2()
    {
        return $this->prop2;
    }

    public function setProp2($prop)
    {
        $this->prop2 = $prop;

        return $this;
    }
}
