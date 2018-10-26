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
 * Invocation matcher which checks if a method has been invoked a certain amount
 * of times.
 * If the number of invocations exceeds the value it will immediately throw an
 * exception,
 * If the number is less it will later be checked in verify() and also throw an
 * exception.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_Matcher_InvokedCount extends PHPUnit_Framework_MockObject_Matcher_InvokedRecorder
{
    /**
     * @var int
     */
    protected $expectedCount;

    /**
     * @param int $expectedCount
     */
    public function __construct($expectedCount)
    {
        $this->expectedCount = $expectedCount;
    }

    /**
     * @return bool
     */
    public function isNever()
    {
        return $this->expectedCount == 0;
    }

    /**
     * @return string
     */
    public function toString()
    {
        return 'invoked ' . $this->expectedCount . ' time(s)';
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     *
     * @throws PHPUnit_Framework_ExpectationFailedException
     */
    public function invoked(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        parent::invoked($invocation);

        $count = $this->getInvocationCount();

        if ($count > $this->expectedCount) {
            $message = $invocation->toString() . ' ';

            switch ($this->expectedCount) {
                case 0: {
                    $message .= 'was not expected to be called.';
                }
                break;

                case 1: {
                    $message .= 'was not expected to be called more than once.';
                }
                break;

                default: {
                    $message .= sprintf(
                        'was not expected to be called more than %d times.',
                        $this->expectedCount
                    );
                    }
            }

            throw new PHPUnit_Framework_ExpectationFailedException($message);
        }
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

        if ($count !== $this->expectedCount) {
            throw new PHPUnit_Framework_ExpectationFailedException(
                sprintf(
                    'Method was expected to be called %d times, ' .
                    'actually called %d times.',
                    $this->expectedCount,
                    $count
                )
            );
        }
    }
}
