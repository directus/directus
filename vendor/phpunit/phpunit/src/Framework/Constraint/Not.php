<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * Logical NOT.
 */
class PHPUnit_Framework_Constraint_Not extends PHPUnit_Framework_Constraint
{
    /**
     * @var PHPUnit_Framework_Constraint
     */
    protected $constraint;

    /**
     * @param PHPUnit_Framework_Constraint $constraint
     */
    public function __construct($constraint)
    {
        parent::__construct();

        if (!($constraint instanceof PHPUnit_Framework_Constraint)) {
            $constraint = new PHPUnit_Framework_Constraint_IsEqual($constraint);
        }

        $this->constraint = $constraint;
    }

    /**
     * @param string $string
     *
     * @return string
     */
    public static function negate($string)
    {
        return str_replace(
            [
            'contains ',
            'exists',
            'has ',
            'is ',
            'are ',
            'matches ',
            'starts with ',
            'ends with ',
            'reference ',
            'not not '
            ],
            [
            'does not contain ',
            'does not exist',
            'does not have ',
            'is not ',
            'are not ',
            'does not match ',
            'starts not with ',
            'ends not with ',
            'don\'t reference ',
            'not '
            ],
            $string
        );
    }

    /**
     * Evaluates the constraint for parameter $other
     *
     * If $returnResult is set to false (the default), an exception is thrown
     * in case of a failure. null is returned otherwise.
     *
     * If $returnResult is true, the result of the evaluation is returned as
     * a boolean value instead: true in case of success, false in case of a
     * failure.
     *
     * @param mixed  $other        Value or object to evaluate.
     * @param string $description  Additional information about the test
     * @param bool   $returnResult Whether to return a result or throw an exception
     *
     * @return mixed
     *
     * @throws PHPUnit_Framework_ExpectationFailedException
     */
    public function evaluate($other, $description = '', $returnResult = false)
    {
        $success = !$this->constraint->evaluate($other, $description, true);

        if ($returnResult) {
            return $success;
        }

        if (!$success) {
            $this->fail($other, $description);
        }
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
        switch (get_class($this->constraint)) {
            case 'PHPUnit_Framework_Constraint_And':
            case 'PHPUnit_Framework_Constraint_Not':
            case 'PHPUnit_Framework_Constraint_Or':
                return 'not( ' . $this->constraint->failureDescription($other) . ' )';

            default:
                return self::negate(
                    $this->constraint->failureDescription($other)
                );
        }
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        switch (get_class($this->constraint)) {
            case 'PHPUnit_Framework_Constraint_And':
            case 'PHPUnit_Framework_Constraint_Not':
            case 'PHPUnit_Framework_Constraint_Or':
                return 'not( ' . $this->constraint->toString() . ' )';

            default:
                return self::negate(
                    $this->constraint->toString()
                );
        }
    }

    /**
     * Counts the number of constraint elements.
     *
     * @return int
     */
    public function count()
    {
        return count($this->constraint);
    }
}
