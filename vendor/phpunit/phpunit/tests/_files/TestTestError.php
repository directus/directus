<?php
class TestError extends PHPUnit_Framework_TestCase
{
    protected function runTest()
    {
        throw new Exception;
    }
}
