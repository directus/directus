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
 * Constraint that asserts that the object it is evaluated for is an instance
 * of a given class.
 *
 * The expected class name is passed in the constructor.
 */
class PHPUnit_Framework_Constraint_IsInstanceOf extends PHPUnit_Framework_Constraint
{
    /**
     * @var string
     */
    protected $className;

    /**
     * @param string $className
     */
    public function __construct($className)
    {
        parent::__construct();
        $this->className = $className;
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
        return ($other instanceof $this->className);
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
            '%s is an instance of %s "%s"',
            $this->exporter->shortenedExport($other),
            $this->getType(),
            $this->className
        );
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        return sprintf(
            'is instance of %s "%s"',
            $this->getType(),
            $this->className
        );
    }

    private function getType()
    {
        try {
            $reflection = new ReflectionClass($this->className);
            if ($reflection->isInterface()) {
                return 'interface';
            }
        } catch (ReflectionException $e) {
        }

        return 'class';
    }
}
