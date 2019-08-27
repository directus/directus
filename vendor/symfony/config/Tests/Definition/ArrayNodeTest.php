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
use Symfony\Component\Config\Definition\Exception\InvalidConfigurationException;
use Symfony\Component\Config\Definition\ScalarNode;

class ArrayNodeTest extends TestCase
{
    public function testNormalizeThrowsExceptionWhenFalseIsNotAllowed()
    {
        $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidTypeException');
        $node = new ArrayNode('root');
        $node->normalize(false);
    }

    public function testExceptionThrownOnUnrecognizedChild()
    {
        $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidConfigurationException');
        $this->expectExceptionMessage('Unrecognized option "foo" under "root"');
        $node = new ArrayNode('root');
        $node->normalize(['foo' => 'bar']);
    }

    public function testNormalizeWithProposals()
    {
        $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidConfigurationException');
        $this->expectExceptionMessage('Did you mean "alpha1", "alpha2"?');
        $node = new ArrayNode('root');
        $node->addChild(new ArrayNode('alpha1'));
        $node->addChild(new ArrayNode('alpha2'));
        $node->addChild(new ArrayNode('beta'));
        $node->normalize(['alpha3' => 'foo']);
    }

    public function testNormalizeWithoutProposals()
    {
        $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidConfigurationException');
        $this->expectExceptionMessage('Available options are "alpha1", "alpha2".');
        $node = new ArrayNode('root');
        $node->addChild(new ArrayNode('alpha1'));
        $node->addChild(new ArrayNode('alpha2'));
        $node->normalize(['beta' => 'foo']);
    }

    public function ignoreAndRemoveMatrixProvider()
    {
        $unrecognizedOptionException = new InvalidConfigurationException('Unrecognized option "foo" under "root"');

        return [
            [true, true, [], 'no exception is thrown for an unrecognized child if the ignoreExtraKeys option is set to true'],
            [true, false, ['foo' => 'bar'], 'extra keys are not removed when ignoreExtraKeys second option is set to false'],
            [false, true, $unrecognizedOptionException],
            [false, false, $unrecognizedOptionException],
        ];
    }

    /**
     * @dataProvider ignoreAndRemoveMatrixProvider
     */
    public function testIgnoreAndRemoveBehaviors($ignore, $remove, $expected, $message = '')
    {
        if ($expected instanceof \Exception) {
            $this->expectException(\get_class($expected));
            $this->expectExceptionMessage($expected->getMessage());
        }
        $node = new ArrayNode('root');
        $node->setIgnoreExtraKeys($ignore, $remove);
        $result = $node->normalize(['foo' => 'bar']);
        $this->assertSame($expected, $result, $message);
    }

    /**
     * @dataProvider getPreNormalizationTests
     */
    public function testPreNormalize($denormalized, $normalized)
    {
        $node = new ArrayNode('foo');

        $r = new \ReflectionMethod($node, 'preNormalize');
        $r->setAccessible(true);

        $this->assertSame($normalized, $r->invoke($node, $denormalized));
    }

    public function getPreNormalizationTests()
    {
        return [
            [
                ['foo-bar' => 'foo'],
                ['foo_bar' => 'foo'],
            ],
            [
                ['foo-bar_moo' => 'foo'],
                ['foo-bar_moo' => 'foo'],
            ],
            [
                ['anything-with-dash-and-no-underscore' => 'first', 'no_dash' => 'second'],
                ['anything_with_dash_and_no_underscore' => 'first', 'no_dash' => 'second'],
            ],
            [
                ['foo-bar' => null, 'foo_bar' => 'foo'],
                ['foo-bar' => null, 'foo_bar' => 'foo'],
            ],
        ];
    }

    /**
     * @dataProvider getZeroNamedNodeExamplesData
     */
    public function testNodeNameCanBeZero($denormalized, $normalized)
    {
        $zeroNode = new ArrayNode(0);
        $zeroNode->addChild(new ScalarNode('name'));
        $fiveNode = new ArrayNode(5);
        $fiveNode->addChild(new ScalarNode(0));
        $fiveNode->addChild(new ScalarNode('new_key'));
        $rootNode = new ArrayNode('root');
        $rootNode->addChild($zeroNode);
        $rootNode->addChild($fiveNode);
        $rootNode->addChild(new ScalarNode('string_key'));
        $r = new \ReflectionMethod($rootNode, 'normalizeValue');
        $r->setAccessible(true);

        $this->assertSame($normalized, $r->invoke($rootNode, $denormalized));
    }

    public function getZeroNamedNodeExamplesData()
    {
        return [
            [
                [
                    0 => [
                        'name' => 'something',
                    ],
                    5 => [
                        0 => 'this won\'t work too',
                        'new_key' => 'some other value',
                    ],
                    'string_key' => 'just value',
                ],
                [
                    0 => [
                        'name' => 'something',
                    ],
                    5 => [
                        0 => 'this won\'t work too',
                        'new_key' => 'some other value',
                    ],
                    'string_key' => 'just value',
                ],
            ],
        ];
    }

