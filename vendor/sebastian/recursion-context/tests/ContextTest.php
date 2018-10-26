<?php
/*
 * This file is part of the Recursion Context package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\RecursionContext;

use PHPUnit_Framework_TestCase;

/**
 * @covers SebastianBergmann\RecursionContext\Context
 */
class ContextTest extends PHPUnit_Framework_TestCase
{
    /**
     * @var \SebastianBergmann\RecursionContext\Context
     */
    private $context;

    protected function setUp()
    {
        $this->context = new Context();
    }

    public function failsProvider()
    {
        return array(
            array(true),
            array(false),
            array(null),
            array('string'),
            array(1),
            array(1.5),
            array(fopen('php://memory', 'r'))
        );
    }

    public function valuesProvider()
    {
        $obj2      = new \stdClass();
        $obj2->foo = 'bar';

        $obj3 = (object) array(1,2,"Test\r\n",4,5,6,7,8);

        $obj = new \stdClass();
        //@codingStandardsIgnoreStart
        $obj->null = null;
        //@codingStandardsIgnoreEnd
        $obj->boolean     = true;
        $obj->integer     = 1;
        $obj->double      = 1.2;
        $obj->string      = '1';
        $obj->text        = "this\nis\na\nvery\nvery\nvery\nvery\nvery\nvery\rlong\n\rtext";
        $obj->object      = $obj2;
        $obj->objectagain = $obj2;
        $obj->array       = array('foo' => 'bar');
        $obj->array2      = array(1,2,3,4,5,6);
        $obj->array3      = array($obj, $obj2, $obj3);
        $obj->self        = $obj;

        $storage = new \SplObjectStorage();
        $storage->attach($obj2);
        $storage->foo = $obj2;

        return array(
            array($obj, spl_object_hash($obj)),
            array($obj2, spl_object_hash($obj2)),
            array($obj3, spl_object_hash($obj3)),
            array($storage, spl_object_hash($storage)),
            array($obj->array, 0),
            array($obj->array2, 0),
            array($obj->array3, 0)
        );
    }

    /**
     * @covers       SebastianBergmann\RecursionContext\Context::add
     * @uses         SebastianBergmann\RecursionContext\InvalidArgumentException
     * @dataProvider failsProvider
     */
    public function testAddFails($value)
    {
        $this->setExpectedException(
          'SebastianBergmann\\RecursionContext\\Exception',
          'Only arrays and objects are supported'
        );
        $this->context->add($value);
    }

    /**
     * @covers       SebastianBergmann\RecursionContext\Context::contains
     * @uses         SebastianBergmann\RecursionContext\InvalidArgumentException
     * @dataProvider failsProvider
     */
    public function testContainsFails($value)
    {
        $this->setExpectedException(
          'SebastianBergmann\\RecursionContext\\Exception',
          'Only arrays and objects are supported'
        );
        $this->context->contains($value);
    }

    /**
     * @covers       SebastianBergmann\RecursionContext\Context::add
     * @dataProvider valuesProvider
     */
    public function testAdd($value, $key)
    {
        $this->assertEquals($key, $this->context->add($value));

        // Test we get the same key on subsequent adds
        $this->assertEquals($key, $this->context->add($value));
    }

    /**
     * @covers       SebastianBergmann\RecursionContext\Context::contains
     * @uses         SebastianBergmann\RecursionContext\Context::add
     * @depends      testAdd
     * @dataProvider valuesProvider
     */
    public function testContainsFound($value, $key)
    {
        $this->context->add($value);
        $this->assertEquals($key, $this->context->contains($value));

        // Test we get the same key on subsequent calls
        $this->assertEquals($key, $this->context->contains($value));
    }

    /**
     * @covers       SebastianBergmann\RecursionContext\Context::contains
     * @dataProvider valuesProvider
     */
    public function testContainsNotFound($value)
    {
        $this->assertFalse($this->context->contains($value));
    }
}
