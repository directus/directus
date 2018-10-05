<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Framework_TestImplementorTest extends PHPUnit_Framework_TestCase
{
    public function testSuccessfulRun()
    {
        $result = new PHPUnit_Framework_TestResult;

        $test = new DoubleTestCase(new Success);
        $test->run($result);

        $this->assertCount(count($test), $result);
        $this->assertEquals(0, $result->errorCount());
        $this->assertEquals(0, $result->failureCount());
    }
}
