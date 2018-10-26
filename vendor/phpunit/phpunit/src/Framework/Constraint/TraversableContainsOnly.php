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
 * Constraint that asserts that the Traversable it is applied to contains
 * only values of a given type.
 */
class PHPUnit_Framework_Constraint_TraversableContainsOnly extends PHPUnit_Framework_Constraint
{
    /**
     * @var PHPUnit_Framework_Constraint
     */
    protected $constraint;

    /**
     * @var string
     */
    protected $type;

    /**
     * @param string $type
     * @param bool   $isNativeType
     */
    public function __construct($type, $isNativeType = true)
    {
        parent::__construct();

        if ($isNativeType) {
            $this->constraint = new PHPUnit_Framework_Constraint_IsType($type);
        } else {
            $this->constraint = new PHPUnit_Framework_Constraint_IsInstanceOf(
                $type
            );
        }

        $this->type = $type;
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
        $success = true;

        foreach ($other as $item) {
            if (!$this->constraint->evaluate($item, '', true)) {
                $success = false;
                break;
            }
        }

        if ($returnResult) {
            return $success;
        }

        if (!$success) {
            $this->fail($other, $description);
        }
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        return 'contains only values of type "' . $this->type . '"';
    }
}
