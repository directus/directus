<?php
/**
 * @coversDefaultClass \Foo\CoveredClass
 */
class NamespaceCoverageCoversClassPublicTest extends PHPUnit_Framework_TestCase
{
    /**
     * @covers ::publicMethod
     */
    public function testSomething()
    {
        $o = new Foo\CoveredClass;
        $o->publicMethod();
    }
}
