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
 * @coversDefaultClass SebastianBergmann\Comparator\ArrayComparator
 *
 */
class ArrayComparatorTest extends \PHPUnit_Framework_TestCase
{
    private $comparator;

    protected function setUp()
    {
        $this->comparator = new ArrayComparator;
        $this->comparator->setFactory(new Factory);
    }

    public function acceptsFailsProvider()
    {
        return array(
          array(array(), null),
          array(null, array()),
          array(null, null)
        );
    }

    public function assertEqualsSucceedsProvider()
    {
        return array(
          array(
            array('a' => 1, 'b' => 2),
            array('b' => 2, 'a' => 1)
          ),
          array(
            array(1),
            array('1')
          ),
          array(
            array(3, 2, 1),
            array(2, 3, 1),
            0,
            true
          ),
          array(
            array(2.3),
            array(2.5),
            0.5
          ),
          array(
            array(array(2.3)),
            array(array(2.5)),
            0.5
          ),
          array(
            array(new Struct(2.3)),
            array(new Struct(2.5)),
            0.5
          ),
        );
    }

    public function assertEqualsFailsProvider()
    {
        return array(
          array(
            array(),
            array(0 => 1)
          ),
          array(
            array(0 => 1),
            array()
          ),
          array(
            array(0 => null),
            array()
          ),
          array(
            array(0 => 1, 1 => 2),
            array(0 => 1, 1 => 3)
          ),
          array(
            array('a', 'b' => array(1, 2)),
            array('a', 'b' => array(2, 1))
          ),
          array(
            array(2.3),
            array(4.2),
            0.5
          ),
          array(
            array(array(2.3)),
            array(array(4.2)),
            0.5
          ),
          array(
            array(new Struct(2.3)),
            array(new Struct(4.2)),
            0.5
          )
        );
    }

    /**
     * @covers  ::accepts
     */
    public function testAcceptsSucceeds()
    {
        $this->assertTrue(
          $this->comparator->accepts(array(), array())
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
    public function testAssertEqualsSucceeds($expected, $actual, $delta = 0.0, $canonicalize = false)
    {
        $exception = null;

        try {
            $this->comparator->assertEquals($expected, $actual, $delta, $canonicalize);
        }

        catch (ComparisonFailure $exception) {
        }

        $this->assertNull($exception, 'Unexpected ComparisonFailure');
    }

    /**
     * @covers       ::assertEquals
     * @dataProvider assertEqualsFailsProvider
     */
    public function testAssertEqualsFails($expected, $actual,$delta = 0.0, $canonicalize = false)
    {
        $this->setExpectedException(
          'SebastianBergmann\\Comparator\\ComparisonFailure',
          'Failed asserting that two arrays are equal'
        );
        $this->comparator->assertEquals($expected, $actual, $delta, $canonicalize);
    }
}
