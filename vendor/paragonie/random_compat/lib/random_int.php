<?php

if (!is_callable('random_int')) {
    /**
     * Random_* Compatibility Library
     * for using the new PHP 7 random_* API in PHP 5 projects
     *
     * The MIT License (MIT)
     *
     * Copyright (c) 2015 - 2018 Paragon Initiative Enterprises
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
     * SOFTWARE.
     */

    /**
     * Fetch a random integer between $min and $max inclusive
     *
     * @param int $min
     * @param int $max
     *
     * @throws Exception
     *
     * @return int
     */
    function random_int($min, $max)
    {
        /**
         * Type and input logic checks
         *
         * If you pass it a float in the range (~PHP_INT_MAX, PHP_INT_MAX)
         * (non-inclusive), it will sanely cast it to an int. If you it's equal to
         * ~PHP_INT_MAX or PHP_INT_MAX, we let it fail as not an integer. Floats
         * lose precision, so the <= and => operators might accidentally let a float
         * through.
         */

        try {
            /** @var int $min */
            $min = RandomCompat_intval($min);
        } catch (TypeError $ex) {
            throw new TypeError(
                'random_int(): $min must be an integer'
            );
        }

        try {
            /** @var int $max */
            $max = RandomCompat_intval($max);
        } catch (TypeError $ex) {
            throw new TypeError(
                'random_int(): $max must be an integer'
            );
        }

        /**
         * Now that we've verified our weak typing system has given us an integer,
         * let's validate the logic then we can move forward with generating random
         * integers along a given range.
         */
        if ($min > $max) {
            throw new Error(
                'Minimum value must be less than or equal to the maximum value'
            );
        }

        if ($max === $min) {
            return (int) $min;
        }

        /**
         * Initialize variables to 0
         *
         * We want to store:
         * $bytes => the number of random bytes we need
         * $mask => an integer bitmask (for use with the &) operator
         *          so we can minimize the number of discards
         */
        $attempts = $bits = $bytes = $mask = $valueShift = 0;
        /** @var int $attempts */
        /** @var int $bits */
        /** @var int $bytes */
        /** @var int $mask */
        /** @var int $valueShift */

        /**
         * At this point, $range is a positive number greater than 0. It might
         * overflow, however, if $max - $min > PHP_INT_MAX. PHP will cast it to
         * a float and we will lose some precision.
         *
         * @var int|float $range
         */
        $range = $max - $min;

        /**
         * Test for integer overflow:
         */
        if (!is_int($range)) {

            /**
             * Still safely calculate wider ranges.
             * Provided by @CodesInChaos, @oittaa
             *
             * @ref https://gist.github.com/CodesInChaos/03f9ea0b58e8b2b8d435
             *
             * We use ~0 as a mask in this case because it generates all 1s
             *
             * @ref https://eval.in/400356 (32-bit)
             * @ref http://3v4l.org/XX9r5  (64-bit)
             */
            $bytes = PHP_INT_SIZE;
            /** @var int $mask */
            $mask = ~0;

        } else {

            /**
             * $bits is effectively ceil(log($range, 2)) without dealing with
             * type juggling
             */
            while ($range > 0) {
                if ($bits % 8 === 0) {
                    ++$bytes;
                }
                ++$bits;
                $range >>= 1;
                /** @var int $mask */
                $mask = $mask << 1 | 1;
            }
            $valueShift = $min;
        }

        /** @var int $val */
        $val = 0;
        /**
         * Now that we have our parameters set up, let's begin generating
         * random integers until one falls between $min and $max
         */
        /** @psalm-suppress RedundantCondition */
        do {
            /**
             * The rejection probability is at most 0.5, so this corresponds
             * to a failure probability of 2^-128 for a working RNG
             */
            if ($attempts > 128) {
                throw new Exception(
                    'random_int: RNG is broken - too many rejections'
                );
            }

            /**
             * Let's grab the necessary number of random bytes
             */
            $randomByteString = random_bytes($bytes);

            /**
             * Let's turn $randomByteString into an integer
             *
             * This uses bitwise operators (<< and |) to build an integer
             * out of the values extracted from ord()
             *
             * Example: [9F] | [6D] | [32] | [0C] =>
             *   159 + 27904 + 3276800 + 201326592 =>
             *   204631455
             */
            $val &= 0;
            for ($i = 0; $i < $bytes; ++$i) {
                $val |= ord($randomByteString[$i]) << ($i * 8);
            }
            /** @var int $val */

            /**
             * Apply mask
             */
            $val &= $mask;
            $val += $valueShift;

            ++$attempts;
            /**
             * If $val overflows to a floating point number,
             * ... or is larger than $max,
             * ... or smaller than $min,
             * then try again.
             */
        } while (!is_int($val) || $val > $max || $val < $min);

        return (int) $val;
    }
}