    /**
     * @dataProvider getPreNormalizedNormalizedOrderedData
     */
    public function testChildrenOrderIsMaintainedOnNormalizeValue($prenormalized, $normalized)
    {
        $scalar1 = new ScalarNode('1');
        $scalar2 = new ScalarNode('2');
        $scalar3 = new ScalarNode('3');
        $node = new ArrayNode('foo');
        $node->addChild($scalar1);
        $node->addChild($scalar3);
        $node->addChild($scalar2);

        $r = new \ReflectionMethod($node, 'normalizeValue');
        $r->setAccessible(true);

        $this->assertSame($normalized, $r->invoke($node, $prenormalized));
    }

    public function getPreNormalizedNormalizedOrderedData()
    {
        return [
            [
                ['2' => 'two', '1' => 'one', '3' => 'three'],
                ['2' => 'two', '1' => 'one', '3' => 'three'],
            ],
        ];
    }

    public function testAddChildEmptyName()
    {
        $this->expectException('InvalidArgumentException');
        $this->expectExceptionMessage('Child nodes must be named.');
        $node = new ArrayNode('root');

        $childNode = new ArrayNode('');
        $node->addChild($childNode);
    }

    public function testAddChildNameAlreadyExists()
    {
        $this->expectException('InvalidArgumentException');
        $this->expectExceptionMessage('A child node named "foo" already exists.');
        $node = new ArrayNode('root');

        $childNode = new ArrayNode('foo');
        $node->addChild($childNode);

        $childNodeWithSameName = new ArrayNode('foo');
        $node->addChild($childNodeWithSameName);
    }

    public function testGetDefaultValueWithoutDefaultValue()
    {
        $this->expectException('RuntimeException');
        $this->expectExceptionMessage('The node at path "foo" has no default value.');
        $node = new ArrayNode('foo');
        $node->getDefaultValue();
    }

    public function testSetDeprecated()
    {
        $childNode = new ArrayNode('foo');
        $childNode->setDeprecated('"%node%" is deprecated');

        $this->assertTrue($childNode->isDeprecated());
        $this->assertSame('"foo" is deprecated', $childNode->getDeprecationMessage($childNode->getName(), $childNode->getPath()));

        $node = new ArrayNode('root');
        $node->addChild($childNode);

        $deprecationTriggered = false;
        $deprecationHandler = function ($level, $message, $file, $line) use (&$prevErrorHandler, &$deprecationTriggered) {
            if (E_USER_DEPRECATED === $level) {
                return $deprecationTriggered = true;
            }

            return $prevErrorHandler ? $prevErrorHandler($level, $message, $file, $line) : false;
        };

        $prevErrorHandler = set_error_handler($deprecationHandler);
        $node->finalize([]);
        restore_error_handler();

        $this->assertFalse($deprecationTriggered, '->finalize() should not trigger if the deprecated node is not set');

        $prevErrorHandler = set_error_handler($deprecationHandler);
        $node->finalize(['foo' => []]);
        restore_error_handler();
        $this->assertTrue($deprecationTriggered, '->finalize() should trigger if the deprecated node is set');
    }

    /**
     * @dataProvider getDataWithIncludedExtraKeys
     */
    public function testMergeWithoutIgnoringExtraKeys($prenormalizeds, $merged)
    {
        $this->expectException('RuntimeException');
        $this->expectExceptionMessage('merge() expects a normalized config array.');
        $node = new ArrayNode('root');
        $node->addChild(new ScalarNode('foo'));
        $node->addChild(new ScalarNode('bar'));
        $node->setIgnoreExtraKeys(false);

        $r = new \ReflectionMethod($node, 'mergeValues');
        $r->setAccessible(true);

        $r->invoke($node, ...$prenormalizeds);
    }

    /**
     * @dataProvider getDataWithIncludedExtraKeys
     */
    public function testMergeWithIgnoringAndRemovingExtraKeys($prenormalizeds, $merged)
    {
        $this->expectException('RuntimeException');
        $this->expectExceptionMessage('merge() expects a normalized config array.');
        $node = new ArrayNode('root');
        $node->addChild(new ScalarNode('foo'));
        $node->addChild(new ScalarNode('bar'));
        $node->setIgnoreExtraKeys(true);

        $r = new \ReflectionMethod($node, 'mergeValues');
        $r->setAccessible(true);

        $r->invoke($node, ...$prenormalizeds);
    }

    /**
     * @dataProvider getDataWithIncludedExtraKeys
     */
    public function testMergeWithIgnoringExtraKeys($prenormalizeds, $merged)
    {
        $node = new ArrayNode('root');
        $node->addChild(new ScalarNode('foo'));
        $node->addChild(new ScalarNode('bar'));
        $node->setIgnoreExtraKeys(true, false);

        $r = new \ReflectionMethod($node, 'mergeValues');
        $r->setAccessible(true);

        $this->assertEquals($merged, $r->invoke($node, ...$prenormalizeds));
    }

    public function getDataWithIncludedExtraKeys()
    {
        return [
            [
                [['foo' => 'bar', 'baz' => 'not foo'], ['bar' => 'baz', 'baz' => 'foo']],
                ['foo' => 'bar', 'bar' => 'baz', 'baz' => 'foo'],
            ],
        ];
    }
}
