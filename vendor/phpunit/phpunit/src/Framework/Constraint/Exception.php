<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class PHPUnit_Framework_Constraint_Exception extends PHPUnit_Framework_Constraint
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
        return $other instanceof $this->className;
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
        if ($other !== null) {
            $message = '';
            if ($other instanceof Exception || $other instanceof Throwable) {
                $message = '. Message was: "' . $other->getMessage() . '" at'
                        . "\n" . PHPUnit_Util_Filter::getFilteredStacktrace($other);
            }

            return sprintf(
                'exception of type "%s" matches expected exception "%s"%s',
                get_class($other),
                $this->className,
                $message
            );
        }

        return sprintf(
            'exception of type "%s" is thrown',
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
            'exception of type "%s"',
            $this->className
        );
    }
}
