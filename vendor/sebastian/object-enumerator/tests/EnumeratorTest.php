<?php
/*
 * This file is part of Object Enumerator.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\ObjectEnumerator;

use SebastianBergmann\ObjectEnumerator\Fixtures\ExceptionThrower;

/**
 * @covers SebastianBergmann\ObjectEnumerator\Enumerator
 */
class EnumeratorTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @var Enumerator
     */
    private $enumerator;

    protected function setUp()
    {
        $this->enumerator = new Enumerator;
    }

    public function testEnumeratesSingleObject()
    {
        $a = new \stdClass;

        $objects = $this->enumerator->enumerate($a);

        $this->assertCount(1, $objects);
        $this->assertSame($a, $objects[0]);
    }

    public function testEnumeratesArrayWithSingleObject()
    {
        $a = new \stdClass;

        $objects = $this->enumerator->enumerate([$a]);

        $this->assertCount(1, $objects);
        $this->assertSame($a, $objects[0]);
    }

    public function testEnumeratesArrayWithTwoReferencesToTheSameObject()
    {
        $a = new \stdClass;

        $objects = $this->enumerator->enumerate([$a, $a]);

        $this->assertCount(1, $objects);
        $this->assertSame($a, $objects[0]);
    }

    public function testEnumeratesArrayOfObjects()
    {
        $a = new \stdClass;
        $b = new \stdClass;

        $objects = $this->enumerator->enumerate([$a, $b, null]);

        $this->assertCount(2, $objects);
        $this->assertSame($a, $objects[0]);
        $this->assertSame($b, $objects[1]);
    }

    public function testEnumeratesObjectWithAggregatedObject()
    {
        $a = new \stdClass;
        $b = new \stdClass;

        $a->b = $b;
        $a->c = null;

        $objects = $this->enumerator->enumerate($a);

        $this->assertCount(2, $objects);
        $this->assertSame($a, $objects[0]);
        $this->assertSame($b, $objects[1]);
    }

    public function testEnumeratesObjectWithAggregatedObjectsInArray()
    {
        $a = new \stdClass;
        $b = new \stdClass;

        $a->b = [$b];

        $objects = $this->enumerator->enumerate($a);

        $this->assertCount(2, $objects);
        $this->assertSame($a, $objects[0]);
        $this->assertSame($b, $objects[1]);
    }

    public function testEnumeratesObjectsWithCyclicReferences()
    {
        $a = new \stdClass;
        $b = new \stdClass;

        $a->b = $b;
        $b->a = $a;

        $objects = $this->enumerator->enumerate([$a, $b]);

        $this->assertCount(2, $objects);
        $this->assertSame($a, $objects[0]);
        $this->assertSame($b, $objects[1]);
    }

    public function testEnumeratesClassThatThrowsException()
    {
        $thrower = new ExceptionThrower();

        $objects = $this->enumerator->enumerate($thrower);

        $this->assertSame($thrower, $objects[0]);
    }

    public function testExceptionIsRaisedForInvalidArgument()
    {
        $this->setExpectedException(InvalidArgumentException::class);

        $this->enumerator->enumerate(null);
    }

    public function testExceptionIsRaisedForInvalidArgument2()
    {
        $this->setExpectedException(InvalidArgumentException::class);

        $this->enumerator->enumerate([], '');
    }
}
