<?php

namespace DeepCopy\f001;

class A
{
    private $aProp;

    public function getAProp()
    {
        return $this->aProp;
    }

    public function setAProp($prop)
    {
        $this->aProp = $prop;

        return $this;
    }
}
