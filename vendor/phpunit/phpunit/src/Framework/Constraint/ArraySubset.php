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
 * Constraint that asserts that the array it is evaluated for has a specified subset.
 *
 * Uses array_replace_recursive() to check if a key value subset is part of the
 * subject array.
 */
class PHPUnit_Framework_Constraint_ArraySubset extends PHPUnit_Framework_Constraint
{
    /**
     * @var array|Traversable
     */
    protected $subset;

    /**
     * @var bool
     */
    protected $strict;

    /**
     * @param array|Traversable $subset
     * @param bool              $strict Check for object identity
     */
    public function __construct($subset, $strict = false)
    {
        parent::__construct();
        $this->strict = $strict;
        $this->subset = $subset;
    }

    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param array|Traversable $other Array or Traversable object to evaluate.
     *
     * @return bool
     */
    protected function matches($other)
    {
        //type cast $other & $this->subset as an array to allow
        //support in standard array functions.
        $other        = $this->toArray($other);
        $this->subset = $this->toArray($this->subset);

        $patched = array_replace_recursive($other, $this->subset);

        if ($this->strict) {
            return $other === $patched;
        } else {
            return $other == $patched;
        }
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        return 'has the subset ' . $this->exporter->export($this->subset);
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
        return 'an array ' . $this->toString();
    }

    /**
     * @param array|Traversable $other
     *
     * @return array
     */
    private function toArray($other)
    {
        if (is_array($other)) {
            return $other;
        } elseif ($other instanceof ArrayObject) {
            return $other->getArrayCopy();
        } elseif ($other instanceof Traversable) {
            return iterator_to_array($other);
        }

        // Keep BC even if we know that array would not be the expected one
        return (array) $other;
    }
}
