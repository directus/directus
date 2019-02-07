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

class NormalizationTest extends TestCase
{
    /**
     * @dataProvider getEncoderTests
     */
    public function testNormalizeEncoders($denormalized)
    {
        $tb = new TreeBuilder('root_name', 'array');
        $tree = $tb
            ->getRootNode()
                ->fixXmlConfig('encoder')
                ->children()
                    ->node('encoders', 'array')
                        ->useAttributeAsKey('class')
                        ->prototype('array')
                            ->beforeNormalization()->ifString()->then(function ($v) { return ['algorithm' => $v]; })->end()
                            ->children()
                                ->node('algorithm', 'scalar')->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $normalized = [
            'encoders' => [
                'foo' => ['algorithm' => 'plaintext'],
            ],
        ];

        $this->assertNormalized($tree, $denormalized, $normalized);
    }

    public function getEncoderTests()
    {
        $configs = [];

        // XML
        $configs[] = [
            'encoder' => [
                ['class' => 'foo', 'algorithm' => 'plaintext'],
            ],
        ];

        // XML when only one element of this type
        $configs[] = [
            'encoder' => ['class' => 'foo', 'algorithm' => 'plaintext'],
        ];

        // YAML/PHP
        $configs[] = [
            'encoders' => [
                ['class' => 'foo', 'algorithm' => 'plaintext'],
            ],
        ];

        // YAML/PHP
        $configs[] = [
            'encoders' => [
                'foo' => 'plaintext',
            ],
        ];

        // YAML/PHP
        $configs[] = [
            'encoders' => [
                'foo' => ['algorithm' => 'plaintext'],
            ],
        ];

        return array_map(function ($v) {
            return [$v];
        }, $configs);
    }

    /**
     * @dataProvider getAnonymousKeysTests
     */
    public function testAnonymousKeysArray($denormalized)
    {
        $tb = new TreeBuilder('root', 'array');
        $tree = $tb
            ->getRootNode()
                ->children()
                    ->node('logout', 'array')
                        ->fixXmlConfig('handler')
                        ->children()
                            ->node('handlers', 'array')
                                ->prototype('scalar')->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $normalized = ['logout' => ['handlers' => ['a', 'b', 'c']]];

        $this->assertNormalized($tree, $denormalized, $normalized);
    }

    public function getAnonymousKeysTests()
    {
        $configs = [];

        $configs[] = [
            'logout' => [
                'handlers' => ['a', 'b', 'c'],
            ],
        ];

        $configs[] = [
            'logout' => [
                'handler' => ['a', 'b', 'c'],
            ],
        ];

        return array_map(function ($v) { return [$v]; }, $configs);
    }

    /**
     * @dataProvider getNumericKeysTests
     */
    public function testNumericKeysAsAttributes($denormalized)
    {
        $normalized = [
            'thing' => [42 => ['foo', 'bar'], 1337 => ['baz', 'qux']],
        ];

        $this->assertNormalized($this->getNumericKeysTestTree(), $denormalized, $normalized);
    }

    public function getNumericKeysTests()
    {
        $configs = [];

        $configs[] = [
            'thing' => [
                42 => ['foo', 'bar'], 1337 => ['baz', 'qux'],
            ],
        ];

        $configs[] = [
            'thing' => [
                ['foo', 'bar', 'id' => 42], ['baz', 'qux', 'id' => 1337],
            ],
        ];

        return array_map(function ($v) { return [$v]; }, $configs);
    }

    /**
     * @expectedException \Symfony\Component\Config\Definition\Exception\InvalidConfigurationException
     * @expectedExceptionMessage The attribute "id" must be set for path "root.thing".
     */
    public function testNonAssociativeArrayThrowsExceptionIfAttributeNotSet()
    {
        $denormalized = [
            'thing' => [
                ['foo', 'bar'], ['baz', 'qux'],
            ],
        ];

        $this->assertNormalized($this->getNumericKeysTestTree(), $denormalized, []);
    }

    public function testAssociativeArrayPreserveKeys()
    {
        $tb = new TreeBuilder('root', 'array');
        $tree = $tb
            ->getRootNode()
                ->prototype('array')
                    ->children()
                        ->node('foo', 'scalar')->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $data = ['first' => ['foo' => 'bar']];

        $this->assertNormalized($tree, $data, $data);
    }

    public static function assertNormalized(NodeInterface $tree, $denormalized, $normalized)
    {
        self::assertSame($normalized, $tree->normalize($denormalized));
    }

    private function getNumericKeysTestTree()
    {
        $tb = new TreeBuilder('root', 'array');
        $tree = $tb
            ->getRootNode()
                ->children()
                    ->node('thing', 'array')
                        ->useAttributeAsKey('id')
                        ->prototype('array')
                            ->prototype('scalar')->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        return $tree;
    }
}
