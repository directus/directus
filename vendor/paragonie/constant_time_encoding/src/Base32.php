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
 * Class Base32
 * [A-Z][2-7]
 *
 * @package ParagonIE\ConstantTime
 */
abstract class Base32 implements EncoderInterface
{
    /**
     * Decode a Base32-encoded string into raw binary
     *
     * @param string $src
     * @return string
     * @throws \TypeError
     */
    public static function decode(string $src, bool $strictPadding = false): string
    {
        return static::doDecode($src, false, $strictPadding);
    }

    /**
     * Decode an uppercase Base32-encoded string into raw binary
     *
     * @param string $src
     * @return string
     * @throws \TypeError
     */
    public static function decodeUpper(string $src, bool $strictPadding = false): string
    {
        return static::doDecode($src, true, $strictPadding);
    }

    /**
     * Encode into Base32 (RFC 4648)
     *
     * @param string $src
     * @return string
     * @throws \TypeError
     */
    public static function encode(string $src): string
    {
        return static::doEncode($src, false, true);
    }
    /**
     * Encode into Base32 (RFC 4648)
     *
     * @param string $src
     * @return string
     * @throws \TypeError
     */
    public static function encodeUnpadded(string $src): string
    {
        return static::doEncode($src, false, false);
    }

    /**
     * Encode into uppercase Base32 (RFC 4648)
     *
     * @param string $src
     * @return string
     * @throws \TypeError
     */
    public static function encodeUpper(string $src): string
    {
        return static::doEncode($src, true, true);
    }

    /**
     * Encode into uppercase Base32 (RFC 4648)
     *
     * @param string $src
     * @return string
     * @throws \TypeError
     */
    public static function encodeUpperUnpadded(string $src): string
    {
        return static::doEncode($src, true, false);
    }

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

        // if ($src > 96 && $src < 123) $ret += $src - 97 + 1; // -64
        $ret += (((0x60 - $src) & ($src - 0x7b)) >> 8) & ($src - 96);

        // if ($src > 0x31 && $src < 0x38) $ret += $src - 24 + 1; // -23
        $ret += (((0x31 - $src) & ($src - 0x38)) >> 8) & ($src - 23);

