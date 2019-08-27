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
use Symfony\Component\Config\Definition\FloatNode;

class FloatNodeTest extends TestCase
{
    /**
     * @dataProvider getValidValues
     */
    public function testNormalize($value)
    {
        $node = new FloatNode('test');
        $this->assertSame($value, $node->normalize($value));
    }

    /**
     * @dataProvider getValidValues
     *
     * @param int $value
     */
    public function testValidNonEmptyValues($value)
    {
        $node = new FloatNode('test');
        $node->setAllowEmptyValue(false);

        $this->assertSame($value, $node->finalize($value));
    }

    public function getValidValues()
    {
        return [
            [1798.0],
            [-678.987],
            [12.56E45],
            [0.0],
            // Integer are accepted too, they will be cast
            [17],
            [-10],
            [0],
        ];
    }

    /**
     * @dataProvider getInvalidValues
     */
    public function testNormalizeThrowsExceptionOnInvalidValues($value)
    {
        $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidTypeException');
        $node = new FloatNode('test');
        $node->normalize($value);
    }

    public function getInvalidValues()
    {
        return [
            [null],
            [''],
            ['foo'],
            [true],
            [false],
            [[]],
            [['foo' => 'bar']],
            [new \stdClass()],
        ];
    }
}
