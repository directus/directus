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
 * Main matcher which defines a full expectation using method, parameter and
 * invocation matchers.
 * This matcher encapsulates all the other matchers and allows the builder to
 * set the specific matchers when the appropriate methods are called (once(),
 * where() etc.).
 *
 * All properties are public so that they can easily be accessed by the builder.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_Matcher implements PHPUnit_Framework_MockObject_Matcher_Invocation
{
    /**
     * @var PHPUnit_Framework_MockObject_Matcher_Invocation
     */
    public $invocationMatcher;

    /**
     * @var mixed
     */
    public $afterMatchBuilderId = null;

    /**
     * @var bool
     */
    public $afterMatchBuilderIsInvoked = false;

    /**
     * @var PHPUnit_Framework_MockObject_Matcher_MethodName
     */
    public $methodNameMatcher = null;

    /**
     * @var PHPUnit_Framework_MockObject_Matcher_Parameters
     */
    public $parametersMatcher = null;

    /**
     * @var PHPUnit_Framework_MockObject_Stub
     */
    public $stub = null;

    /**
     * @param PHPUnit_Framework_MockObject_Matcher_Invocation $invocationMatcher
     */
    public function __construct(PHPUnit_Framework_MockObject_Matcher_Invocation $invocationMatcher)
    {
        $this->invocationMatcher = $invocationMatcher;
    }

    /**
     * @return string
     */
    public function toString()
    {
        $list = [];

        if ($this->invocationMatcher !== null) {
            $list[] = $this->invocationMatcher->toString();
        }

        if ($this->methodNameMatcher !== null) {
            $list[] = 'where ' . $this->methodNameMatcher->toString();
        }

        if ($this->parametersMatcher !== null) {
            $list[] = 'and ' . $this->parametersMatcher->toString();
        }

        if ($this->afterMatchBuilderId !== null) {
            $list[] = 'after ' . $this->afterMatchBuilderId;
        }

        if ($this->stub !== null) {
            $list[] = 'will ' . $this->stub->toString();
        }

        return implode(' ', $list);
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     *
     * @return mixed
     */
    public function invoked(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        if ($this->invocationMatcher === null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                'No invocation matcher is set'
            );
        }

        if ($this->methodNameMatcher === null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException('No method matcher is set');
        }

        if ($this->afterMatchBuilderId !== null) {
            $builder = $invocation->object
                                  ->__phpunit_getInvocationMocker()
                                  ->lookupId($this->afterMatchBuilderId);

            if (!$builder) {
                throw new PHPUnit_Framework_MockObject_RuntimeException(
                    sprintf(
                        'No builder found for match builder identification <%s>',
                        $this->afterMatchBuilderId
                    )
                );
            }

            $matcher = $builder->getMatcher();

            if ($matcher && $matcher->invocationMatcher->hasBeenInvoked()) {
                $this->afterMatchBuilderIsInvoked = true;
            }
        }

        $this->invocationMatcher->invoked($invocation);

        try {
            if ($this->parametersMatcher !== null &&
                !$this->parametersMatcher->matches($invocation)) {
                $this->parametersMatcher->verify();
            }
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            throw new PHPUnit_Framework_ExpectationFailedException(
                sprintf(
                    "Expectation failed for %s when %s\n%s",
                    $this->methodNameMatcher->toString(),
                    $this->invocationMatcher->toString(),
                    $e->getMessage()
                ),
                $e->getComparisonFailure()
            );
        }

        if ($this->stub) {
            return $this->stub->invoke($invocation);
        }

        return $invocation->generateReturnValue();
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     *
     * @return bool
     */
    public function matches(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        if ($this->afterMatchBuilderId !== null) {
            $builder = $invocation->object
                                  ->__phpunit_getInvocationMocker()
                                  ->lookupId($this->afterMatchBuilderId);

            if (!$builder) {
                throw new PHPUnit_Framework_MockObject_RuntimeException(
                    sprintf(
                        'No builder found for match builder identification <%s>',
                        $this->afterMatchBuilderId
                    )
                );
            }

            $matcher = $builder->getMatcher();

            if (!$matcher) {
                return false;
            }

            if (!$matcher->invocationMatcher->hasBeenInvoked()) {
                return false;
            }
        }

        if ($this->invocationMatcher === null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                'No invocation matcher is set'
            );
        }

        if ($this->methodNameMatcher === null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException('No method matcher is set');
        }

        if (!$this->invocationMatcher->matches($invocation)) {
            return false;
        }

        try {
            if (!$this->methodNameMatcher->matches($invocation)) {
                return false;
            }
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            throw new PHPUnit_Framework_ExpectationFailedException(
                sprintf(
                    "Expectation failed for %s when %s\n%s",
                    $this->methodNameMatcher->toString(),
                    $this->invocationMatcher->toString(),
                    $e->getMessage()
                ),
                $e->getComparisonFailure()
            );
        }

        return true;
    }

    /**
     * @throws PHPUnit_Framework_MockObject_RuntimeException
     * @throws PHPUnit_Framework_ExpectationFailedException
     */
    public function verify()
    {
        if ($this->invocationMatcher === null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                'No invocation matcher is set'
            );
        }

        if ($this->methodNameMatcher === null) {
            throw new PHPUnit_Framework_MockObject_RuntimeException('No method matcher is set');
        }

        try {
            $this->invocationMatcher->verify();

            if ($this->parametersMatcher === null) {
                $this->parametersMatcher = new PHPUnit_Framework_MockObject_Matcher_AnyParameters;
            }

            $invocationIsAny   = $this->invocationMatcher instanceof PHPUnit_Framework_MockObject_Matcher_AnyInvokedCount;
            $invocationIsNever = $this->invocationMatcher instanceof PHPUnit_Framework_MockObject_Matcher_InvokedCount && $this->invocationMatcher->isNever();

            if (!$invocationIsAny && !$invocationIsNever) {
                $this->parametersMatcher->verify();
            }
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            throw new PHPUnit_Framework_ExpectationFailedException(
                sprintf(
                    "Expectation failed for %s when %s.\n%s",
                    $this->methodNameMatcher->toString(),
                    $this->invocationMatcher->toString(),
                    PHPUnit_Framework_TestFailure::exceptionToString($e)
                )
            );
        }
    }

    /**
     * @since Method available since Release 1.2.4
     */
    public function hasMatchers()
    {
        if ($this->invocationMatcher !== null &&
            !$this->invocationMatcher instanceof PHPUnit_Framework_MockObject_Matcher_AnyInvokedCount) {
            return true;
        }

        return false;
    }
}
