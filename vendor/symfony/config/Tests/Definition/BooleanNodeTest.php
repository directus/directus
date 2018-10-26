<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Tests\Definition;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Definition\BooleanNode;

class BooleanNodeTest extends TestCase
{
    /**
     * @dataProvider getValidValues
     */
    public function testNormalize($value)
    {
        $node = new BooleanNode('test');
        $this->assertSame($value, $node->normalize($value));
    }

    /**
     * @dataProvider getValidValues
     *
     * @param bool $value
     */
    public function testValidNonEmptyValues($value)
    {
        $node = new BooleanNode('test');
        $node->setAllowEmptyValue(false);

        $this->assertSame($value, $node->finalize($value));
    }

    public function getValidValues()
    {
        return array(
            array(false),
            array(true),
        );
    }

    /**
     * @dataProvider getInvalidValues
     * @expectedException \Symfony\Component\Config\Definition\Exception\InvalidTypeException
     */
    public function testNormalizeThrowsExceptionOnInvalidValues($value)
    {
        $node = new BooleanNode('test');
        $node->normalize($value);
    }

    public function getInvalidValues()
    {
        return array(
            array(null),
            array(''),
            array('foo'),
            array(0),
            array(1),
            array(0.0),
            array(0.1),
            array(array()),
            array(array('foo' => 'bar')),
            array(new \stdClass()),
        );
    }
}
