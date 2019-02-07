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
use Symfony\Component\Config\Definition\NodeInterface;
use Symfony\Component\Config\Definition\Processor;

class FinalizationTest extends TestCase
{
    public function testUnsetKeyWithDeepHierarchy()
    {
        $tb = new TreeBuilder('config', 'array');
        $tree = $tb
            ->getRootNode()
                ->children()
                    ->node('level1', 'array')
                        ->canBeUnset()
                        ->children()
                            ->node('level2', 'array')
                                ->canBeUnset()
                                ->children()
                                    ->node('somevalue', 'scalar')->end()
                                    ->node('anothervalue', 'scalar')->end()
                                ->end()
                            ->end()
                            ->node('level1_scalar', 'scalar')->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $a = [
            'level1' => [
                'level2' => [
                    'somevalue' => 'foo',
                    'anothervalue' => 'bar',
                ],
                'level1_scalar' => 'foo',
            ],
        ];

        $b = [
            'level1' => [
                'level2' => false,
            ],
        ];

        $this->assertEquals([
            'level1' => [
                'level1_scalar' => 'foo',
            ],
        ], $this->process($tree, [$a, $b]));
    }

    protected function process(NodeInterface $tree, array $configs)
    {
        $processor = new Processor();

        return $processor->process($tree, $configs);
    }
}
