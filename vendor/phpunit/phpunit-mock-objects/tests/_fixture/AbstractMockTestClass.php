<?php
abstract class AbstractMockTestClass implements MockTestInterface
{
    abstract public function doSomething();

    public function returnAnything()
    {
        return 1;
    }
}
