<?php
/*
 * This file is part of the php-code-coverage package.
 *
 * (c) Sebastian Bergmann <sebastian@phpunit.de>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace SebastianBergmann\CodeCoverage;

/**
 * Utility methods.
 */
class Util
{
    /**
     * @param float $a
     * @param float $b
     * @param bool  $asString
     * @param bool  $fixedWidth
     *
     * @return float|int|string
     */
    public static function percent($a, $b, $asString = false, $fixedWidth = false)
    {
        if ($asString && $b == 0) {
            return '';
        }

        if ($b > 0) {
            $percent = ($a / $b) * 100;
        } else {
            $percent = 100;
        }

        if ($asString) {
            if ($fixedWidth) {
                return sprintf('%6.2F%%', $percent);
            }

            return sprintf('%01.2F%%', $percent);
        } else {
            return $percent;
        }
    }
}
