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
 * Mocker for invocations which are sent from
 * PHPUnit_Framework_MockObject_MockObject objects.
 *
 * Keeps track of all expectations and stubs as well as registering
 * identifications for builders.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_InvocationMocker implements PHPUnit_Framework_MockObject_Stub_MatcherCollection, PHPUnit_Framework_MockObject_Invokable, PHPUnit_Framework_MockObject_Builder_Namespace
{
    /**
     * @var PHPUnit_Framework_MockObject_Matcher_Invocation[]
     */
    protected $matchers = [];

    /**
     * @var PHPUnit_Framework_MockObject_Builder_Match[]
     */
    protected $builderMap = [];

    /**
     * @var string[]
     */
    private $configurableMethods = [];

    /**
     * @param array $configurableMethods
     */
    public function __construct(array $configurableMethods)
    {
        $this->configurableMethods = $configurableMethods;
    }

    /**
     * @param PHPUnit_Framework_MockObject_Matcher_Invocation $matcher
     */
    public function addMatcher(PHPUnit_Framework_MockObject_Matcher_Invocation $matcher)
    {
        $this->matchers[] = $matcher;
    }

    /**
     * @since Method available since Release 1.1.0
     */
    public function hasMatchers()
    {
        foreach ($this->matchers as $matcher) {
            if ($matcher->hasMatchers()) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param mixed $id
     *
     * @return bool|null
     */
    public function lookupId($id)
    {
        if (isset($this->builderMap[$id])) {
            return $this->builderMap[$id];
        }

        return;
    }

    /**
     * @param mixed                                      $id
     * @param PHPUnit_Framework_MockObject_Builder_Match $builder
     *
     * @throws PHPUnit_Framework_MockObject_RuntimeException
     */
    public function registerId($id, PHPUnit_Framework_MockObject_Builder_Match $builder)
    {
        if (isset($this->builderMap[$id])) {
            throw new PHPUnit_Framework_MockObject_RuntimeException(
                'Match builder with id <' . $id . '> is already registered.'
            );
        }

        $this->builderMap[$id] = $builder;
    }

    /**
     * @param PHPUnit_Framework_MockObject_Matcher_Invocation $matcher
     *
     * @return PHPUnit_Framework_MockObject_Builder_InvocationMocker
     */
    public function expects(PHPUnit_Framework_MockObject_Matcher_Invocation $matcher)
    {
        return new PHPUnit_Framework_MockObject_Builder_InvocationMocker(
            $this,
            $matcher,
            $this->configurableMethods
        );
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     *
     * @return mixed
     *
     * @throws Exception
     */
    public function invoke(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        $exception      = null;
        $hasReturnValue = false;
        $returnValue    = null;

        foreach ($this->matchers as $match) {
            try {
                if ($match->matches($invocation)) {
                    $value = $match->invoked($invocation);

                    if (!$hasReturnValue) {
                        $returnValue    = $value;
                        $hasReturnValue = true;
                    }
                }
            } catch (Exception $e) {
                $exception = $e;
            }
        }

        if ($exception !== null) {
            throw $exception;
        }

        if ($hasReturnValue) {
            return $returnValue;
        } elseif (strtolower($invocation->methodName) == '__tostring') {
            return '';
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
        foreach ($this->matchers as $matcher) {
            if (!$matcher->matches($invocation)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return bool
     */
    public function verify()
    {
        foreach ($this->matchers as $matcher) {
            $matcher->verify();
        }
    }
}
