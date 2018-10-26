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
        $tb = new TreeBuilder();
        $tree = $tb
            ->root('root_name', 'array')
                ->fixXmlConfig('encoder')
                ->children()
                    ->node('encoders', 'array')
                        ->useAttributeAsKey('class')
                        ->prototype('array')
                            ->beforeNormalization()->ifString()->then(function ($v) { return array('algorithm' => $v); })->end()
                            ->children()
                                ->node('algorithm', 'scalar')->end()
                            ->end()
                        ->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $normalized = array(
            'encoders' => array(
                'foo' => array('algorithm' => 'plaintext'),
            ),
        );

        $this->assertNormalized($tree, $denormalized, $normalized);
    }

    public function getEncoderTests()
    {
        $configs = array();

        // XML
        $configs[] = array(
            'encoder' => array(
                array('class' => 'foo', 'algorithm' => 'plaintext'),
            ),
        );

        // XML when only one element of this type
        $configs[] = array(
            'encoder' => array('class' => 'foo', 'algorithm' => 'plaintext'),
        );

        // YAML/PHP
        $configs[] = array(
            'encoders' => array(
                array('class' => 'foo', 'algorithm' => 'plaintext'),
            ),
        );

        // YAML/PHP
        $configs[] = array(
            'encoders' => array(
                'foo' => 'plaintext',
            ),
        );

        // YAML/PHP
        $configs[] = array(
            'encoders' => array(
                'foo' => array('algorithm' => 'plaintext'),
            ),
        );

        return array_map(function ($v) {
            return array($v);
        }, $configs);
    }

    /**
     * @dataProvider getAnonymousKeysTests
     */
    public function testAnonymousKeysArray($denormalized)
    {
        $tb = new TreeBuilder();
        $tree = $tb
            ->root('root', 'array')
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

        $normalized = array('logout' => array('handlers' => array('a', 'b', 'c')));

        $this->assertNormalized($tree, $denormalized, $normalized);
    }

    public function getAnonymousKeysTests()
    {
        $configs = array();

        $configs[] = array(
            'logout' => array(
                'handlers' => array('a', 'b', 'c'),
            ),
        );

        $configs[] = array(
            'logout' => array(
                'handler' => array('a', 'b', 'c'),
            ),
        );

        return array_map(function ($v) { return array($v); }, $configs);
    }

    /**
     * @dataProvider getNumericKeysTests
     */
    public function testNumericKeysAsAttributes($denormalized)
    {
        $normalized = array(
            'thing' => array(42 => array('foo', 'bar'), 1337 => array('baz', 'qux')),
        );

        $this->assertNormalized($this->getNumericKeysTestTree(), $denormalized, $normalized);
    }

    public function getNumericKeysTests()
    {
        $configs = array();

        $configs[] = array(
            'thing' => array(
                42 => array('foo', 'bar'), 1337 => array('baz', 'qux'),
            ),
        );

        $configs[] = array(
            'thing' => array(
                array('foo', 'bar', 'id' => 42), array('baz', 'qux', 'id' => 1337),
            ),
        );

        return array_map(function ($v) { return array($v); }, $configs);
    }

    /**
     * @expectedException \Symfony\Component\Config\Definition\Exception\InvalidConfigurationException
     * @expectedExceptionMessage The attribute "id" must be set for path "root.thing".
     */
    public function testNonAssociativeArrayThrowsExceptionIfAttributeNotSet()
    {
        $denormalized = array(
            'thing' => array(
                array('foo', 'bar'), array('baz', 'qux'),
            ),
        );

        $this->assertNormalized($this->getNumericKeysTestTree(), $denormalized, array());
    }

    public function testAssociativeArrayPreserveKeys()
    {
        $tb = new TreeBuilder();
        $tree = $tb
            ->root('root', 'array')
                ->prototype('array')
                    ->children()
                        ->node('foo', 'scalar')->end()
                    ->end()
                ->end()
            ->end()
            ->buildTree()
        ;

        $data = array('first' => array('foo' => 'bar'));

        $this->assertNormalized($tree, $data, $data);
    }

    public static function assertNormalized(NodeInterface $tree, $denormalized, $normalized)
    {
        self::assertSame($normalized, $tree->normalize($denormalized));
    }

    private function getNumericKeysTestTree()
    {
        $tb = new TreeBuilder();
        $tree = $tb
            ->root('root', 'array')
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
