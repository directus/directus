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
 * Invocation matcher which checks if a method was invoked at a certain index.
 *
 * If the expected index number does not match the current invocation index it
 * will not match which means it skips all method and parameter matching. Only
 * once the index is reached will the method and parameter start matching and
 * verifying.
 *
 * If the index is never reached it will throw an exception in index.
 *
 * @since Class available since Release 1.0.0
 */
class PHPUnit_Framework_MockObject_Matcher_InvokedAtIndex implements PHPUnit_Framework_MockObject_Matcher_Invocation
{
    /**
     * @var int
     */
    protected $sequenceIndex;

    /**
     * @var int
     */
    protected $currentIndex = -1;

    /**
     * @param int $sequenceIndex
     */
    public function __construct($sequenceIndex)
    {
        $this->sequenceIndex = $sequenceIndex;
    }

    /**
     * @return string
     */
    public function toString()
    {
        return 'invoked at sequence index ' . $this->sequenceIndex;
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     *
     * @return bool
     */
    public function matches(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
        $this->currentIndex++;

        return $this->currentIndex == $this->sequenceIndex;
    }

    /**
     * @param PHPUnit_Framework_MockObject_Invocation $invocation
     */
    public function invoked(PHPUnit_Framework_MockObject_Invocation $invocation)
    {
    }

    /**
     * Verifies that the current expectation is valid. If everything is OK the
     * code should just return, if not it must throw an exception.
     *
     * @throws PHPUnit_Framework_ExpectationFailedException
     */
    public function verify()
    {
        if ($this->currentIndex < $this->sequenceIndex) {
            throw new PHPUnit_Framework_ExpectationFailedException(
                sprintf(
                    'The expected invocation at index %s was never reached.',
                    $this->sequenceIndex
                )
            );
        }
    }
}
