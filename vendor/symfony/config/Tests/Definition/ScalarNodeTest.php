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
use Symfony\Component\Config\Definition\ScalarNode;

class ScalarNodeTest extends TestCase
{
    /**
     * @dataProvider getValidValues
     */
    public function testNormalize($value)
    {
        $node = new ScalarNode('test');
        $this->assertSame($value, $node->normalize($value));
    }

    public function getValidValues()
    {
        return array(
            array(false),
            array(true),
            array(null),
            array(''),
            array('foo'),
            array(0),
            array(1),
            array(0.0),
            array(0.1),
        );
    }

    public function testSetDeprecated()
    {
        $childNode = new ScalarNode('foo');
        $childNode->setDeprecated('"%node%" is deprecated');

        $this->assertTrue($childNode->isDeprecated());
        $this->assertSame('"foo" is deprecated', $childNode->getDeprecationMessage($childNode->getName(), $childNode->getPath()));

        $node = new ArrayNode('root');
        $node->addChild($childNode);

        $deprecationTriggered = 0;
        $deprecationHandler = function ($level, $message, $file, $line) use (&$prevErrorHandler, &$deprecationTriggered) {
            if (E_USER_DEPRECATED === $level) {
                return ++$deprecationTriggered;
            }

            return $prevErrorHandler ? $prevErrorHandler($level, $message, $file, $line) : false;
        };

        $prevErrorHandler = set_error_handler($deprecationHandler);
        $node->finalize(array());
        restore_error_handler();
        $this->assertSame(0, $deprecationTriggered, '->finalize() should not trigger if the deprecated node is not set');

        $prevErrorHandler = set_error_handler($deprecationHandler);
        $node->finalize(array('foo' => ''));
        restore_error_handler();
        $this->assertSame(1, $deprecationTriggered, '->finalize() should trigger if the deprecated node is set');
    }

    /**
     * @dataProvider getInvalidValues
     * @expectedException \Symfony\Component\Config\Definition\Exception\InvalidTypeException
     */
    public function testNormalizeThrowsExceptionOnInvalidValues($value)
    {
        $node = new ScalarNode('test');
        $node->normalize($value);
    }

    public function getInvalidValues()
    {
        return array(
            array(array()),
            array(array('foo' => 'bar')),
            array(new \stdClass()),
        );
    }

    public function testNormalizeThrowsExceptionWithoutHint()
    {
        $node = new ScalarNode('test');

        if (method_exists($this, 'expectException')) {
            $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidTypeException');
            $this->expectExceptionMessage('Invalid type for path "test". Expected scalar, but got array.');
        } else {
            $this->setExpectedException('Symfony\Component\Config\Definition\Exception\InvalidTypeException', 'Invalid type for path "test". Expected scalar, but got array.');
        }

        $node->normalize(array());
    }

    public function testNormalizeThrowsExceptionWithErrorMessage()
    {
        $node = new ScalarNode('test');
        $node->setInfo('"the test value"');

        if (method_exists($this, 'expectException')) {
            $this->expectException('Symfony\Component\Config\Definition\Exception\InvalidTypeException');
            $this->expectExceptionMessage("Invalid type for path \"test\". Expected scalar, but got array.\nHint: \"the test value\"");
        } else {
            $this->setExpectedException('Symfony\Component\Config\Definition\Exception\InvalidTypeException', "Invalid type for path \"test\". Expected scalar, but got array.\nHint: \"the test value\"");
        }

        $node->normalize(array());
    }

    /**
     * @dataProvider getValidNonEmptyValues
     *
     * @param mixed $value
     */
    public function testValidNonEmptyValues($value)
    {
        $node = new ScalarNode('test');
        $node->setAllowEmptyValue(false);

        $this->assertSame($value, $node->finalize($value));
    }

    public function getValidNonEmptyValues()
    {
        return array(
            array(false),
            array(true),
            array('foo'),
            array(0),
            array(1),
            array(0.0),
            array(0.1),
        );
    }

    /**
     * @dataProvider getEmptyValues
     * @expectedException \Symfony\Component\Config\Definition\Exception\InvalidConfigurationException
     *
     * @param mixed $value
     */
    public function testNotAllowedEmptyValuesThrowException($value)
    {
        $node = new ScalarNode('test');
        $node->setAllowEmptyValue(false);
        $node->finalize($value);
    }

    public function getEmptyValues()
    {
        return array(
            array(null),
            array(''),
        );
    }
}
