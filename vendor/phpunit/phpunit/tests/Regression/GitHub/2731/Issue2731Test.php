<?php
class Issue2731Test extends PHPUnit\Framework\TestCase
{
    public function testOne()
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('');

        throw new Exception('message');
    }
}
