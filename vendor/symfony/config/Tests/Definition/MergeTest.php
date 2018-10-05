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
    /**
     * @expectedException \Symfony\Component\Config\Definition\Exception\ForbiddenOverwriteException
     */
    public function testForbiddenOverwrite()
    {
        $tb = new TreeBuilder();
        $tree = $tb
            ->root('root', 'array')
                ->children()
                    ->node('foo', 'scalar')
                        ->cannotBeOverwritten()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $a = array(
            'foo' => 'bar',
        );

        $b = array(
            'foo' => 'moo',
        );

        $tree->merge($a, $b);
    }

    public function testUnsetKey()
    {
        $tb = new TreeBuilder();
        $tree = $tb
            ->root('root', 'array')
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

        $a = array(
            'foo' => 'bar',
            'unsettable' => array(
                'foo' => 'a',
                'bar' => 'b',
            ),
            'unsetted' => false,
        );

        $b = array(
            'foo' => 'moo',
            'bar' => 'b',
            'unsettable' => false,
            'unsetted' => array('a', 'b'),
        );

        $this->assertEquals(array(
            'foo' => 'moo',
            'bar' => 'b',
            'unsettable' => false,
            'unsetted' => array('a', 'b'),
        ), $tree->merge($a, $b));
    }

    /**
     * @expectedException \Symfony\Component\Config\Definition\Exception\InvalidConfigurationException
     */
    public function testDoesNotAllowNewKeysInSubsequentConfigs()
    {
        $tb = new TreeBuilder();
        $tree = $tb
            ->root('config', 'array')
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

        $a = array(
            'test' => array(
                'a' => array('value' => 'foo'),
            ),
        );

        $b = array(
            'test' => array(
                'b' => array('value' => 'foo'),
            ),
        );

        $tree->merge($a, $b);
    }

    public function testPerformsNoDeepMerging()
    {
        $tb = new TreeBuilder();

        $tree = $tb
            ->root('config', 'array')
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

        $a = array(
            'no_deep_merging' => array(
                'foo' => 'a',
                'bar' => 'b',
            ),
        );

        $b = array(
            'no_deep_merging' => array(
                'c' => 'd',
            ),
        );

        $this->assertEquals(array(
            'no_deep_merging' => array(
                'c' => 'd',
            ),
        ), $tree->merge($a, $b));
    }

    public function testPrototypeWithoutAKeyAttribute()
    {
        $tb = new TreeBuilder();

        $tree = $tb
            ->root('config', 'array')
                ->children()
                    ->arrayNode('append_elements')
                        ->prototype('scalar')->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $a = array(
            'append_elements' => array('a', 'b'),
        );

        $b = array(
            'append_elements' => array('c', 'd'),
        );

        $this->assertEquals(array('append_elements' => array('a', 'b', 'c', 'd')), $tree->merge($a, $b));
    }
}
