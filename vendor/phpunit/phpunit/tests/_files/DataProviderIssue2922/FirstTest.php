<?php

namespace Foo\DataProviderIssue2922;

use PHPUnit\Framework\TestCase;

/**
 * @group foo
 */
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
        throw new \Exception();
    }
}
