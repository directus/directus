<?php
/*
 * This file is part of the Comparator package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Comparator;

/**
 * Compares arrays for equality.
 */
class ArrayComparator extends Comparator
{
    /**
     * Returns whether the comparator can compare two values.
     *
     * @param  mixed $expected The first value to compare
     * @param  mixed $actual   The second value to compare
     * @return bool
     */
    public function accepts($expected, $actual)
    {
        return is_array($expected) && is_array($actual);
    }

    /**
     * Asserts that two values are equal.
     *
     * @param mixed $expected     First value to compare
     * @param mixed $actual       Second value to compare
     * @param float $delta        Allowed numerical distance between two values to consider them equal
     * @param bool  $canonicalize Arrays are sorted before comparison when set to true
     * @param bool  $ignoreCase   Case is ignored when set to true
     * @param array $processed    List of already processed elements (used to prevent infinite recursion)
     *
     * @throws ComparisonFailure
     */
    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false, array &$processed = array())
    {
        if ($canonicalize) {
            sort($expected);
            sort($actual);
        }

        $remaining = $actual;
        $expString = $actString = "Array (\n";
        $equal     = true;

        foreach ($expected as $key => $value) {
            unset($remaining[$key]);

            if (!array_key_exists($key, $actual)) {
                $expString .= sprintf(
                    "    %s => %s\n",
                    $this->exporter->export($key),
                    $this->exporter->shortenedExport($value)
                );

                $equal = false;

                continue;
            }

            try {
                $comparator = $this->factory->getComparatorFor($value, $actual[$key]);
                $comparator->assertEquals($value, $actual[$key], $delta, $canonicalize, $ignoreCase, $processed);

                $expString .= sprintf(
                    "    %s => %s\n",
                    $this->exporter->export($key),
                    $this->exporter->shortenedExport($value)
                );
                $actString .= sprintf(
                    "    %s => %s\n",
                    $this->exporter->export($key),
                    $this->exporter->shortenedExport($actual[$key])
                );
            } catch (ComparisonFailure $e) {
                $expString .= sprintf(
                    "    %s => %s\n",
                    $this->exporter->export($key),
                    $e->getExpectedAsString()
                    ? $this->indent($e->getExpectedAsString())
                    : $this->exporter->shortenedExport($e->getExpected())
                );

                $actString .= sprintf(
                    "    %s => %s\n",
                    $this->exporter->export($key),
                    $e->getActualAsString()
                    ? $this->indent($e->getActualAsString())
                    : $this->exporter->shortenedExport($e->getActual())
                );

                $equal = false;
            }
        }

        foreach ($remaining as $key => $value) {
            $actString .= sprintf(
                "    %s => %s\n",
                $this->exporter->export($key),
                $this->exporter->shortenedExport($value)
            );

            $equal = false;
        }

        $expString .= ')';
        $actString .= ')';

        if (!$equal) {
            throw new ComparisonFailure(
                $expected,
                $actual,
                $expString,
                $actString,
                false,
                'Failed asserting that two arrays are equal.'
            );
        }
    }

    protected function indent($lines)
    {
        return trim(str_replace("\n", "\n    ", $lines));
    }
}
