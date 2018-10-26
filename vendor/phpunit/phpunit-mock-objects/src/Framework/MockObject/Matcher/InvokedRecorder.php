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
 * Records invocations and provides convenience methods for checking them later
 * on.
 * This abstract class can be implemented by matchers which needs to check the
 * number of times an invocation has occurred.
 *
 * @since Class available since Release 1.0.0
 * @abstract
 */
abstract class PHPUnit_Framework_MockObject_Matcher_InvokedRecorder implements PHPUnit_Framework_MockObject_Matcher_Invocation
{
    /**
     * @var PHPUnit_Framework_MockObject_Invocation[]
     */
    protected $invocations = [];

    /**
     * @return int
     */
    public function getInvocationCount()
    {
        return count($this->invocations);
    }

    /**
     * @return PHPUnit_Framework_MockObject_Invocation[]
     */
    public function getInvocations()
    {
        return $this->invocations;
    }

    /**
     * @return bool
     */
    public function hasBeenInvoked()
    {
        return count($this->invocations) > 0;
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     */
    public function invoked(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        $this->invocations[] = $invocation;
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     *
     * @return bool
     */
    public function matches(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        return true;
    }
}
