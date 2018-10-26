<?php
/*
 * This file is part of the PHPUnit_MockObject package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Builder for mocked or stubbed invocations.
 *
 * Provides methods for building expectations without having to resort to
 * instantiating the various matchers manually. These methods also form a
 * more natural way of reading the expectation. This class should be together
 * with the test case PHPUnit_Framework_MockObject_TestCase.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_Builder_InvocationMocker implements PHPUnit_Framework_MockObject_Builder_MethodNameMatch
{
    /**
     * @var PHPUnit_Framework_MockObject_Stub_MatcherCollection
     */
    protected $collection;

    /**
     * @var PHPUnit_Framework_MockObject_Matcher
     */
    protected $matcher;

    /**
     * @var string[]
     */
    private $configurableMethods = [];

    /**
     * @param PHPUnit_Framework_MockObject_Stub_MatcherCollection $collection
     * @param PHPUnit_Framework_MockObject_Matcher_Invocation     $invocationMatcher
     * @param array                                               $configurableMethods
     */
    public function __construct(PHPUnit_Framework_MockObject_Stub_MatcherCollection $collection, PHPUnit_Framework_MockObject_Matcher_Invocation $invocationMatcher, array $configurableMethods)
    {
        $this->collection = $collection;
        $this->matcher    = new PHPUnit_Framework_MockObject_Matcher(
            $invocationMatcher
        );

        $this->collection->addMatcher($this->matcher);

        $this->configurableMethods = $configurableMethods;
    }

    /**
     * @return PHPUnit_Framework_MockObject_Matcher
     */
    public function getMatcher()
    {
        return $this->matcher;
    }

    /**
     * @param mixed $id
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function id($id)
    {
        $this->collection->registerId($id, $this);

        return $this;
    }

    /**
     * @param PHPUnit_Framework_MockObject_Stub $stub
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function will(PHPUnit_Framework_MockObject_Stub $stub)
    {
        $this->matcher->stub = $stub;

        return $this;
    }

    /**
     * @param mixed $value
     * @param mixed $nextValues, ...
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willReturn($value, ...$nextValues)
    {
        $stub = count($nextValues) === 0 ?
            new PHPUnit_Framework_MockObject_Stub_Return($value) :
            new PHPUnit_Framework_MockObject_Stub_ConsecutiveCalls(
               array_merge([$value], $nextValues)
            );

        return $this->will($stub);
    }

    /**
     * @param mixed $reference
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willReturnReference(&$reference)
    {
        $stub = new PHPUnit_Framework_MockObject_Stub_ReturnReference($reference);

        return $this->will($stub);
    }

    /**
     * @param array $valueMap
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willReturnMap(array $valueMap)
    {
        $stub = new PHPUnit_Framework_MockObject_Stub_ReturnValueMap(
            $valueMap
        );

        return $this->will($stub);
    }

    /**
     * @param mixed $argumentIndex
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willReturnArgument($argumentIndex)
    {
        $stub = new PHPUnit_Framework_MockObject_Stub_ReturnArgument(
            $argumentIndex
        );

        return $this->will($stub);
    }

    /**
     * @param callable $callback
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willReturnCallback($callback)
    {
        $stub = new PHPUnit_Framework_MockObject_Stub_ReturnCallback(
            $callback
        );

        return $this->will($stub);
    }

    /**
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willReturnSelf()
    {
        $stub = new PHPUnit_Framework_MockObject_Stub_ReturnSelf;

        return $this->will($stub);
    }

    /**
     * @param mixed $values, ...
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willReturnOnConsecutiveCalls(...$values)
    {
        $stub = new PHPUnit_Framework_MockObject_Stub_ConsecutiveCalls($values);

        return $this->will($stub);
    }

    /**
     * @param Exception $exception
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function willThrowException(Exception $exception)
    {
        $stub = new PHPUnit_Framework_MockObject_Stub_Exception($exception);

        return $this->will($stub);
    }

    /**
     * @param mixed $id
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function after($id)
    {
        $this->matcher->afterMatchBuilderId = $id;

        return $this;
    }

    /**
     * Validate that a parameters matcher can be defined, throw exceptions otherwise.
     *
     * @throws PHPUnit_Framework_MockObject_RuntimeException
     */
    private function canDefineParameters()
    {
        if ($this->matcher->methodNameMatcher === null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                'Method name matcher is not defined, cannot define parameter ' .
                'matcher without one'
            );
        }

        if ($this->matcher->parametersMatcher !== null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                'Parameter matcher is already defined, cannot redefine'
            );
        }
    }

    /**
     * @param  array ...$arguments
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function with(...$arguments)
    {
        $this->canDefineParameters();

        $this->matcher->parametersMatcher = new PHPUnit_Framework_MockObject_Matcher_Parameters($arguments);

        return $this;
    }

    /**
     * @param  array ...$arguments
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function withConsecutive(...$arguments)
    {
        $this->canDefineParameters();

        $this->matcher->parametersMatcher = new PHPUnit_Framework_MockObject_Matcher_ConsecutiveParameters($arguments);

        return $this;
    }

    /**
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function withAnyParameters()
    {
        $this->canDefineParameters();

        $this->matcher->parametersMatcher = new PHPUnit_Framework_MockObject_Matcher_AnyParameters;

        return $this;
    }

    /**
     * @param PHPUnit_Framework_Constraint|string $constraint
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function method($constraint)
    {
        if ($this->matcher->methodNameMatcher !== null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                'Method name matcher is already defined, cannot redefine'
            );
        }

        if (is_string($constraint) && !in_array(strtolower($constraint), $this->configurableMethods)) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                sprintf(
                    'Trying to configure method "%s" which cannot be configured because it does not exist, has not been specified, is final, or is static',
                    $constraint
                )
            );
        }

        $this->matcher->methodNameMatcher = new PHPUnit_Framework_MockObject_Matcher_MethodName($constraint);

        return $this;
    }
}
