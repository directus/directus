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
 * Class RFC4648
 *
 * This class conforms strictly to the RFC
 *
 * @package ParagonIE\ConstantTime
 */
abstract class RFC4648
{
    /**
     * RFC 4648 Base64 encoding
     *
     * "foo" -> "Zm9v"
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
     * "Zm9v" -> "foo"
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base64Decode(string $str): string
    {
        return Base64::decode($str, true);
    }

    /**
     * RFC 4648 Base64 (URL Safe) encoding
     *
     * "foo" -> "Zm9v"
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base64UrlSafeEncode(string $str): string
    {
        return Base64UrlSafe::encode($str);
    }

    /**
     * RFC 4648 Base64 (URL Safe) decoding
     *
     * "Zm9v" -> "foo"
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base64UrlSafeDecode(string $str): string
    {
        return Base64UrlSafe::decode($str, true);
    }

    /**
     * RFC 4648 Base32 encoding
     *
     * "foo" -> "MZXW6==="
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32Encode(string $str): string
    {
        return Base32::encodeUpper($str);
    }

    /**
     * RFC 4648 Base32 encoding
     *
     * "MZXW6===" -> "foo"
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32Decode(string $str): string
    {
        return Base32::decodeUpper($str, true);
    }

    /**
     * RFC 4648 Base32-Hex encoding
     *
     * "foo" -> "CPNMU==="
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32HexEncode(string $str): string
    {
        return Base32::encodeUpper($str);
    }

    /**
     * RFC 4648 Base32-Hex decoding
     *
     * "CPNMU===" -> "foo"
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base32HexDecode(string $str): string
    {
        return Base32::decodeUpper($str, true);
    }

    /**
     * RFC 4648 Base16 decoding
     *
     * "foo" -> "666F6F"
     *
     * @param string $str
     * @return string
     * @throws \TypeError
     */
    public static function base16Encode(string $str): string
    {
        return Hex::encodeUpper($str);
    }

    /**
     * RFC 4648 Base16 decoding
     *
     * "666F6F" -> "foo"
     *
     * @param string $str
     * @return string
     */
    public static function base16Decode(string $str): string
    {
        return Hex::decode($str, true);
    }
}