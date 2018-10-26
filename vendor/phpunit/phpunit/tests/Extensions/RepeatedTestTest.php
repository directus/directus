<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Extensions_RepeatedTestTest extends PHPUnit_Framework_TestCase
{
    protected $suite;

    public function __construct()
    {
        $this->suite = new PHPUnit_Framework_TestSuite;

        $this->suite->addTest(new Success);
        $this->suite->addTest(new Success);
    }

    public function testRepeatedOnce()
    {
        $test = new PHPUnit_Extensions_RepeatedTest($this->suite, 1);
        $this->assertCount(2, $test);

        $result = $test->run();
        $this->assertCount(2, $result);
    }

    public function testRepeatedMoreThanOnce()
    {
        $test = new PHPUnit_Extensions_RepeatedTest($this->suite, 3);
        $this->assertCount(6, $test);

        $result = $test->run();
        $this->assertCount(6, $result);
    }

    public function testRepeatedZero()
    {
        $test = new PHPUnit_Extensions_RepeatedTest($this->suite, 0);
        $this->assertCount(0, $test);

        $result = $test->run();
        $this->assertCount(0, $result);
    }

    public function testRepeatedNegative()
    {
        try {
            $test = new PHPUnit_Extensions_RepeatedTest($this->suite, -1);
        } catch (Exception $e) {
            return;
        }

        $this->fail('Should throw an Exception');
    }
}
