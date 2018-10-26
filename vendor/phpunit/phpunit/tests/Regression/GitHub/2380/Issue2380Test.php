<?php
use PHPUnit\Framework\TestCase;

class Issue2380Test extends TestCase
{
    /**
     * @dataProvider generatorData
     */
    public function testGeneratorProvider($data)
    {
        $this->assertNotEmpty($data);
    }

    /**
     * @return Generator
     */
    public function generatorData()
    {
        yield ['testing'];
    }
}
