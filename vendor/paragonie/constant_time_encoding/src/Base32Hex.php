<?php
declare(strict_types=1);
namespace ParagonIE\ConstantTime;

/**
 *  Copyright (c) 2016 - 2018 Paragon Initiative Enterprises.
 *  Copyright (c) 2014 Steve "Sc00bz" Thomas (steve at tobtu dot com)
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the "Software"), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all
 *  copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

/**
 * Class Base32Hex
 * [0-9][A-V]
 *
 * @package ParagonIE\ConstantTime
 */
abstract class Base32Hex extends Base32
{
    /**
     * Uses bitwise operators instead of table-lookups to turn 5-bit integers
     * into 8-bit integers.
     *
     * @param int $src
     * @return int
     */
    protected static function decode5Bits(int $src): int
    {
        $ret = -1;

        // if ($src > 0x30 && $src < 0x3a) ret += $src - 0x2e + 1; // -47
        $ret += (((0x2f - $src) & ($src - 0x3a)) >> 8) & ($src - 47);

        // if ($src > 0x60 && $src < 0x77) ret += $src - 0x61 + 10 + 1; // -86
        $ret += (((0x60 - $src) & ($src - 0x77)) >> 8) & ($src - 86);

        return $ret;
    }

    /**
     * Uses bitwise operators instead of table-lookups to turn 5-bit integers
     * into 8-bit integers.
     *
     * @param int $src
     * @return int
     */
    protected static function decode5BitsUpper(int $src): int
    {
        $ret = -1;

        // if ($src > 0x30 && $src < 0x3a) ret += $src - 0x2e + 1; // -47
        $ret += (((0x2f - $src) & ($src - 0x3a)) >> 8) & ($src - 47);

        // if ($src > 0x40 && $src < 0x57) ret += $src - 0x41 + 10 + 1; // -54
        $ret += (((0x40 - $src) & ($src - 0x57)) >> 8) & ($src - 54);

        return $ret;
    }

    /**
     * Uses bitwise operators instead of table-lookups to turn 8-bit integers
     * into 5-bit integers.
     *
     * @param int $src
     * @return string
     */
    protected static function encode5Bits(int $src): string
    {
        $src += 0x30;

        // if ($src > 0x39) $src += 0x61 - 0x3a; // 39
        $src += ((0x39 - $src) >> 8) & 39;

        return \pack('C', $src);
    }

    /**
     * Uses bitwise operators instead of table-lookups to turn 8-bit integers
     * into 5-bit integers.
     *
     * Uppercase variant.
     *
     * @param int $src
     * @return string
     */
    protected static function encode5BitsUpper(int $src): string
    {
        $src += 0x30;

        // if ($src > 0x39) $src += 0x41 - 0x3a; // 7
        $src += ((0x39 - $src) >> 8) & 7;

        return \pack('C', $src);
    }
}