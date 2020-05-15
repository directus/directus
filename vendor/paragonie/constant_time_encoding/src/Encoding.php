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
 * Class Encoding
 * @package ParagonIE\ConstantTime
 */
abstract class Encoding
{
    /**
     * RFC 4648 Base32 encoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32Encode(string $str): string
    {
        return Base32::encode($str);
    }

    /**
     * RFC 4648 Base32 encoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32EncodeUpper(string $str): string
    {
        return Base32::encodeUpper($str);
    }

    /**
     * RFC 4648 Base32 decoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32Decode(string $str): string
    {
        return Base32::decode($str);
    }

    /**
     * RFC 4648 Base32 decoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32DecodeUpper(string $str): string
    {
        return Base32::decodeUpper($str);
    }

    /**
     * RFC 4648 Base32 encoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32HexEncode(string $str): string
    {
        return Base32Hex::encode($str);
    }

    /**
     * RFC 4648 Base32Hex encoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32HexEncodeUpper(string $str): string
    {
        return Base32Hex::encodeUpper($str);
    }

    /**
     * RFC 4648 Base32Hex decoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32HexDecode(string $str): string
    {
        return Base32Hex::decode($str);
    }

    /**
     * RFC 4648 Base32Hex decoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32HexDecodeUpper(string $str): string
    {
        return Base32Hex::decodeUpper($str);
    }

    /**
     * RFC 4648 Base64 encoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base64Encode(string $str): string
    {
        return Base64::encode($str);
    }

    /**
     * RFC 4648 Base64 decoding
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base64Decode(string $str): string
    {
        return Base64::decode($str);
    }

    /**
     * Encode into Base64
     *
     * Base64 character set "./[A-Z][a-z][0-9]"
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base64EncodeDotSlash(string $str): string
    {
        return Base64DotSlash::encode($str);
    }

    /**
     * Decode from base64 to raw binary
     *
     * Base64 character set "./[A-Z][a-z][0-9]"
     *
     * @param string $str
     * @return string
     * @throws \RangeException
     * @throws \TypeError
     */
    public static function base64DecodeDotSlash(string $str): string
    {
        return Base64DotSlash::decode($str);
    }

    /**
     * Encode into Base64
     *
     * Base64 character set "[.-9][A-Z][a-z]" or "./[0-9][A-Z][a-z]"
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base64EncodeDotSlashOrdered(string $str): string
    {
        return Base64DotSlashOrdered::encode($str);
    }

    /**
     * Decode from base64 to raw binary
     *
     * Base64 character set "[.-9][A-Z][a-z]" or "./[0-9][A-Z][a-z]"
     *
     * @param string $str
     * @return string
     * @throws \RangeException
     * @throws \TypeError
     */
    public static function base64DecodeDotSlashOrdered(string $str): string
    {
        return Base64DotSlashOrdered::decode($str);
    }

    /**
     * Convert a binary string into a hexadecimal string without cache-timing
     * leaks
     *
     * @param string $bin_string (raw binary)
     * @return string
     * @throws \TypeError
     */
    public static function hexEncode(string $bin_string): string
    {
        return Hex::encode($bin_string);
    }

    /**
     * Convert a hexadecimal string into a binary string without cache-timing
     * leaks
     *
     * @param string $hex_string
     * @return string (raw binary)
     * @throws \RangeException
     */
    public static function hexDecode(string $hex_string): string
    {
        return Hex::decode($hex_string);
    }

    /**
     * Convert a binary string into a hexadecimal string without cache-timing
     * leaks
     *
     * @param string $bin_string (raw binary)
     * @return string
     * @throws \TypeError
     */
    public static function hexEncodeUpper(string $bin_string): string
    {
        return Hex::encodeUpper($bin_string);
    }

    /**
     * Convert a binary string into a hexadecimal string without cache-timing
     * leaks
     *
     * @param string $bin_string (raw binary)
     * @return string
     */
    public static function hexDecodeUpper(string $bin_string): string
    {
        return Hex::decode($bin_string);
    }
}
