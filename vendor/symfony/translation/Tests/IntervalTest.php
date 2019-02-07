<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Translation\Interval;

/**
 * @group legacy
 */
class IntervalTest extends TestCase
{
    /**
     * @dataProvider getTests
     */
    public function testTest($expected, $number, $interval)
    {
        $this->assertEquals($expected, Interval::test($number, $interval));
    }

    /**
     * @expectedException \Symfony\Component\Translation\Exception\InvalidArgumentException
     */
    public function testTestException()
    {
        Interval::test(1, 'foobar');
    }

    public function getTests()
    {
        return [
            [true, 3, '{1,2, 3 ,4}'],
            [false, 10, '{1,2, 3 ,4}'],
            [false, 3, '[1,2]'],
            [true, 1, '[1,2]'],
            [true, 2, '[1,2]'],
            [false, 1, ']1,2['],
            [false, 2, ']1,2['],
            [true, log(0), '[-Inf,2['],
            [true, -log(0), '[-2,+Inf]'],
        ];
    }
}
