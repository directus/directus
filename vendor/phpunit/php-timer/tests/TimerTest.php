<?php
/*
 * This file is part of the PHP_Timer package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use PHPUnit\Framework\TestCase;

class PHP_TimerTest extends TestCase
{
    /**
     * @covers PHP_Timer::start
     * @covers PHP_Timer::stop
     */
    public function testStartStop()
    {
        $this->assertInternalType('float', PHP_Timer::stop());
    }

    /**
     * @covers       PHP_Timer::secondsToTimeString
     * @dataProvider secondsProvider
     */
    public function testSecondsToTimeString($string, $seconds)
    {
        $this->assertEquals(
            $string,
            PHP_Timer::secondsToTimeString($seconds)
        );
    }

    /**
     * @covers PHP_Timer::timeSinceStartOfRequest
     */
    public function testTimeSinceStartOfRequest()
    {
        $this->assertStringMatchesFormat(
            '%f %s',
            PHP_Timer::timeSinceStartOfRequest()
        );
    }


    /**
     * @covers PHP_Timer::resourceUsage
     */
    public function testResourceUsage()
    {
        $this->assertStringMatchesFormat(
            'Time: %s, Memory: %fMB',
            PHP_Timer::resourceUsage()
        );
    }

    public function secondsProvider()
    {
        return array(
          array('0 ms', 0),
          array('1 ms', .001),
          array('10 ms', .01),
          array('100 ms', .1),
          array('999 ms', .999),
          array('1 second', .9999),
          array('1 second', 1),
          array('2 seconds', 2),
          array('59.9 seconds', 59.9),
          array('59.99 seconds', 59.99),
          array('59.99 seconds', 59.999),
          array('1 minute', 59.9999),
          array('59 seconds', 59.001),
          array('59.01 seconds', 59.01),
          array('1 minute', 60),
          array('1.01 minutes', 61),
          array('2 minutes', 120),
          array('2.01 minutes', 121),
          array('59.99 minutes', 3599.9),
          array('59.99 minutes', 3599.99),
          array('59.99 minutes', 3599.999),
          array('1 hour', 3599.9999),
          array('59.98 minutes', 3599.001),
          array('59.98 minutes', 3599.01),
          array('1 hour', 3600),
          array('1 hour', 3601),
          array('1 hour', 3601.9),
          array('1 hour', 3601.99),
          array('1 hour', 3601.999),
          array('1 hour', 3601.9999),
          array('1.01 hours', 3659.9999),
          array('1.01 hours', 3659.001),
          array('1.01 hours', 3659.01),
          array('2 hours', 7199.9999),
        );
    }
}
