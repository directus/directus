<?php
/*
 * This file is part of sebastian/diff.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Diff\LCS;

use PHPUnit\Framework\TestCase;

abstract class LongestCommonSubsequenceTest extends TestCase
{
    /**
     * @var LongestCommonSubsequence
     */
    private $implementation;

    /**
     * @var string
     */
    private $memoryLimit;

    /**
     * @var int[]
     */
    private $stress_sizes = array(1, 2, 3, 100, 500, 1000, 2000);

    protected function setUp()
    {
        $this->memoryLimit = \ini_get('memory_limit');
        \ini_set('memory_limit', '256M');

        $this->implementation = $this->createImplementation();
    }

    /**
     * @return LongestCommonSubsequence
     */
    abstract protected function createImplementation();

    protected function tearDown()
    {
        \ini_set('memory_limit', $this->memoryLimit);
    }

    public function testBothEmpty()
    {
        $from   = array();
        $to     = array();
        $common = $this->implementation->calculate($from, $to);

        $this->assertEquals(array(), $common);
    }

    public function testIsStrictComparison()
    {
        $from = array(
            false, 0, 0.0, '', null, array(),
            true, 1, 1.0, 'foo', array('foo', 'bar'), array('foo' => 'bar')
        );
        $to     = $from;
        $common = $this->implementation->calculate($from, $to);

        $this->assertEquals($from, $common);

        $to = array(
            false, false, false, false, false, false,
            true, true, true, true, true, true
        );

        $expected = array(
            false,
            true,
        );

        $common = $this->implementation->calculate($from, $to);

        $this->assertEquals($expected, $common);
    }

    public function testEqualSequences()
    {
        foreach ($this->stress_sizes as $size) {
            $range  = \range(1, $size);
            $from   = $range;
            $to     = $range;
            $common = $this->implementation->calculate($from, $to);

            $this->assertEquals($range, $common);
        }
    }

    public function testDistinctSequences()
    {
        $from   = array('A');
        $to     = array('B');
        $common = $this->implementation->calculate($from, $to);
        $this->assertEquals(array(), $common);

        $from   = array('A', 'B', 'C');
        $to     = array('D', 'E', 'F');
        $common = $this->implementation->calculate($from, $to);
        $this->assertEquals(array(), $common);

        foreach ($this->stress_sizes as $size) {
            $from   = \range(1, $size);
            $to     = \range($size + 1, $size * 2);
            $common = $this->implementation->calculate($from, $to);
            $this->assertEquals(array(), $common);
        }
    }

    public function testCommonSubsequence()
    {
        $from     = array('A',      'C',      'E', 'F', 'G');
        $to       = array('A', 'B',      'D', 'E',           'H');
        $expected = array('A',                'E');
        $common   = $this->implementation->calculate($from, $to);
        $this->assertEquals($expected, $common);

        $from     = array('A',      'C',      'E', 'F', 'G');
        $to       = array('B', 'C', 'D', 'E', 'F',      'H');
        $expected = array('C',                'E', 'F');
        $common   = $this->implementation->calculate($from, $to);
        $this->assertEquals($expected, $common);

        foreach ($this->stress_sizes as $size) {
            $from     = $size < 2 ? array(1) : \range(1, $size + 1, 2);
            $to       = $size < 3 ? array(1) : \range(1, $size + 1, 3);
            $expected = $size < 6 ? array(1) : \range(1, $size + 1, 6);
            $common   = $this->implementation->calculate($from, $to);

            $this->assertEquals($expected, $common);
        }
    }

    public function testSingleElementSubsequenceAtStart()
    {
        foreach ($this->stress_sizes as $size) {
            $from   = \range(1, $size);
            $to     = \array_slice($from, 0, 1);
            $common = $this->implementation->calculate($from, $to);

            $this->assertEquals($to, $common);
        }
    }

    public function testSingleElementSubsequenceAtMiddle()
    {
        foreach ($this->stress_sizes as $size) {
            $from   = \range(1, $size);
            $to     = \array_slice($from, (int) $size / 2, 1);
            $common = $this->implementation->calculate($from, $to);

            $this->assertEquals($to, $common);
        }
    }

    public function testSingleElementSubsequenceAtEnd()
    {
        foreach ($this->stress_sizes as $size) {
            $from   = \range(1, $size);
            $to     = \array_slice($from, $size - 1, 1);
            $common = $this->implementation->calculate($from, $to);

            $this->assertEquals($to, $common);
        }
    }

    public function testReversedSequences()
    {
        $from     = array('A', 'B');
        $to       = array('B', 'A');
        $expected = array('A');
        $common   = $this->implementation->calculate($from, $to);
        $this->assertEquals($expected, $common);

        foreach ($this->stress_sizes as $size) {
            $from   = \range(1, $size);
            $to     = \array_reverse($from);
            $common = $this->implementation->calculate($from, $to);

            $this->assertEquals(array(1), $common);
        }
    }

    public function testStrictTypeCalculate()
    {
        $diff = $this->implementation->calculate(array('5'), array('05'));

        $this->assertInternalType('array', $diff);
        $this->assertCount(0, $diff);
    }
}
