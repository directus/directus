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
use Symfony\Component\Config\Definition\Builder\TreeBuilder;
use Symfony\Component\Config\Tests\Fixtures\Builder\NodeBuilder as CustomNodeBuilder;

class TreeBuilderTest extends TestCase
{
    public function testUsingACustomNodeBuilder()
    {
        $builder = new TreeBuilder();
        $root = $builder->root('custom', 'array', new CustomNodeBuilder());

        $nodeBuilder = $root->children();

        $this->assertInstanceOf('Symfony\Component\Config\Tests\Fixtures\Builder\NodeBuilder', $nodeBuilder);

        $nodeBuilder = $nodeBuilder->arrayNode('deeper')->children();

        $this->assertInstanceOf('Symfony\Component\Config\Tests\Fixtures\Builder\NodeBuilder', $nodeBuilder);
    }

    public function testOverrideABuiltInNodeType()
    {
        $builder = new TreeBuilder();
        $root = $builder->root('override', 'array', new CustomNodeBuilder());

        $definition = $root->children()->variableNode('variable');

        $this->assertInstanceOf('Symfony\Component\Config\Tests\Fixtures\Builder\VariableNodeDefinition', $definition);
    }

    public function testAddANodeType()
    {
        $builder = new TreeBuilder();
        $root = $builder->root('override', 'array', new CustomNodeBuilder());

        $definition = $root->children()->barNode('variable');

        $this->assertInstanceOf('Symfony\Component\Config\Tests\Fixtures\Builder\BarNodeDefinition', $definition);
    }

    public function testCreateABuiltInNodeTypeWithACustomNodeBuilder()
    {
        $builder = new TreeBuilder();
        $root = $builder->root('builtin', 'array', new CustomNodeBuilder());

        $definition = $root->children()->booleanNode('boolean');

        $this->assertInstanceOf('Symfony\Component\Config\Definition\Builder\BooleanNodeDefinition', $definition);
    }

    public function testPrototypedArrayNodeUseTheCustomNodeBuilder()
    {
        $builder = new TreeBuilder();
        $root = $builder->root('override', 'array', new CustomNodeBuilder());

        $root->prototype('bar')->end();

        $this->assertInstanceOf('Symfony\Component\Config\Tests\Fixtures\BarNode', $root->getNode(true)->getPrototype());
    }

    public function testAnExtendedNodeBuilderGetsPropagatedToTheChildren()
    {
        $builder = new TreeBuilder();

        $builder->root('propagation')
            ->children()
                ->setNodeClass('extended', 'Symfony\Component\Config\Definition\Builder\BooleanNodeDefinition')
                ->node('foo', 'extended')->end()
                ->arrayNode('child')
                    ->children()
                        ->node('foo', 'extended')
                    ->end()
                ->end()
            ->end()
        ->end();

        $node = $builder->buildTree();
        $children = $node->getChildren();

        $this->assertInstanceOf('Symfony\Component\Config\Definition\BooleanNode', $children['foo']);

        $childChildren = $children['child']->getChildren();

        $this->assertInstanceOf('Symfony\Component\Config\Definition\BooleanNode', $childChildren['foo']);
    }

    public function testDefinitionInfoGetsTransferredToNode()
    {
        $builder = new TreeBuilder();

        $builder->root('test')->info('root info')
            ->children()
                ->node('child', 'variable')->info('child info')->defaultValue('default')
            ->end()
        ->end();

        $tree = $builder->buildTree();
        $children = $tree->getChildren();

        $this->assertEquals('root info', $tree->getInfo());
        $this->assertEquals('child info', $children['child']->getInfo());
    }

    public function testDefinitionExampleGetsTransferredToNode()
    {
        $builder = new TreeBuilder();

        $builder->root('test')
            ->example(array('key' => 'value'))
            ->children()
                ->node('child', 'variable')->info('child info')->defaultValue('default')->example('example')
            ->end()
        ->end();

        $tree = $builder->buildTree();
        $children = $tree->getChildren();

        $this->assertInternalType('array', $tree->getExample());
        $this->assertEquals('example', $children['child']->getExample());
    }

    public function testDefaultPathSeparatorIsDot()
    {
        $builder = new TreeBuilder();

        $builder->root('propagation')
            ->children()
                ->node('foo', 'variable')->end()
                ->arrayNode('child')
                    ->children()
                        ->node('foo', 'variable')
                    ->end()
                ->end()
            ->end()
        ->end();

        $node = $builder->buildTree();
        $children = $node->getChildren();

        $this->assertArrayHasKey('foo', $children);
        $this->assertInstanceOf('Symfony\Component\Config\Definition\BaseNode', $children['foo']);
        $this->assertSame('propagation.foo', $children['foo']->getPath());

        $this->assertArrayHasKey('child', $children);
        $childChildren = $children['child']->getChildren();

        $this->assertArrayHasKey('foo', $childChildren);
        $this->assertInstanceOf('Symfony\Component\Config\Definition\BaseNode', $childChildren['foo']);
        $this->assertSame('propagation.child.foo', $childChildren['foo']->getPath());
    }

    public function testPathSeparatorIsPropagatedToChildren()
    {
        $builder = new TreeBuilder();

        $builder->root('propagation')
            ->children()
                ->node('foo', 'variable')->end()
                ->arrayNode('child')
                    ->children()
                        ->node('foo', 'variable')
                    ->end()
                ->end()
            ->end()
        ->end();

        $builder->setPathSeparator('/');
        $node = $builder->buildTree();
        $children = $node->getChildren();

        $this->assertArrayHasKey('foo', $children);
        $this->assertInstanceOf('Symfony\Component\Config\Definition\BaseNode', $children['foo']);
        $this->assertSame('propagation/foo', $children['foo']->getPath());

        $this->assertArrayHasKey('child', $children);
        $childChildren = $children['child']->getChildren();

        $this->assertArrayHasKey('foo', $childChildren);
        $this->assertInstanceOf('Symfony\Component\Config\Definition\BaseNode', $childChildren['foo']);
        $this->assertSame('propagation/child/foo', $childChildren['foo']->getPath());
    }
}
