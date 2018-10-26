<?php
class StaticMockTestClass
{
    public static function doSomething()
    {
    }

    public static function doSomethingElse()
    {
        return static::doSomething();
    }
}
