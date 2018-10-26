<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Config\Tests\Definition\Builder;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Config\Definition\Builder\EnumNodeDefinition;

class EnumNodeDefinitionTest extends TestCase
{
    public function testWithOneValue()
    {
        $def = new EnumNodeDefinition('foo');
        $def->values(array('foo'));

        $node = $def->getNode();
        $this->assertEquals(array('foo'), $node->getValues());
    }

    public function testWithOneDistinctValue()
    {
        $def = new EnumNodeDefinition('foo');
        $def->values(array('foo', 'foo'));

        $node = $def->getNode();
        $this->assertEquals(array('foo'), $node->getValues());
    }

    /**
     * @expectedException \RuntimeException
     * @expectedExceptionMessage You must call ->values() on enum nodes.
     */
    public function testNoValuesPassed()
    {
        $def = new EnumNodeDefinition('foo');
        $def->getNode();
    }

    /**
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage ->values() must be called with at least one value.
     */
    public function testWithNoValues()
    {
        $def = new EnumNodeDefinition('foo');
        $def->values(array());
    }

    public function testGetNode()
    {
        $def = new EnumNodeDefinition('foo');
        $def->values(array('foo', 'bar'));

        $node = $def->getNode();
        $this->assertEquals(array('foo', 'bar'), $node->getValues());
    }

    public function testSetDeprecated()
    {
        $def = new EnumNodeDefinition('foo');
        $def->values(array('foo', 'bar'));
        $def->setDeprecated('The "%path%" node is deprecated.');

        $node = $def->getNode();

        $this->assertTrue($node->isDeprecated());
        $this->assertSame('The "foo" node is deprecated.', $def->getNode()->getDeprecationMessage($node->getName(), $node->getPath()));
    }
}
