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

use DateTime;
use DateTimeImmutable;
use DateTimeZone;

/**
 * @coversDefaultClass SebastianBergmann\Comparator\DateTimeComparator
 *
 */
class DateTimeComparatorTest extends \PHPUnit_Framework_TestCase
{
    private $comparator;

    protected function setUp()
    {
        $this->comparator = new DateTimeComparator;
    }

    public function acceptsFailsProvider()
    {
        $datetime = new DateTime;

        return array(
          array($datetime, null),
          array(null, $datetime),
          array(null, null)
        );
    }

    public function assertEqualsSucceedsProvider()
    {
        return array(
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York'))
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 04:13:25', new DateTimeZone('America/New_York')),
            10
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 04:14:40', new DateTimeZone('America/New_York')),
            65
          ),
          array(
            new DateTime('2013-03-29', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29', new DateTimeZone('America/New_York'))
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 03:13:35', new DateTimeZone('America/Chicago'))
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 03:13:49', new DateTimeZone('America/Chicago')),
            15
          ),
          array(
            new DateTime('2013-03-30', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 23:00:00', new DateTimeZone('America/Chicago'))
          ),
          array(
            new DateTime('2013-03-30', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 23:01:30', new DateTimeZone('America/Chicago')),
            100
          ),
          array(
            new DateTime('@1364616000'),
            new DateTime('2013-03-29 23:00:00', new DateTimeZone('America/Chicago'))
          ),
          array(
            new DateTime('2013-03-29T05:13:35-0500'),
            new DateTime('2013-03-29T04:13:35-0600')
          )
        );
    }

    public function assertEqualsFailsProvider()
    {
        return array(
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 03:13:35', new DateTimeZone('America/New_York'))
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 03:13:35', new DateTimeZone('America/New_York')),
            3500
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 05:13:35', new DateTimeZone('America/New_York')),
            3500
          ),
          array(
            new DateTime('2013-03-29', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-30', new DateTimeZone('America/New_York'))
          ),
          array(
            new DateTime('2013-03-29', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-30', new DateTimeZone('America/New_York')),
            43200
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/Chicago')),
          ),
          array(
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/Chicago')),
            3500
          ),
          array(
            new DateTime('2013-03-30', new DateTimeZone('America/New_York')),
            new DateTime('2013-03-30', new DateTimeZone('America/Chicago'))
          ),
          array(
            new DateTime('2013-03-29T05:13:35-0600'),
            new DateTime('2013-03-29T04:13:35-0600')
          ),
          array(
            new DateTime('2013-03-29T05:13:35-0600'),
            new DateTime('2013-03-29T05:13:35-0500')
          ),
        );
    }

    /**
     * @covers  ::accepts
     */
    public function testAcceptsSucceeds()
    {
        $this->assertTrue(
          $this->comparator->accepts(
            new DateTime,
            new DateTime
          )
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
          'SebastianBergmann\\Comparator\\ComparisonFailure',
          'Failed asserting that two DateTime objects are equal.'
        );
        $this->comparator->assertEquals($expected, $actual, $delta);
    }

    /**
     * @requires PHP 5.5
     * @covers   ::accepts
     */
    public function testAcceptsDateTimeInterface()
    {
        $this->assertTrue($this->comparator->accepts(new DateTime, new DateTimeImmutable));
    }

    /**
     * @requires PHP 5.5
     * @covers   ::assertEquals
     */
    public function testSupportsDateTimeInterface()
    {
        $this->comparator->assertEquals(
          new DateTime('2013-03-29 04:13:35', new DateTimeZone('America/New_York')),
          new DateTimeImmutable('2013-03-29 04:13:35', new DateTimeZone('America/New_York'))
        );
    }
}
