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
 * Constraint that checks if one value is equal to another.
 *
 * Equality is checked with PHP's == operator, the operator is explained in
 * detail at {@url http://www.php.net/manual/en/types.comparisons.php}.
 * Two values are equal if they have the same value disregarding type.
 *
 * The expected value is passed in the constructor.
 */
class PHPUnit_Framework_Constraint_IsEqual extends PHPUnit_Framework_Constraint
{
    /**
     * @var mixed
     */
    protected $value;

    /**
     * @var float
     */
    protected $delta = 0.0;

    /**
     * @var int
     */
    protected $maxDepth = 10;

    /**
     * @var bool
     */
    protected $canonicalize = false;

    /**
     * @var bool
     */
    protected $ignoreCase = false;

    /**
     * @var SebastianBergmann\Comparator\ComparisonFailure
     */
    protected $lastFailure;

    /**
     * @param mixed $value
     * @param float $delta
     * @param int   $maxDepth
     * @param bool  $canonicalize
     * @param bool  $ignoreCase
     *
     * @throws PHPUnit_Framework_Exception
     */
    public function __construct($value, $delta = 0.0, $maxDepth = 10, $canonicalize = false, $ignoreCase = false)
    {
        parent::__construct();

        if (!is_numeric($delta)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(2, 'numeric');
        }

        if (!is_int($maxDepth)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(3, 'integer');
        }

        if (!is_bool($canonicalize)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(4, 'boolean');
        }

        if (!is_bool($ignoreCase)) {
            throw PHPUnit_Util_InvalidArgumentHelper::factory(5, 'boolean');
        }

        $this->value        = $value;
        $this->delta        = $delta;
        $this->maxDepth     = $maxDepth;
        $this->canonicalize = $canonicalize;
        $this->ignoreCase   = $ignoreCase;
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
        // If $this->value and $other are identical, they are also equal.
        // This is the most common path and will allow us to skip
        // initialization of all the comparators.
        if ($this->value === $other) {
            return true;
        }

        $comparatorFactory = SebastianBergmann\Comparator\Factory::getInstance();

        try {
            $comparator = $comparatorFactory->getComparatorFor(
                $this->value,
                $other
            );

            $comparator->assertEquals(
                $this->value,
                $other,
                $this->delta,
                $this->canonicalize,
                $this->ignoreCase
            );
        } catch (SebastianBergmann\Comparator\ComparisonFailure $f) {
            if ($returnResult) {
                return false;
            }

            throw new PHPUnit_Framework_ExpectationFailedException(
                trim($description . "\n" . $f->getMessage()),
                $f
            );
        }

        return true;
    }

    /**
     * Returns a string representation of the constraint.
     *
     * @return string
     */
    public function toString()
    {
        $delta = '';

        if (is_string($this->value)) {
            if (strpos($this->value, "\n") !== false) {
                return 'is equal to <text>';
            } else {
                return sprintf(
                    'is equal to <string:%s>',
                    $this->value
                );
            }
        } else {
            if ($this->delta != 0) {
                $delta = sprintf(
                    ' with delta <%F>',
                    $this->delta
                );
            }

            return sprintf(
                'is equal to %s%s',
                $this->exporter->export($this->value),
                $delta
            );
        }
    }
}
