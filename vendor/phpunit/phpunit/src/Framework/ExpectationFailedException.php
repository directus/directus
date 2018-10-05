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
 * Exception for expectations which failed their check.
 *
 * The exception contains the error message and optionally a
 * SebastianBergmann\Comparator\ComparisonFailure which is used to
 * generate diff output of the failed expectations.
 */
class PHPUnit_Framework_ExpectationFailedException extends PHPUnit_Framework_AssertionFailedError
{
    /**
     * @var SebastianBergmann\Comparator\ComparisonFailure
     */
    protected $comparisonFailure;

    public function __construct($message, SebastianBergmann\Comparator\ComparisonFailure $comparisonFailure = null, Exception $previous = null)
    {
        $this->comparisonFailure = $comparisonFailure;

        parent::__construct($message, 0, $previous);
    }

    /**
     * @return SebastianBergmann\Comparator\ComparisonFailure
     */
    public function getComparisonFailure()
    {
        return $this->comparisonFailure;
    }
}
