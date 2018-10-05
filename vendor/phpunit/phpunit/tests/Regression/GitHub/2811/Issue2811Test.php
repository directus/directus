<?php
class Issue2811Test extends PHPUnit\Framework\TestCase
{
    public function testOne()
    {
        $this->expectExceptionMessage('hello');

        throw new \Exception('hello');
    }
}
