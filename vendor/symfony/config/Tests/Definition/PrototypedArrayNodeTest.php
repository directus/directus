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
use Symfony\Component\Config\Definition\ArrayNode;
use Symfony\Component\Config\Definition\PrototypedArrayNode;
use Symfony\Component\Config\Definition\ScalarNode;
use Symfony\Component\Config\Definition\VariableNode;

class PrototypedArrayNodeTest extends TestCase
{
    public function testGetDefaultValueReturnsAnEmptyArrayForPrototypes()
    {
        $node = new PrototypedArrayNode('root');
        $prototype = new ArrayNode(null, $node);
        $node->setPrototype($prototype);
        $this->assertEmpty($node->getDefaultValue());
    }

    public function testGetDefaultValueReturnsDefaultValueForPrototypes()
    {
        $node = new PrototypedArrayNode('root');
        $prototype = new ArrayNode(null, $node);
        $node->setPrototype($prototype);
        $node->setDefaultValue(array('test'));
        $this->assertEquals(array('test'), $node->getDefaultValue());
    }

    // a remapped key (e.g. "mapping" -> "mappings") should be unset after being used
    public function testRemappedKeysAreUnset()
    {
        $node = new ArrayNode('root');
        $mappingsNode = new PrototypedArrayNode('mappings');
        $node->addChild($mappingsNode);

        // each item under mappings is just a scalar
        $prototype = new ScalarNode(null, $mappingsNode);
        $mappingsNode->setPrototype($prototype);

        $remappings = array();
        $remappings[] = array('mapping', 'mappings');
        $node->setXmlRemappings($remappings);

        $normalized = $node->normalize(array('mapping' => array('foo', 'bar')));
        $this->assertEquals(array('mappings' => array('foo', 'bar')), $normalized);
    }

    /**
     * Tests that when a key attribute is mapped, that key is removed from the array.
     *
     *     <things>
     *         <option id="option1" value="foo">
     *         <option id="option2" value="bar">
     *     </things>
     *
     * The above should finally be mapped to an array that looks like this
     * (because "id" is the key attribute).
     *
     *     array(
     *         'things' => array(
     *             'option1' => 'foo',
     *             'option2' => 'bar',
     *         )
     *     )
     */
    public function testMappedAttributeKeyIsRemoved()
    {
        $node = new PrototypedArrayNode('root');
        $node->setKeyAttribute('id', true);

        // each item under the root is an array, with one scalar item
        $prototype = new ArrayNode(null, $node);
        $prototype->addChild(new ScalarNode('foo'));
        $node->setPrototype($prototype);

        $children = array();
        $children[] = array('id' => 'item_name', 'foo' => 'bar');
        $normalized = $node->normalize($children);

        $expected = array();
        $expected['item_name'] = array('foo' => 'bar');
        $this->assertEquals($expected, $normalized);
    }

    /**
     * Tests the opposite of the testMappedAttributeKeyIsRemoved because
     * the removal can be toggled with an option.
     */
    public function testMappedAttributeKeyNotRemoved()
    {
        $node = new PrototypedArrayNode('root');
        $node->setKeyAttribute('id', false);

        // each item under the root is an array, with two scalar items
        $prototype = new ArrayNode(null, $node);
        $prototype->addChild(new ScalarNode('foo'));
        $prototype->addChild(new ScalarNode('id')); // the key attribute will remain
        $node->setPrototype($prototype);

        $children = array();
        $children[] = array('id' => 'item_name', 'foo' => 'bar');
        $normalized = $node->normalize($children);

        $expected = array();
        $expected['item_name'] = array('id' => 'item_name', 'foo' => 'bar');
        $this->assertEquals($expected, $normalized);
    }

