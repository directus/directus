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
 * a given value.
 */
class PHPUnit_Framework_Constraint_TraversableContains extends PHPUnit_Framework_Constraint
{
    /**
     * @var bool
     */
    protected $checkForObjectIdentity;

    /**
     * @var bool
     */
    protected $checkForNonObjectIdentity;

    /**
     * @var mixed
     */
    protected $value;

    /**
     * @param mixed $value
     * @param bool  $checkForObjectIdentity
     * @param bool  $checkForNonObjectIdentity
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function __construct($value, $checkForObjectIdentity = true, $checkForNonObjectIdentity = false)
    {
        parent::__construct();

        if (!is_bool($checkForObjectIdentity)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(2, 'boolean');
        }

        if (!is_bool($checkForNonObjectIdentity)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(3, 'boolean');
        }

        $this->checkForObjectIdentity    = $checkForObjectIdentity;
        $this->checkForNonObjectIdentity = $checkForNonObjectIdentity;
        $this->value                     = $value;
    }

    /**
     * Evaluates the constraint for parameter $other. Returns true if the
     * constraint is met, false otherwise.
     *
     * @param mixed $other Value or object to evaluate.
     *
     * @return bool
     */
    protected function matches($other)
    {
        if ($other instanceof SplObjectStorage) {
            return $other->contains($this->value);
        }

        if (is_object($this->value)) {
            foreach ($other as $element) {
                if ($this->checkForObjectIdentity && $element === $this->value) {
                    return true;
                } elseif (!$this->checkForObjectIdentity && $element == $this->value) {
                    return true;
                }
            }
        } else {
            foreach ($other as $element) {
                if ($this->checkForNonObjectIdentity && $element === $this->value) {
                    return true;
                } elseif (!$this->checkForNonObjectIdentity && $element == $this->value) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        if (is_string($this->value) && strpos($this->value, "\n") !== false) {
            return 'contains "' . $this->value . '"';
        } else {
            return 'contains ' . $this->exporter->export($this->value);
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
        return sprintf(
            '%s %s',
            is_array($other) ? 'an array' : 'a traversable',
            $this->toString()
        );
    }
}
