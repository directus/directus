<?php
class Mockable
{
    public $constructorCalled = false;
    public $cloned            = false;

    public function __construct()
    {
        $this->constructorCalled = false;
    }

    public function foo()
    {
        return true;
    }

    public function bar()
    {
        return true;
    }

    public function __clone()
    {
        $this->cloned = true;
    }
}
