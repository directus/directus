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

class ExprBuilderTest extends TestCase
{
    public function testAlwaysExpression()
    {
        $test = $this->getTestBuilder()
            ->always($this->returnClosure('new_value'))
        ->end();

        $this->assertFinalizedValueIs('new_value', $test);
    }

    public function testIfTrueExpression()
    {
        $test = $this->getTestBuilder()
            ->ifTrue()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test, array('key' => true));

        $test = $this->getTestBuilder()
            ->ifTrue(function ($v) { return true; })
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test);

        $test = $this->getTestBuilder()
            ->ifTrue(function ($v) { return false; })
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('value', $test);
    }

    public function testIfStringExpression()
    {
        $test = $this->getTestBuilder()
            ->ifString()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test);

        $test = $this->getTestBuilder()
            ->ifString()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs(45, $test, array('key' => 45));
    }

    public function testIfNullExpression()
    {
        $test = $this->getTestBuilder()
            ->ifNull()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test, array('key' => null));

        $test = $this->getTestBuilder()
            ->ifNull()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('value', $test);
    }

    public function testIfEmptyExpression()
    {
        $test = $this->getTestBuilder()
            ->ifEmpty()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test, array('key' => array()));

        $test = $this->getTestBuilder()
            ->ifEmpty()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('value', $test);
    }

    public function testIfArrayExpression()
    {
        $test = $this->getTestBuilder()
            ->ifArray()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test, array('key' => array()));

        $test = $this->getTestBuilder()
            ->ifArray()
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('value', $test);
    }

    public function testIfInArrayExpression()
    {
        $test = $this->getTestBuilder()
            ->ifInArray(array('foo', 'bar', 'value'))
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test);

        $test = $this->getTestBuilder()
            ->ifInArray(array('foo', 'bar'))
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('value', $test);
    }

    public function testIfNotInArrayExpression()
    {
        $test = $this->getTestBuilder()
            ->ifNotInArray(array('foo', 'bar'))
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test);

        $test = $this->getTestBuilder()
            ->ifNotInArray(array('foo', 'bar', 'value_from_config'))
            ->then($this->returnClosure('new_value'))
        ->end();
        $this->assertFinalizedValueIs('new_value', $test);
    }

    public function testThenEmptyArrayExpression()
    {
        $test = $this->getTestBuilder()
            ->ifString()
            ->thenEmptyArray()
        ->end();
        $this->assertFinalizedValueIs(array(), $test);
    }

    /**
     * @dataProvider castToArrayValues
     */
    public function testcastToArrayExpression($configValue, $expectedValue)
    {
        $test = $this->getTestBuilder()
            ->castToArray()
        ->end();
        $this->assertFinalizedValueIs($expectedValue, $test, array('key' => $configValue));
    }

    public function castToArrayValues()
    {
        yield array('value', array('value'));
        yield array(-3.14, array(-3.14));
        yield array(null, array(null));
        yield array(array('value'), array('value'));
    }

    /**
     * @expectedException \Symfony\Component\Config\Definition\Exception\InvalidConfigurationException
     */
    public function testThenInvalid()
    {
        $test = $this->getTestBuilder()
            ->ifString()
            ->thenInvalid('Invalid value')
        ->end();
        $this->finalizeTestBuilder($test);
    }

    public function testThenUnsetExpression()
    {
        $test = $this->getTestBuilder()
            ->ifString()
            ->thenUnset()
        ->end();
        $this->assertEquals(array(), $this->finalizeTestBuilder($test));
    }

    /**
     * @expectedException \RuntimeException
     * @expectedExceptionMessage You must specify an if part.
     */
    public function testEndIfPartNotSpecified()
    {
        $this->getTestBuilder()->end();
    }

    /**
     * @expectedException \RuntimeException
     * @expectedExceptionMessage You must specify a then part.
     */
    public function testEndThenPartNotSpecified()
    {
        $builder = $this->getTestBuilder();
        $builder->ifPart = 'test';
        $builder->end();
    }

    /**
     * Create a test treebuilder with a variable node, and init the validation.
     *
     * @return TreeBuilder
     */
    protected function getTestBuilder()
    {
        $builder = new TreeBuilder();

        return $builder
            ->root('test')
            ->children()
            ->variableNode('key')
            ->validate()
        ;
    }

    /**
     * Close the validation process and finalize with the given config.
     *
     * @param TreeBuilder $testBuilder The tree builder to finalize
     * @param array       $config      The config you want to use for the finalization, if nothing provided
     *                                 a simple array('key'=>'value') will be used
     *
     * @return array The finalized config values
     */
    protected function finalizeTestBuilder($testBuilder, $config = null)
    {
        return $testBuilder
            ->end()
            ->end()
            ->end()
            ->buildTree()
            ->finalize(null === $config ? array('key' => 'value') : $config)
        ;
    }

    /**
     * Return a closure that will return the given value.
     *
     * @param mixed $val The value that the closure must return
     *
     * @return \Closure
     */
    protected function returnClosure($val)
    {
        return function ($v) use ($val) {
            return $val;
        };
    }

    /**
     * Assert that the given test builder, will return the given value.
     *
     * @param mixed       $value       The value to test
     * @param TreeBuilder $treeBuilder The tree builder to finalize
     * @param mixed       $config      The config values that new to be finalized
     */
    protected function assertFinalizedValueIs($value, $treeBuilder, $config = null)
    {
        $this->assertEquals(array('key' => $value), $this->finalizeTestBuilder($treeBuilder, $config));
    }
}
