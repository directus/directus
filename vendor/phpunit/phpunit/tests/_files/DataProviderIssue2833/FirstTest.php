<?php

namespace Foo\DataProviderIssue2833;

use PHPUnit\Framework\TestCase;

class FirstTest extends TestCase
{
    /**
     * @dataProvider provide
     */
    public function testFirst($x)
    {
        $this->assertTrue(true);
    }

    public function provide()
    {
        SecondTest::DUMMY;

        return [[true]];
    }
}
