<?php
use PHPUnit\ExampleExtension\TestCaseTrait;

class OneTest extends PHPUnit\Framework\TestCase
{
    use TestCaseTrait;

    public function testOne()
    {
        $this->assertExampleExtensionInitialized();
    }
}