        return $ret;
    }

    /**
     * Uses bitwise operators instead of table-lookups to turn 5-bit integers
     * into 8-bit integers.
     *
     * Uppercase variant.
     *
     * @param int $src
     * @return int
     */
    protected static function decode5BitsUpper(int $src): int
    {
        $ret = -1;

        // if ($src > 64 && $src < 91) $ret += $src - 65 + 1; // -64
        $ret += (((0x40 - $src) & ($src - 0x5b)) >> 8) & ($src - 64);

        // if ($src > 0x31 && $src < 0x38) $ret += $src - 24 + 1; // -23
        $ret += (((0x31 - $src) & ($src - 0x38)) >> 8) & ($src - 23);

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
        $diff = 0x61;

        // if ($src > 25) $ret -= 72;
        $diff -= ((25 - $src) >> 8) & 73;

        return \pack('C', $src + $diff);
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
        $diff = 0x41;

        // if ($src > 25) $ret -= 40;
        $diff -= ((25 - $src) >> 8) & 41;

        return \pack('C', $src + $diff);
    }


    /**
     * Base32 decoding
     *
     * @param string $src
     * @param bool $upper
     * @param bool $strictPadding
     * @return string
     * @throws \TypeError
     * @psalm-suppress RedundantCondition
     */
    protected static function doDecode(string $src, bool $upper = false, bool $strictPadding = false): string
    {
        // We do this to reduce code duplication:
        $method = $upper
            ? 'decode5BitsUpper'
            : 'decode5Bits';

        // Remove padding
        $srcLen = Binary::safeStrlen($src);
        if ($srcLen === 0) {
            return '';
        }
        if ($strictPadding) {
            if (($srcLen & 7) === 0) {
                for ($j = 0; $j < 7; ++$j) {
                    if ($src[$srcLen - 1] === '=') {
                        $srcLen--;
                    } else {
                        break;
                    }
                }
            }
            if (($srcLen & 7) === 1) {
                throw new \RangeException(
                    'Incorrect padding'
                );
            }
        } else {
            $src = \rtrim($src, '=');
            $srcLen = Binary::safeStrlen($src);
        }

        $err = 0;
        $dest = '';
        // Main loop (no padding):
        for ($i = 0; $i + 8 <= $srcLen; $i += 8) {
            /** @var array<int, int> $chunk */
            $chunk = \unpack('C*', Binary::safeSubstr($src, $i, 8));
            /** @var int $c0 */
            $c0 = static::$method($chunk[1]);
            /** @var int $c1 */
            $c1 = static::$method($chunk[2]);
            /** @var int $c2 */
            $c2 = static::$method($chunk[3]);
            /** @var int $c3 */
            $c3 = static::$method($chunk[4]);
            /** @var int $c4 */
            $c4 = static::$method($chunk[5]);
            /** @var int $c5 */
            $c5 = static::$method($chunk[6]);
            /** @var int $c6 */
            $c6 = static::$method($chunk[7]);
            /** @var int $c7 */
            $c7 = static::$method($chunk[8]);

            $dest .= \pack(
                'CCCCC',
                (($c0 << 3) | ($c1 >> 2)             ) & 0xff,
                (($c1 << 6) | ($c2 << 1) | ($c3 >> 4)) & 0xff,
                (($c3 << 4) | ($c4 >> 1)             ) & 0xff,
                (($c4 << 7) | ($c5 << 2) | ($c6 >> 3)) & 0xff,
                (($c6 << 5) | ($c7     )             ) & 0xff
            );
            $err |= ($c0 | $c1 | $c2 | $c3 | $c4 | $c5 | $c6 | $c7) >> 8;
        }
        // The last chunk, which may have padding:
        if ($i < $srcLen) {
            /** @var array<int, int> $chunk */
            $chunk = \unpack('C*', Binary::safeSubstr($src, $i, $srcLen - $i));
            /** @var int $c0 */
            $c0 = static::$method($chunk[1]);

            if ($i + 6 < $srcLen) {
                /** @var int $c1 */
                $c1 = static::$method($chunk[2]);
                /** @var int $c2 */
                $c2 = static::$method($chunk[3]);
                /** @var int $c3 */
                $c3 = static::$method($chunk[4]);
                /** @var int $c4 */
                $c4 = static::$method($chunk[5]);
                /** @var int $c5 */
                $c5 = static::$method($chunk[6]);
                /** @var int $c6 */
                $c6 = static::$method($chunk[7]);

                $dest .= \pack(
                    'CCCC',
                    (($c0 << 3) | ($c1 >> 2)             ) & 0xff,
                    (($c1 << 6) | ($c2 << 1) | ($c3 >> 4)) & 0xff,
                    (($c3 << 4) | ($c4 >> 1)             ) & 0xff,
                    (($c4 << 7) | ($c5 << 2) | ($c6 >> 3)) & 0xff
                );
                $err |= ($c0 | $c1 | $c2 | $c3 | $c4 | $c5 | $c6) >> 8;
            } elseif ($i + 5 < $srcLen) {
                /** @var int $c1 */
                $c1 = static::$method($chunk[2]);
                /** @var int $c2 */
                $c2 = static::$method($chunk[3]);
                /** @var int $c3 */
                $c3 = static::$method($chunk[4]);
                /** @var int $c4 */
                $c4 = static::$method($chunk[5]);
                /** @var int $c5 */
                $c5 = static::$method($chunk[6]);

                $dest .= \pack(
                    'CCCC',
                    (($c0 << 3) | ($c1 >> 2)             ) & 0xff,
                    (($c1 << 6) | ($c2 << 1) | ($c3 >> 4)) & 0xff,
                    (($c3 << 4) | ($c4 >> 1)             ) & 0xff,
                    (($c4 << 7) | ($c5 << 2)             ) & 0xff
                );
                $err |= ($c0 | $c1 | $c2 | $c3 | $c4 | $c5) >> 8;
            } elseif ($i + 4 < $srcLen) {
                /** @var int $c1 */
                $c1 = static::$method($chunk[2]);
                /** @var int $c2 */
                $c2 = static::$method($chunk[3]);
                /** @var int $c3 */
                $c3 = static::$method($chunk[4]);
                /** @var int $c4 */
                $c4 = static::$method($chunk[5]);

                $dest .= \pack(
                    'CCC',
                    (($c0 << 3) | ($c1 >> 2)             ) & 0xff,
                    (($c1 << 6) | ($c2 << 1) | ($c3 >> 4)) & 0xff,
                    (($c3 << 4) | ($c4 >> 1)             ) & 0xff
                );
                $err |= ($c0 | $c1 | $c2 | $c3 | $c4) >> 8;
            } elseif ($i + 3 < $srcLen) {
                /** @var int $c1 */
                $c1 = static::$method($chunk[2]);
                /** @var int $c2 */
                $c2 = static::$method($chunk[3]);
                /** @var int $c3 */
                $c3 = static::$method($chunk[4]);

                $dest .= \pack(
                    'CC',
                    (($c0 << 3) | ($c1 >> 2)             ) & 0xff,
                    (($c1 << 6) | ($c2 << 1) | ($c3 >> 4)) & 0xff
                );
                $err |= ($c0 | $c1 | $c2 | $c3) >> 8;
            } elseif ($i + 2 < $srcLen) {
                /** @var int $c1 */
                $c1 = static::$method($chunk[2]);
                /** @var int $c2 */
                $c2 = static::$method($chunk[3]);

                $dest .= \pack(
                    'CC',
                    (($c0 << 3) | ($c1 >> 2)             ) & 0xff,
                    (($c1 << 6) | ($c2 << 1)             ) & 0xff
                );
                $err |= ($c0 | $c1 | $c2) >> 8;
            } elseif ($i + 1 < $srcLen) {
                /** @var int $c1 */
                $c1 = static::$method($chunk[2]);

                $dest .= \pack(
                    'C',
                    (($c0 << 3) | ($c1 >> 2)             ) & 0xff
                );
                $err |= ($c0 | $c1) >> 8;
            } else {
                $dest .= \pack(
                    'C',
                    (($c0 << 3)                          ) & 0xff
                );
                $err |= ($c0) >> 8;
            }
        }
        /** @var bool $check */
        $check = ($err === 0);
        if (!$check) {
            throw new \RangeException(
                'Base32::doDecode() only expects characters in the correct base32 alphabet'
            );
        }
        return $dest;
    }

    /**
     * Base32 Encoding
     *
     * @param string $src
     * @param bool $upper
     * @param bool $pad
     * @return string
     * @throws \TypeError
     */
    protected static function doEncode(string $src, bool $upper = false, $pad = true): string
    {
        // We do this to reduce code duplication:
        $method = $upper
            ? 'encode5BitsUpper'
            : 'encode5Bits';
        
        $dest = '';
        $srcLen = Binary::safeStrlen($src);

        // Main loop (no padding):
        for ($i = 0; $i + 5 <= $srcLen; $i += 5) {
            /** @var array<int, int> $chunk */
            $chunk = \unpack('C*', Binary::safeSubstr($src, $i, 5));
            $b0 = $chunk[1];
            $b1 = $chunk[2];
            $b2 = $chunk[3];
            $b3 = $chunk[4];
            $b4 = $chunk[5];
            $dest .=
                static::$method(              ($b0 >> 3)  & 31) .
                static::$method((($b0 << 2) | ($b1 >> 6)) & 31) .
                static::$method((($b1 >> 1)             ) & 31) .
                static::$method((($b1 << 4) | ($b2 >> 4)) & 31) .
                static::$method((($b2 << 1) | ($b3 >> 7)) & 31) .
                static::$method((($b3 >> 2)             ) & 31) .
                static::$method((($b3 << 3) | ($b4 >> 5)) & 31) .
                static::$method(  $b4                     & 31);
        }
        // The last chunk, which may have padding:
        if ($i < $srcLen) {
            /** @var array<int, int> $chunk */
            $chunk = \unpack('C*', Binary::safeSubstr($src, $i, $srcLen - $i));
            $b0 = $chunk[1];
            if ($i + 3 < $srcLen) {
                $b1 = $chunk[2];
                $b2 = $chunk[3];
                $b3 = $chunk[4];
                $dest .=
                    static::$method(              ($b0 >> 3)  & 31) .
                    static::$method((($b0 << 2) | ($b1 >> 6)) & 31) .
                    static::$method((($b1 >> 1)             ) & 31) .
                    static::$method((($b1 << 4) | ($b2 >> 4)) & 31) .
                    static::$method((($b2 << 1) | ($b3 >> 7)) & 31) .
                    static::$method((($b3 >> 2)             ) & 31) .
                    static::$method((($b3 << 3)             ) & 31);
                if ($pad) {
                    $dest .= '=';
                }
            } elseif ($i + 2 < $srcLen) {
                $b1 = $chunk[2];
                $b2 = $chunk[3];
                $dest .=
                    static::$method(              ($b0 >> 3)  & 31) .
                    static::$method((($b0 << 2) | ($b1 >> 6)) & 31) .
                    static::$method((($b1 >> 1)             ) & 31) .
                    static::$method((($b1 << 4) | ($b2 >> 4)) & 31) .
                    static::$method((($b2 << 1)             ) & 31);
                if ($pad) {
                    $dest .= '===';
                }
            } elseif ($i + 1 < $srcLen) {
                $b1 = $chunk[2];
                $dest .=
                    static::$method(              ($b0 >> 3)  & 31) .
                    static::$method((($b0 << 2) | ($b1 >> 6)) & 31) .
                    static::$method((($b1 >> 1)             ) & 31) .
                    static::$method((($b1 << 4)             ) & 31);
                if ($pad) {
                    $dest .= '====';
                }
            } else {
                $dest .=
                    static::$method(              ($b0 >> 3)  & 31) .
                    static::$method( ($b0 << 2)               & 31);
                if ($pad) {
                    $dest .= '======';
                }
            }
        }
        return $dest;
    }
}
