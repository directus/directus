<?php

/*
 * This file is part of the Prophecy.
 * (c) Konstantin Kudryashov <ever.zet@gmail.com>
 *     Marcello Duarte <marcello.duarte@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Prophecy\Comparator;

use SebastianBergmann\Comparator\Comparator;
use SebastianBergmann\Comparator\ComparisonFailure;

/**
 * Closure comparator.
 *
 * @author Konstantin Kudryashov <ever.zet@gmail.com>
 */
final class ClosureComparator extends Comparator
{
    public function accepts($expected, $actual)
    {
        return is_object($expected) && $expected instanceof \Closure
            && is_object($actual) && $actual instanceof \Closure;
    }

    public function assertEquals($expected, $actual, $delta = 0.0, $canonicalize = false, $ignoreCase = false)
    {
        throw new ComparisonFailure(
            $expected,
            $actual,
            // we don't need a diff
            '',
            '',
            false,
            'all closures are born different'
        );
    }
}
