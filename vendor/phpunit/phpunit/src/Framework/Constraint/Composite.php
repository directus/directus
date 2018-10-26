<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

abstract class PHPUnit_Framework_Constraint_Composite extends PHPUnit_Framework_Constraint
{
    /**
     * @var PHPUnit_Framework_Constraint
     */
    protected $innerConstraint;

    /**
     * @param PHPUnit_Framework_Constraint $innerConstraint
     */
    public function __construct(PHPUnit_Framework_Constraint $innerConstraint)
    {
        parent::__construct();
        $this->innerConstraint = $innerConstraint;
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
        try {
            return $this->innerConstraint->evaluate(
                $other,
                $description,
                $returnResult
            );
        } catch (PHPUnit_Framework_ExpectationFailedException $e) {
            $this->fail($other, $description);
        }
    }

    /**
     * Counts the number of constraint elements.
     *
     * @return int
     */
    public function count()
    {
        return count($this->innerConstraint);
    }
}
