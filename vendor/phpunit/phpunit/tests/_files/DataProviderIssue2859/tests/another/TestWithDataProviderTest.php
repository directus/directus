<?php

namespace Foo\DataProviderIssue2859;

use PHPUnit\Framework\TestCase;

class TestWithDataProviderTest extends TestCase
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
        return [[true]];
    }
}
