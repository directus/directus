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
 * Constraint that asserts that the string it is evaluated for ends with a given
 * suffix.
 */
class PHPUnit_Framework_Constraint_StringEndsWith extends PHPUnit_Framework_Constraint
{
    /**
     * @var string
     */
    protected $suffix;

    /**
     * @param string $suffix
     */
    public function __construct($suffix)
    {
        parent::__construct();
        $this->suffix = $suffix;
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
        return substr($other, 0 - strlen($this->suffix)) == $this->suffix;
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        return 'ends with "' . $this->suffix . '"';
    }
}
