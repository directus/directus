<?php
/*
 * This file is part of PHPUnit.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use SebastianBergmann\Exporter\Exporter;

/**
 * Abstract base class for constraints which can be applied to any value.
 */
abstract class PHPUnit_Framework_Constraint implements Countable, PHPUnit_Framework_SelfDescribing
{
    protected $exporter;

    public function __construct()
    {
        $this->exporter = new Exporter;
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
        $success = false;

        if ($this->matches($other)) {
            $success = true;
        }

        if ($returnResult) {
            return $success;
        }

        if (!$success) {
            $this->fail($other, $description);
        }
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
        return false;
    }

    /**
     * Counts the number of constraint elements.
     *
     * @return int
     */
    public function count()
    {
        return 1;
    }

    /**
     * Throws an exception for the given compared value and test description
     *
     * @param mixed                                          $other             Evaluated value or object.
     * @param string                                         $description       Additional information about the test
     * @param SebastianBergmann\Comparator\ComparisonFailure $comparisonFailure
     *
     * @throws PHPUnit_Framework_ExpectationFailedException
     */
    protected function fail($other, $description, SebastianBergmann\Comparator\ComparisonFailure $comparisonFailure = null)
    {
        $failureDescription = sprintf(
            'Failed asserting that %s.',
            $this->failureDescription($other)
        );

        $additionalFailureDescription = $this->additionalFailureDescription($other);

        if ($additionalFailureDescription) {
            $failureDescription .= "\n" . $additionalFailureDescription;
        }

        if (!empty($description)) {
            $failureDescription = $description . "\n" . $failureDescription;
        }

        throw new PHPUnit_Framework_ExpectationFailedException(
            $failureDescription,
            $comparisonFailure
        );
    }

    /**
     * Return additional failure description where needed
     *
     * The function can be overridden to provide additional failure
     * information like a diff
     *
     * @param mixed $other Evaluated value or object.
     *
     * @return string
     */
    protected function additionalFailureDescription($other)
    {
        return '';
    }

    /**
     * Returns the description of the failure
     *
     * The beginning of failure messages is "Failed asserting that" in most
     * cases. This method should return the second part of that sentence.
     *
     * To provide additional failure information additionalFailureDescription
     * can be used.
     *
     * @param mixed $other Evaluated value or object.
     *
     * @return string
     */
    protected function failureDescription($other)
    {
        return $this->exporter->export($other) . ' ' . $this->toString();
    }
}
