<?php
/*
 * This file is part of the Comparator package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Comparator;

/**
 * @coversDefaultClass SebastianBergmann\Comparator\NumericComparator
 *
 */
class NumericComparatorTest extends \PHPUnit_Framework_TestCase
{
    private $comparator;

    protected function setUp()
    {
        $this->comparator = new NumericComparator;
    }

    public function acceptsSucceedsProvider()
    {
        return array(
          array(5, 10),
          array(8, '0'),
          array('10', 0),
          array(0x74c3b00c, 42),
          array(0755, 0777)
        );
    }

    public function acceptsFailsProvider()
    {
        return array(
          array('5', '10'),
          array(8, 5.0),
          array(5.0, 8),
          array(10, null),
          array(false, 12)
        );
    }

    public function assertEqualsSucceedsProvider()
    {
        return array(
          array(1337, 1337),
          array('1337', 1337),
          array(0x539, 1337),
          array(02471, 1337),
          array(1337, 1338, 1),
          array('1337', 1340, 5),
        );
    }

    public function assertEqualsFailsProvider()
    {
        return array(
          array(1337, 1338),
          array('1338', 1337),
          array(0x539, 1338),
          array(1337, 1339, 1),
          array('1337', 1340, 2),
        );
    }

    /**
     * @covers       ::accepts
     * @dataProvider acceptsSucceedsProvider
     */
    public function testAcceptsSucceeds($expected, $actual)
    {
        $this->assertTrue(
          $this->comparator->accepts($expected, $actual)
        );
    }

    /**
     * @covers       ::accepts
     * @dataProvider acceptsFailsProvider
     */
    public function testAcceptsFails($expected, $actual)
    {
        $this->assertFalse(
          $this->comparator->accepts($expected, $actual)
        );
    }

    /**
     * @covers       ::assertEquals
     * @dataProvider assertEqualsSucceedsProvider
     */
    public function testAssertEqualsSucceeds($expected, $actual, $delta = 0.0)
    {
        $exception = null;

        try {
            $this->comparator->assertEquals($expected, $actual, $delta);
        }

        catch (ComparisonFailure $exception) {
        }

        $this->assertNull($exception, 'Unexpected ComparisonFailure');
    }

    /**
     * @covers       ::assertEquals
     * @dataProvider assertEqualsFailsProvider
     */
    public function testAssertEqualsFails($expected, $actual, $delta = 0.0)
    {
        $this->setExpectedException(
          'SebastianBergmann\\Comparator\\ComparisonFailure', 'matches expected'
        );
        $this->comparator->assertEquals($expected, $actual, $delta);
    }
}
