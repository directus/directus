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
 * Asserts whether or not two JSON objects are equal.
 */
class PHPUnit_Framework_Constraint_JsonMatches extends PHPUnit_Framework_Constraint
{
    /**
     * @var string
     */
    protected $value;

    /**
     * Creates a new constraint.
     *
     * @param string $value
     */
    public function __construct($value)
    {
        parent::__construct();
        $this->value = $value;
    }

    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * This method can be overridden to implement the evaluation algorithm.
     *
     * @param mixed $other Value or object to evaluate.
     *
     * @return bool
     */
    protected function matches($other)
    {
        $decodedOther = json_decode($other);
        if (json_last_error()) {
            return false;
        }

        $decodedValue = json_decode($this->value);
        if (json_last_error()) {
            return false;
        }

        return $decodedOther == $decodedValue;
    }

    /**
     * Returns a string representation of the object.
     *
     * @return string
     */
    public function toString()
    {
        return sprintf(
            'matches JSON string "%s"',
            $this->value
        );
    }
}
