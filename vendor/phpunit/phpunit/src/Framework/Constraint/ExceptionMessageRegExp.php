<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class PHPUnit_Framework_Constraint_ExceptionMessageRegExp extends PHPUnit_Framework_Constraint
{
    /**
     * @var int
     */
    protected $expectedMessageRegExp;

    /**
     * @param string $expected
     */
    public function __construct($expected)
    {
        parent::__construct();
        $this->expectedMessageRegExp = $expected;
    }

    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param Exception $other
     *
     * @return bool
     */
    protected function matches($other)
    {
        $match = PHPUnit_Util_Regex::pregMatchSafe($this->expectedMessageRegExp, $other->getMessage());

        if (false === $match) {
            throw new PHPUnit_Framework_Exception(
                "Invalid expected exception message regex given: '{$this->expectedMessageRegExp}'"
            );
        }

        return 1 === $match;
    }

    /**
     * Returns the description of the failure
     *
     * The beginning of failure messages is "Failed asserting that" in most
     * cases. This method should return the second part of that sentence.
     *
     * @param mixed $other Evaluated value or object.
     *
     * @return string
     */
    protected function failureDescription($other)
    {
        return sprintf(
            "exception message '%s' matches '%s'",
            $other->getMessage(),
            $this->expectedMessageRegExp
        );
    }

    /**
     * @return string
     */
    public function toString()
    {
        return 'exception message matches ';
    }
}
