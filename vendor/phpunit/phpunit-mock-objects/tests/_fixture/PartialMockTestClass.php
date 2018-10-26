<?php
class PartialMockTestClass
{
    public $constructorCalled = false;

    public function __construct()
    {
        $this->constructorCalled = true;
    }

    public function doSomething()
    {
    }

    public function doAnotherThing()
    {
    }
}
