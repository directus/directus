<?php
/*
 * This file is part of sebastian/diff.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\Diff\LCS;

/**
 * @covers SebastianBergmann\Diff\LCS\TimeEfficientImplementation
 */
class TimeEfficientImplementationTest extends LongestCommonSubsequenceTest
{
    protected function createImplementation()
    {
        return new TimeEfficientImplementation;
    }
}
