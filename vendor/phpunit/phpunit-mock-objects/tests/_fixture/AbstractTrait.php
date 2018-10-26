<?php
trait AbstractTrait
{
    abstract public function doSomething();

    public function mockableMethod()
    {
        return true;
    }

    public function anotherMockableMethod()
    {
        return true;
    }
}
