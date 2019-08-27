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
use Symfony\Component\Config\Definition\Builder\TreeBuilder;

class MergeTest extends TestCase
{
    public function testForbiddenOverwrite()
    {
        $this->expectException('Symfony\Component\Config\Definition\Exception\ForbiddenOverwriteException');
        $tb = new TreeBuilder('root', 'array');
        $tree = $tb
            ->getRootNode()
                ->children()
                    ->node('foo', 'scalar')
                        ->cannotBeOverwritten()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $a = [
            'foo' => 'bar',
        ];

        $b = [
            'foo' => 'moo',
        ];

        $tree->merge($a, $b);
    }

    public function testUnsetKey()
    {
        $tb = new TreeBuilder('root', 'array');
        $tree = $tb
            ->getRootNode()
                ->children()
                    ->node('foo', 'scalar')->end()
                    ->node('bar', 'scalar')->end()
                    ->node('unsettable', 'array')
                        ->canBeUnset()
                        ->children()
                            ->node('foo', 'scalar')->end()
                            ->node('bar', 'scalar')->end()
                        ->end()
                    ->end()
                    ->node('unsetted', 'array')
                        ->canBeUnset()
                        ->prototype('scalar')->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $a = [
            'foo' => 'bar',
            'unsettable' => [
                'foo' => 'a',
                'bar' => 'b',
            ],
            'unsetted' => false,
        ];

        $b = [
            'foo' => 'moo',
            'bar' => 'b',
            'unsettable' => false,
            'unsetted' => ['a', 'b'],
        ];

        $this->assertEquals([
            'foo' => 'moo',
            'bar' => 'b',
            'unsettable' => false,
            'unsetted' => ['a', 'b'],
        ], $tree->merge($a, $b));
    }

    public function testDoesNotAllowNewKeysInSubsequentConfigs()
    {
        $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidConfigurationException');
        $tb = new TreeBuilder('root', 'array');
        $tree = $tb
            ->getRootNode()
                ->children()
                    ->node('test', 'array')
                        ->disallowNewKeysInSubsequentConfigs()
                        ->useAttributeAsKey('key')
                        ->prototype('array')
                            ->children()
                                ->node('value', 'scalar')->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree();

        $a = [
            'test' => [
                'a' => ['value' => 'foo'],
            ],
        ];

        $b = [
            'test' => [
                'b' => ['value' => 'foo'],
            ],
        ];

        $tree->merge($a, $b);
    }

    public function testPerformsNoDeepMerging()
    {
        $tb = new TreeBuilder('root', 'array');

        $tree = $tb
            ->getRootNode()
                ->children()
                    ->node('no_deep_merging', 'array')
                        ->performNoDeepMerging()
                        ->children()
                            ->node('foo', 'scalar')->end()
                            ->node('bar', 'scalar')->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $a = [
            'no_deep_merging' => [
                'foo' => 'a',
                'bar' => 'b',
            ],
        ];

        $b = [
            'no_deep_merging' => [
                'c' => 'd',
            ],
        ];

        $this->assertEquals([
            'no_deep_merging' => [
                'c' => 'd',
            ],
        ], $tree->merge($a, $b));
    }

    public function testPrototypeWithoutAKeyAttribute()
    {
        $tb = new TreeBuilder('root', 'array');

        $tree = $tb
            ->getRootNode()
                ->children()
                    ->arrayNode('append_elements')
                        ->prototype('scalar')->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $a = [
            'append_elements' => ['a', 'b'],
        ];

        $b = [
            'append_elements' => ['c', 'd'],
        ];

        $this->assertEquals(['append_elements' => ['a', 'b', 'c', 'd']], $tree->merge($a, $b));
    }
}
