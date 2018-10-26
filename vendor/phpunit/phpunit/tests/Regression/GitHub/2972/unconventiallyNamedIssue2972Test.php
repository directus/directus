<?php

namespace Issue2972;

use PHPUnit\Framework\TestCase;

class Issue2972Test extends TestCase
{
    public function testHello()
    {
        $this->assertNotEmpty('Hello world!');
    }
}