    public function testAddDefaultChildren()
    {
        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setAddChildrenIfNoneSet();
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array(array('foo' => 'bar')), $node->getDefaultValue());

        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setKeyAttribute('foobar');
        $node->setAddChildrenIfNoneSet();
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array('defaults' => array('foo' => 'bar')), $node->getDefaultValue());

        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setKeyAttribute('foobar');
        $node->setAddChildrenIfNoneSet('defaultkey');
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array('defaultkey' => array('foo' => 'bar')), $node->getDefaultValue());

        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setKeyAttribute('foobar');
        $node->setAddChildrenIfNoneSet(array('defaultkey'));
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array('defaultkey' => array('foo' => 'bar')), $node->getDefaultValue());

        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setKeyAttribute('foobar');
        $node->setAddChildrenIfNoneSet(array('dk1', 'dk2'));
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array('dk1' => array('foo' => 'bar'), 'dk2' => array('foo' => 'bar')), $node->getDefaultValue());

        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setAddChildrenIfNoneSet(array(5, 6));
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array(0 => array('foo' => 'bar'), 1 => array('foo' => 'bar')), $node->getDefaultValue());

        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setAddChildrenIfNoneSet(2);
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array(array('foo' => 'bar'), array('foo' => 'bar')), $node->getDefaultValue());
    }

    public function testDefaultChildrenWinsOverDefaultValue()
    {
        $node = $this->getPrototypeNodeWithDefaultChildren();
        $node->setAddChildrenIfNoneSet();
        $node->setDefaultValue(array('bar' => 'foo'));
        $this->assertTrue($node->hasDefaultValue());
        $this->assertEquals(array(array('foo' => 'bar')), $node->getDefaultValue());
    }

    protected function getPrototypeNodeWithDefaultChildren()
    {
        $node = new PrototypedArrayNode('root');
        $prototype = new ArrayNode(null, $node);
        $child = new ScalarNode('foo');
        $child->setDefaultValue('bar');
        $prototype->addChild($child);
        $prototype->setAddIfNotSet(true);
        $node->setPrototype($prototype);

        return $node;
    }

    /**
     * Tests that when a key attribute is mapped, that key is removed from the array.
     * And if only 'value' element is left in the array, it will replace its wrapper array.
     *
     *     <things>
     *         <option id="option1" value="value1">
     *     </things>
     *
     * The above should finally be mapped to an array that looks like this
     * (because "id" is the key attribute).
     *
     *     array(
     *         'things' => array(
     *             'option1' => 'value1'
     *         )
     *     )
     *
     * It's also possible to mix 'value-only' and 'non-value-only' elements in the array.
     *
     * <things>
     *     <option id="option1" value="value1">
     *     <option id="option2" value="value2" foo="foo2">
     * </things>
     *
     * The above should finally be mapped to an array as follows
     *
     * array(
     *     'things' => array(
     *         'option1' => 'value1',
     *         'option2' => array(
     *             'value' => 'value2',
     *             'foo' => 'foo2'
     *         )
     *     )
     * )
     *
     * The 'value' element can also be ArrayNode:
     *
     * <things>
     *     <option id="option1">
     *         <value>
     *            <foo>foo1</foo>
     *            <bar>bar1</bar>
     *         </value>
     *     </option>
     * </things>
     *
     * The above should be finally be mapped to an array as follows
     *
     * array(
     *     'things' => array(
     *         'option1' => array(
     *             'foo' => 'foo1',
     *             'bar' => 'bar1'
     *         )
     *     )
     * )
     *
     * If using VariableNode for value node, it's also possible to mix different types of value nodes:
     *
     * <things>
     *     <option id="option1">
     *         <value>
     *            <foo>foo1</foo>
     *            <bar>bar1</bar>
     *         </value>
     *     </option>
     *     <option id="option2" value="value2">
     * </things>
     *
     * The above should be finally mapped to an array as follows
     *
     * array(
     *     'things' => array(
     *         'option1' => array(
     *             'foo' => 'foo1',
     *             'bar' => 'bar1'
     *         ),
     *         'option2' => 'value2'
     *     )
     * )
     *
     *
     * @dataProvider getDataForKeyRemovedLeftValueOnly
     */
    public function testMappedAttributeKeyIsRemovedLeftValueOnly($value, $children, $expected)
    {
        $node = new PrototypedArrayNode('root');
        $node->setKeyAttribute('id', true);

        // each item under the root is an array, with one scalar item
        $prototype = new ArrayNode(null, $node);
        $prototype->addChild(new ScalarNode('id'));
        $prototype->addChild(new ScalarNode('foo'));
        $prototype->addChild($value);
        $node->setPrototype($prototype);

        $normalized = $node->normalize($children);
        $this->assertEquals($expected, $normalized);
    }

    public function getDataForKeyRemovedLeftValueOnly()
    {
        $scalarValue = new ScalarNode('value');

        $arrayValue = new ArrayNode('value');
        $arrayValue->addChild(new ScalarNode('foo'));
        $arrayValue->addChild(new ScalarNode('bar'));

        $variableValue = new VariableNode('value');

        return array(
           array(
               $scalarValue,
               array(
                   array('id' => 'option1', 'value' => 'value1'),
               ),
               array('option1' => 'value1'),
           ),

           array(
               $scalarValue,
               array(
                   array('id' => 'option1', 'value' => 'value1'),
                   array('id' => 'option2', 'value' => 'value2', 'foo' => 'foo2'),
               ),
               array(
                   'option1' => 'value1',
                   'option2' => array('value' => 'value2', 'foo' => 'foo2'),
               ),
           ),

           array(
               $arrayValue,
               array(
                   array(
                       'id' => 'option1',
                       'value' => array('foo' => 'foo1', 'bar' => 'bar1'),
                   ),
               ),
               array(
                   'option1' => array('foo' => 'foo1', 'bar' => 'bar1'),
               ),
           ),

           array($variableValue,
               array(
                   array(
                       'id' => 'option1', 'value' => array('foo' => 'foo1', 'bar' => 'bar1'),
                   ),
                   array('id' => 'option2', 'value' => 'value2'),
               ),
               array(
                   'option1' => array('foo' => 'foo1', 'bar' => 'bar1'),
                   'option2' => 'value2',
               ),
           ),
        );
    }
}
