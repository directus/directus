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
use Symfony\Component\Config\Definition\Builder\NodeBuilder as BaseNodeBuilder;
use Symfony\Component\Config\Definition\Builder\VariableNodeDefinition as BaseVariableNodeDefinition;

class NodeBuilderTest extends TestCase
{
    /**
     * @expectedException \RuntimeException
     */
    public function testThrowsAnExceptionWhenTryingToCreateANonRegisteredNodeType()
    {
        $builder = new BaseNodeBuilder();
        $builder->node('', 'foobar');
    }

    /**
     * @expectedException \RuntimeException
     */
    public function testThrowsAnExceptionWhenTheNodeClassIsNotFound()
    {
        $builder = new BaseNodeBuilder();
        $builder
            ->setNodeClass('noclasstype', '\\foo\\bar\\noclass')
            ->node('', 'noclasstype');
    }

    public function testAddingANewNodeType()
    {
        $class = __NAMESPACE__.'\\SomeNodeDefinition';

        $builder = new BaseNodeBuilder();
        $node = $builder
            ->setNodeClass('newtype', $class)
            ->node('', 'newtype');

        $this->assertInstanceOf($class, $node);
    }

    public function testOverridingAnExistingNodeType()
    {
        $class = __NAMESPACE__.'\\SomeNodeDefinition';

        $builder = new BaseNodeBuilder();
        $node = $builder
            ->setNodeClass('variable', $class)
            ->node('', 'variable');

        $this->assertInstanceOf($class, $node);
    }

    public function testNodeTypesAreNotCaseSensitive()
    {
        $builder = new BaseNodeBuilder();

        $node1 = $builder->node('', 'VaRiAbLe');
        $node2 = $builder->node('', 'variable');

        $this->assertInstanceOf(\get_class($node1), $node2);

        $builder->setNodeClass('CuStOm', __NAMESPACE__.'\\SomeNodeDefinition');

        $node1 = $builder->node('', 'CUSTOM');
        $node2 = $builder->node('', 'custom');

        $this->assertInstanceOf(\get_class($node1), $node2);
    }

    public function testNumericNodeCreation()
    {
        $builder = new BaseNodeBuilder();

        $node = $builder->integerNode('foo')->min(3)->max(5);
        $this->assertInstanceOf('Symfony\Component\Config\Definition\Builder\IntegerNodeDefinition', $node);

        $node = $builder->floatNode('bar')->min(3.0)->max(5.0);
        $this->assertInstanceOf('Symfony\Component\Config\Definition\Builder\FloatNodeDefinition', $node);
    }
}

class SomeNodeDefinition extends BaseVariableNodeDefinition
{
}
