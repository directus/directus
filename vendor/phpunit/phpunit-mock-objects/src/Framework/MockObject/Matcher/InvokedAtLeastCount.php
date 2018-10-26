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
 * Invocation matcher which checks if a method has been invoked at least
 * N times.
 *
 * @since Class available since Release 2.2.0
 */
class PHPUnit_Framework_MockObject_Matcher_InvokedAtLeastCount extends PHPUnit_Framework_MockObject_Matcher_InvokedRecorder
{
    /**
     * @var int
     */
    private $requiredInvocations;

    /**
     * @param int $requiredInvocations
     */
    public function __construct($requiredInvocations)
    {
        $this->requiredInvocations = $requiredInvocations;
    }

    /**
     * @return string
     */
    public function toString()
    {
        return 'invoked at least ' . $this->requiredInvocations . ' times';
    }

    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws PHPUnit_Framework_ExpectationFailedException
     */
    public function verify()
    {
        $count = $this->getInvocationCount();

        if ($count < $this->requiredInvocations) {
            throw new PHPUnit_Framework_ExpectationFailedException(
                'Expected invocation at least ' . $this->requiredInvocations .
                ' times but it occurred ' . $count . ' time(s).'
            );
        }
    }
}
