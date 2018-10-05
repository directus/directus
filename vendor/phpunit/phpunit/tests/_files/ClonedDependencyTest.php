<?php
class ClonedDependencyTest extends PHPUnit_Framework_TestCase
{
    private static $dependency;

    public static function setUpBeforeClass()
    {
        self::$dependency = new StdClass;
    }

    public function testOne()
    {
        return self::$dependency;
    }

    /**
     * @depends testOne
     */
    public function testTwo($dependency)
    {
        $this->assertSame(self::$dependency, $dependency);
    }

    /**
     * @depends !clone testOne
     */
    public function testThree($dependency)
    {
        $this->assertSame(self::$dependency, $dependency);
    }

    /**
     * @depends clone testOne
     */
    public function testFour($dependency)
    {
        $this->assertNotSame(self::$dependency, $dependency);
    }
}
