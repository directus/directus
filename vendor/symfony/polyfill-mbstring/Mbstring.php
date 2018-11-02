<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Polyfill\Mbstring;

/**
 * Partial mbstring implementation in PHP, iconv based, UTF-8 centric.
 *
 * Implemented:
 * - mb_chr                  - Returns a specific character from its Unicode code point
 * - mb_convert_encoding     - Convert character encoding
 * - mb_convert_variables    - Convert character code in variable(s)
 * - mb_decode_mimeheader    - Decode string in MIME header field
 * - mb_encode_mimeheader    - Encode string for MIME header XXX NATIVE IMPLEMENTATION IS REALLY BUGGED
 * - mb_decode_numericentity - Decode HTML numeric string reference to character
 * - mb_encode_numericentity - Encode character to HTML numeric string reference
 * - mb_convert_case         - Perform case folding on a string
 * - mb_detect_encoding      - Detect character encoding
 * - mb_get_info             - Get internal settings of mbstring
 * - mb_http_input           - Detect HTTP input character encoding
 * - mb_http_output          - Set/Get HTTP output character encoding
 * - mb_internal_encoding    - Set/Get internal character encoding
 * - mb_list_encodings       - Returns an array of all supported encodings
 * - mb_ord                  - Returns the Unicode code point of a character
 * - mb_output_handler       - Callback function converts character encoding in output buffer
 * - mb_scrub                - Replaces ill-formed byte sequences with substitute characters
 * - mb_strlen               - Get string length
 * - mb_strpos               - Find position of first occurrence of string in a string
 * - mb_strrpos              - Find position of last occurrence of a string in a string
 * - mb_strtolower           - Make a string lowercase
 * - mb_strtoupper           - Make a string uppercase
 * - mb_substitute_character - Set/Get substitution character
 * - mb_substr               - Get part of string
 * - mb_stripos              - Finds position of first occurrence of a string within another, case insensitive
 * - mb_stristr              - Finds first occurrence of a string within another, case insensitive
 * - mb_strrchr              - Finds the last occurrence of a character in a string within another
 * - mb_strrichr             - Finds the last occurrence of a character in a string within another, case insensitive
 * - mb_strripos             - Finds position of last occurrence of a string within another, case insensitive
 * - mb_strstr               - Finds first occurrence of a string within another
 * - mb_strwidth             - Return width of string
 * - mb_substr_count         - Count the number of substring occurrences
 *
 * Not implemented:
 * - mb_convert_kana         - Convert "kana" one from another ("zen-kaku", "han-kaku" and more)
 * - mb_ereg_*               - Regular expression with multibyte support
 * - mb_parse_str            - Parse GET/POST/COOKIE data and set global variable
 * - mb_preferred_mime_name  - Get MIME charset string
 * - mb_regex_encoding       - Returns current encoding for multibyte regex as string
 * - mb_regex_set_options    - Set/Get the default options for mbregex functions
 * - mb_send_mail            - Send encoded mail
 * - mb_split                - Split multibyte string using regular expression
 * - mb_strcut               - Get part of string
 * - mb_strimwidth           - Get truncated string with specified width
 *
 * @author Nicolas Grekas <p@tchwork.com>
 *
 * @internal
 */
final class Mbstring
{
    const MB_CASE_FOLD = PHP_INT_MAX;

    private static $encodingList = array('ASCII', 'UTF-8');
    private static $language = 'neutral';
    private static $internalEncoding = 'UTF-8';
    private static $caseFold = array(
        array('µ', 'ſ', "\xCD\x85", 'ς', "\xCF\x90", "\xCF\x91", "\xCF\x95", "\xCF\x96", "\xCF\xB0", "\xCF\xB1", "\xCF\xB5", "\xE1\xBA\x9B", "\xE1\xBE\xBE"),
        array('μ', 's', 'ι',        'σ', 'β',        'θ',        'φ',        'π',        'κ',        'ρ',        'ε',        "\xE1\xB9\xA1", 'ι'),
    );

    public static function mb_convert_encoding($s, $toEncoding, $fromEncoding = null)
    {
        if (\is_array($fromEncoding) || false !== strpos($fromEncoding, ',')) {
            $fromEncoding = self::mb_detect_encoding($s, $fromEncoding);
        } else {
            $fromEncoding = self::getEncoding($fromEncoding);
        }

        $toEncoding = self::getEncoding($toEncoding);

        if ('BASE64' === $fromEncoding) {
            $s = base64_decode($s);
            $fromEncoding = $toEncoding;
        }

        if ('BASE64' === $toEncoding) {
            return base64_encode($s);
        }

        if ('HTML-ENTITIES' === $toEncoding || 'HTML' === $toEncoding) {
            if ('HTML-ENTITIES' === $fromEncoding || 'HTML' === $fromEncoding) {
                $fromEncoding = 'Windows-1252';
            }
            if ('UTF-8' !== $fromEncoding) {
                $s = iconv($fromEncoding, 'UTF-8//IGNORE', $s);
            }

            return preg_replace_callback('/[\x80-\xFF]+/', array(__CLASS__, 'html_encoding_callback'), $s);
        }

        if ('HTML-ENTITIES' === $fromEncoding) {
            $s = html_entity_decode($s, ENT_COMPAT, 'UTF-8');
            $fromEncoding = 'UTF-8';
        }

        return iconv($fromEncoding, $toEncoding.'//IGNORE', $s);
    }

    public static function mb_convert_variables($toEncoding, $fromEncoding, &$a = null, &$b = null, &$c = null, &$d = null, &$e = null, &$f = null)
    {
        $vars = array(&$a, &$b, &$c, &$d, &$e, &$f);

        $ok = true;
        array_walk_recursive($vars, function (&$v) use (&$ok, $toEncoding, $fromEncoding) {
            if (false === $v = Mbstring::mb_convert_encoding($v, $toEncoding, $fromEncoding)) {
                $ok = false;
            }
        });

        return $ok ? $fromEncoding : false;
    }

    public static function mb_decode_mimeheader($s)
    {
        return iconv_mime_decode($s, 2, self::$internalEncoding);
    }

    public static function mb_encode_mimeheader($s, $charset = null, $transferEncoding = null, $linefeed = null, $indent = null)
    {
        trigger_error('mb_encode_mimeheader() is bugged. Please use iconv_mime_encode() instead', E_USER_WARNING);
    }

    public static function mb_decode_numericentity($s, $convmap, $encoding = null)
    {
        if (null !== $s && !\is_scalar($s) && !(\is_object($s) && \method_exists($s, '__toString'))) {
            trigger_error('mb_decode_numericentity() expects parameter 1 to be string, '.\gettype($s).' given', E_USER_WARNING);

            return null;
        }

        if (!\is_array($convmap) || !$convmap) {
            return false;
        }

        if (null !== $encoding && !\is_scalar($encoding)) {
            trigger_error('mb_decode_numericentity() expects parameter 3 to be string, '.\gettype($s).' given', E_USER_WARNING);

            return '';  // Instead of null (cf. mb_encode_numericentity).
        }

        $s = (string) $s;
        if ('' === $s) {
            return '';
        }

        $encoding = self::getEncoding($encoding);

        if ('UTF-8' === $encoding) {
            $encoding = null;
            if (!preg_match('//u', $s)) {
                $s = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
            }
        } else {
            $s = iconv($encoding, 'UTF-8//IGNORE', $s);
        }

        $cnt = floor(\count($convmap) / 4) * 4;

        for ($i = 0; $i < $cnt; $i += 4) {
            // collector_decode_htmlnumericentity ignores $convmap[$i + 3]
            $convmap[$i] += $convmap[$i + 2];
            $convmap[$i + 1] += $convmap[$i + 2];
        }

        $s = preg_replace_callback('/&#(?:0*([0-9]+)|x0*([0-9a-fA-F]+))(?!&);?/', function (array $m) use ($cnt, $convmap) {
            $c = isset($m[2]) ? (int) hexdec($m[2]) : $m[1];
            for ($i = 0; $i < $cnt; $i += 4) {
                if ($c >= $convmap[$i] && $c <= $convmap[$i + 1]) {
                    return Mbstring::mb_chr($c - $convmap[$i + 2]);
                }
            }

            return $m[0];
        }, $s);

        if (null === $encoding) {
            return $s;
        }

        return iconv('UTF-8', $encoding.'//IGNORE', $s);
    }

    public static function mb_encode_numericentity($s, $convmap, $encoding = null, $is_hex = false)
    {
        if (null !== $s && !\is_scalar($s) && !(\is_object($s) && \method_exists($s, '__toString'))) {
            trigger_error('mb_encode_numericentity() expects parameter 1 to be string, '.\gettype($s).' given', E_USER_WARNING);

            return null;
        }

        if (!\is_array($convmap) || !$convmap) {
            return false;
        }

        if (null !== $encoding && !\is_scalar($encoding)) {
            trigger_error('mb_encode_numericentity() expects parameter 3 to be string, '.\gettype($s).' given', E_USER_WARNING);

            return null;  // Instead of '' (cf. mb_decode_numericentity).
        }

        if (null !== $is_hex && !\is_scalar($is_hex)) {
            trigger_error('mb_encode_numericentity() expects parameter 4 to be boolean, '.\gettype($s).' given', E_USER_WARNING);

            return null;
        }

        $s = (string) $s;
        if ('' === $s) {
            return '';
        }

        $encoding = self::getEncoding($encoding);

        if ('UTF-8' === $encoding) {
            $encoding = null;
            if (!preg_match('//u', $s)) {
                $s = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
            }
        } else {
            $s = iconv($encoding, 'UTF-8//IGNORE', $s);
        }

        static $ulenMask = array("\xC0" => 2, "\xD0" => 2, "\xE0" => 3, "\xF0" => 4);

        $cnt = floor(\count($convmap) / 4) * 4;
        $i = 0;
        $len = \strlen($s);
        $result = '';

        while ($i < $len) {
            $ulen = $s[$i] < "\x80" ? 1 : $ulenMask[$s[$i] & "\xF0"];
            $uchr = substr($s, $i, $ulen);
            $i += $ulen;
            $c = self::mb_ord($uchr);

            for ($j = 0; $j < $cnt; $j += 4) {
                if ($c >= $convmap[$j] && $c <= $convmap[$j + 1]) {
                    $cOffset = ($c + $convmap[$j + 2]) & $convmap[$j + 3];
                    $result .= $is_hex ? sprintf('&#x%X;', $cOffset) : '&#'.$cOffset.';';
                    continue 2;
                }
            }
            $result .= $uchr;
        }

        if (null === $encoding) {
            return $result;
        }

        return iconv('UTF-8', $encoding.'//IGNORE', $result);
    }

    public static function mb_convert_case($s, $mode, $encoding = null)
    {
        $s = (string) $s;
        if ('' === $s) {
            return '';
        }

        $encoding = self::getEncoding($encoding);

        if ('UTF-8' === $encoding) {
            $encoding = null;
            if (!preg_match('//u', $s)) {
                $s = @iconv('UTF-8', 'UTF-8//IGNORE', $s);
            }
        } else {
            $s = iconv($encoding, 'UTF-8//IGNORE', $s);
        }

        if (MB_CASE_TITLE == $mode) {
            static $titleRegexp = null;
            if (null === $titleRegexp) {
                $titleRegexp = self::getData('titleCaseRegexp');
            }
            $s = preg_replace_callback($titleRegexp, array(__CLASS__, 'title_case'), $s);
        } else {
            if (MB_CASE_UPPER == $mode) {
                static $upper = null;
                if (null === $upper) {
                    $upper = self::getData('upperCase');
                }
                $map = $upper;
            } else {
                if (self::MB_CASE_FOLD === $mode) {
                    $s = str_replace(self::$caseFold[0], self::$caseFold[1], $s);
                }

                static $lower = null;
                if (null === $lower) {
                    $lower = self::getData('lowerCase');
                }
                $map = $lower;
            }

            static $ulenMask = array("\xC0" => 2, "\xD0" => 2, "\xE0" => 3, "\xF0" => 4);

            $i = 0;
            $len = \strlen($s);

            while ($i < $len) {
                $ulen = $s[$i] < "\x80" ? 1 : $ulenMask[$s[$i] & "\xF0"];
                $uchr = substr($s, $i, $ulen);
                $i += $ulen;

                if (isset($map[$uchr])) {
                    $uchr = $map[$uchr];
                    $nlen = \strlen($uchr);

                    if ($nlen == $ulen) {
                        $nlen = $i;
                        do {
                            $s[--$nlen] = $uchr[--$ulen];
                        } while ($ulen);
                    } else {
                        $s = substr_replace($s, $uchr, $i - $ulen, $ulen);
                        $len += $nlen - $ulen;
                        $i += $nlen - $ulen;
                    }
                }
            }
        }

        if (null === $encoding) {
            return $s;
        }

        return iconv('UTF-8', $encoding.'//IGNORE', $s);
    }

    public static function mb_internal_encoding($encoding = null)
    {
        if (null === $encoding) {
            return self::$internalEncoding;
        }

        $encoding = self::getEncoding($encoding);

        if ('UTF-8' === $encoding || false !== @iconv($encoding, $encoding, ' ')) {
            self::$internalEncoding = $encoding;

            return true;
        }

        return false;
    }

    public static function mb_language($lang = null)
    {
        if (null === $lang) {
            return self::$language;
        }

        switch ($lang = strtolower($lang)) {
            case 'uni':
            case 'neutral':
                self::$language = $lang;

                return true;
        }

        return false;
    }

    public static function mb_list_encodings()
    {
        return array('UTF-8');
    }

    public static function mb_encoding_aliases($encoding)
    {
        switch (strtoupper($encoding)) {
            case 'UTF8':
            case 'UTF-8':
                return array('utf8');
        }

        return false;
    }

    public static function mb_check_encoding($var = null, $encoding = null)
    {
        if (null === $encoding) {
            if (null === $var) {
                return false;
            }
            $encoding = self::$internalEncoding;
        }

        return self::mb_detect_encoding($var, array($encoding)) || false !== @iconv($encoding, $encoding, $var);
    }

    public static function mb_detect_encoding($str, $encodingList = null, $strict = false)
    {
        if (null === $encodingList) {
            $encodingList = self::$encodingList;
        } else {
            if (!\is_array($encodingList)) {
                $encodingList = array_map('trim', explode(',', $encodingList));
            }
            $encodingList = array_map('strtoupper', $encodingList);
        }

        foreach ($encodingList as $enc) {
            switch ($enc) {
                case 'ASCII':
                    if (!preg_match('/[\x80-\xFF]/', $str)) {
                        return $enc;
                    }
                    break;

                case 'UTF8':
                case 'UTF-8':
                    if (preg_match('//u', $str)) {
                        return 'UTF-8';
                    }
                    break;

                default:
                    if (0 === strncmp($enc, 'ISO-8859-', 9)) {
                        return $enc;
                    }
            }
        }

        return false;
    }

    public static function mb_detect_order($encodingList = null)
    {
        if (null === $encodingList) {
            return self::$encodingList;
        }

        if (!\is_array($encodingList)) {
            $encodingList = array_map('trim', explode(',', $encodingList));
        }
        $encodingList = array_map('strtoupper', $encodingList);

        foreach ($encodingList as $enc) {
            switch ($enc) {
                default:
                    if (strncmp($enc, 'ISO-8859-', 9)) {
                        return false;
                    }
                    // no break
                case 'ASCII':
                case 'UTF8':
                case 'UTF-8':
            }
        }

        self::$encodingList = $encodingList;

        return true;
    }

    public static function mb_strlen($s, $encoding = null)
    {
        $encoding = self::getEncoding($encoding);
        if ('CP850' === $encoding || 'ASCII' === $encoding) {
            return \strlen($s);
        }

        return @iconv_strlen($s, $encoding);
    }

    public static function mb_strpos($haystack, $needle, $offset = 0, $encoding = null)
    {
        $encoding = self::getEncoding($encoding);
        if ('CP850' === $encoding || 'ASCII' === $encoding) {
            return strpos($haystack, $needle, $offset);
        }

        $needle = (string) $needle;
        if ('' === $needle) {
            trigger_error(__METHOD__.': Empty delimiter', E_USER_WARNING);

            return false;
        }

        return iconv_strpos($haystack, $needle, $offset, $encoding);
    }

    public static function mb_strrpos($haystack, $needle, $offset = 0, $encoding = null)
    {
        $encoding = self::getEncoding($encoding);
        if ('CP850' === $encoding || 'ASCII' === $encoding) {
            return strrpos($haystack, $needle, $offset);
        }

        if ($offset != (int) $offset) {
            $offset = 0;
        } elseif ($offset = (int) $offset) {
            if ($offset < 0) {
                $haystack = self::mb_substr($haystack, 0, $offset, $encoding);
                $offset = 0;
            } else {
                $haystack = self::mb_substr($haystack, $offset, 2147483647, $encoding);
            }
        }

        $pos = iconv_strrpos($haystack, $needle, $encoding);

        return false !== $pos ? $offset + $pos : false;
    }

    public static function mb_strtolower($s, $encoding = null)
    {
        return self::mb_convert_case($s, MB_CASE_LOWER, $encoding);
    }

    public static function mb_strtoupper($s, $encoding = null)
    {
        return self::mb_convert_case($s, MB_CASE_UPPER, $encoding);
    }

    public static function mb_substitute_character($c = null)
    {
        if (0 === strcasecmp($c, 'none')) {
            return true;
        }

        return null !== $c ? false : 'none';
    }

    public static function mb_substr($s, $start, $length = null, $encoding = null)
    {
        $encoding = self::getEncoding($encoding);
        if ('CP850' === $encoding || 'ASCII' === $encoding) {
            return substr($s, $start, null === $length ? 2147483647 : $length);
        }

        if ($start < 0) {
            $start = iconv_strlen($s, $encoding) + $start;
            if ($start < 0) {
                $start = 0;
            }
        }

        if (null === $length) {
            $length = 2147483647;
        } elseif ($length < 0) {
            $length = iconv_strlen($s, $encoding) + $length - $start;
            if ($length < 0) {
                return '';
            }
        }

        return (string) iconv_substr($s, $start, $length, $encoding);
    }

    public static function mb_stripos($haystack, $needle, $offset = 0, $encoding = null)
    {
        $haystack = self::mb_convert_case($haystack, self::MB_CASE_FOLD, $encoding);
        $needle = self::mb_convert_case($needle, self::MB_CASE_FOLD, $encoding);

        return self::mb_strpos($haystack, $needle, $offset, $encoding);
    }

    public static function mb_stristr($haystack, $needle, $part = false, $encoding = null)
    {
        $pos = self::mb_stripos($haystack, $needle, 0, $encoding);

        return self::getSubpart($pos, $part, $haystack, $encoding);
    }

    public static function mb_strrchr($haystack, $needle, $part = false, $encoding = null)
    {
        $encoding = self::getEncoding($encoding);
        if ('CP850' === $encoding || 'ASCII' === $encoding) {
            return strrchr($haystack, $needle, $part);
        }
        $needle = self::mb_substr($needle, 0, 1, $encoding);
        $pos = iconv_strrpos($haystack, $needle, $encoding);

        return self::getSubpart($pos, $part, $haystack, $encoding);
    }

    public static function mb_strrichr($haystack, $needle, $part = false, $encoding = null)
    {
        $needle = self::mb_substr($needle, 0, 1, $encoding);
        $pos = self::mb_strripos($haystack, $needle, $encoding);

        return self::getSubpart($pos, $part, $haystack, $encoding);
    }

    public static function mb_strripos($haystack, $needle, $offset = 0, $encoding = null)
    {
        $haystack = self::mb_convert_case($haystack, self::MB_CASE_FOLD, $encoding);
        $needle = self::mb_convert_case($needle, self::MB_CASE_FOLD, $encoding);

        return self::mb_strrpos($haystack, $needle, $offset, $encoding);
    }

    public static function mb_strstr($haystack, $needle, $part = false, $encoding = null)
    {
        $pos = strpos($haystack, $needle);
        if (false === $pos) {
            return false;
        }
        if ($part) {
            return substr($haystack, 0, $pos);
        }

        return substr($haystack, $pos);
    }

    public static function mb_get_info($type = 'all')
    {
        $info = array(
            'internal_encoding' => self::$internalEncoding,
            'http_output' => 'pass',
            'http_output_conv_mimetypes' => '^(text/|application/xhtml\+xml)',
            'func_overload' => 0,
            'func_overload_list' => 'no overload',
            'mail_charset' => 'UTF-8',
            'mail_header_encoding' => 'BASE64',
            'mail_body_encoding' => 'BASE64',
            'illegal_chars' => 0,
            'encoding_translation' => 'Off',
            'language' => self::$language,
            'detect_order' => self::$encodingList,
            'substitute_character' => 'none',
            'strict_detection' => 'Off',
        );

        if ('all' === $type) {
            return $info;
        }
        if (isset($info[$type])) {
            return $info[$type];
        }

        return false;
    }

    public static function mb_http_input($type = '')
    {
        return false;
    }

    public static function mb_http_output($encoding = null)
    {
        return null !== $encoding ? 'pass' === $encoding : 'pass';
    }

    public static function mb_strwidth($s, $encoding = null)
    {
        $encoding = self::getEncoding($encoding);

        if ('UTF-8' !== $encoding) {
            $s = iconv($encoding, 'UTF-8//IGNORE', $s);
        }

        $s = preg_replace('/[\x{1100}-\x{115F}\x{2329}\x{232A}\x{2E80}-\x{303E}\x{3040}-\x{A4CF}\x{AC00}-\x{D7A3}\x{F900}-\x{FAFF}\x{FE10}-\x{FE19}\x{FE30}-\x{FE6F}\x{FF00}-\x{FF60}\x{FFE0}-\x{FFE6}\x{20000}-\x{2FFFD}\x{30000}-\x{3FFFD}]/u', '', $s, -1, $wide);

        return ($wide << 1) + iconv_strlen($s, 'UTF-8');
    }

    public static function mb_substr_count($haystack, $needle, $encoding = null)
    {
        return substr_count($haystack, $needle);
    }

    public static function mb_output_handler($contents, $status)
    {
        return $contents;
    }

    public static function mb_chr($code, $encoding = null)
    {
        if (0x80 > $code %= 0x200000) {
            $s = \chr($code);
        } elseif (0x800 > $code) {
            $s = \chr(0xC0 | $code >> 6).\chr(0x80 | $code & 0x3F);
        } elseif (0x10000 > $code) {
            $s = \chr(0xE0 | $code >> 12).\chr(0x80 | $code >> 6 & 0x3F).\chr(0x80 | $code & 0x3F);
        } else {
            $s = \chr(0xF0 | $code >> 18).\chr(0x80 | $code >> 12 & 0x3F).\chr(0x80 | $code >> 6 & 0x3F).\chr(0x80 | $code & 0x3F);
        }

        if ('UTF-8' !== $encoding = self::getEncoding($encoding)) {
            $s = mb_convert_encoding($s, $encoding, 'UTF-8');
        }

        return $s;
    }

    public static function mb_ord($s, $encoding = null)
    {
        if ('UTF-8' !== $encoding = self::getEncoding($encoding)) {
            $s = mb_convert_encoding($s, 'UTF-8', $encoding);
        }

        if (1 === \strlen($s)) {
            return \ord($s);
        }

        $code = ($s = unpack('C*', substr($s, 0, 4))) ? $s[1] : 0;
        if (0xF0 <= $code) {
            return (($code - 0xF0) << 18) + (($s[2] - 0x80) << 12) + (($s[3] - 0x80) << 6) + $s[4] - 0x80;
        }
        if (0xE0 <= $code) {
            return (($code - 0xE0) << 12) + (($s[2] - 0x80) << 6) + $s[3] - 0x80;
        }
        if (0xC0 <= $code) {
            return (($code - 0xC0) << 6) + $s[2] - 0x80;
        }

        return $code;
    }

    private static function getSubpart($pos, $part, $haystack, $encoding)
    {
        if (false === $pos) {
            return false;
        }
        if ($part) {
            return self::mb_substr($haystack, 0, $pos, $encoding);
        }

        return self::mb_substr($haystack, $pos, null, $encoding);
    }

    private static function html_encoding_callback(array $m)
    {
        $i = 1;
        $entities = '';
        $m = unpack('C*', htmlentities($m[0], ENT_COMPAT, 'UTF-8'));

        while (isset($m[$i])) {
            if (0x80 > $m[$i]) {
                $entities .= \chr($m[$i++]);
                continue;
            }
            if (0xF0 <= $m[$i]) {
                $c = (($m[$i++] - 0xF0) << 18) + (($m[$i++] - 0x80) << 12) + (($m[$i++] - 0x80) << 6) + $m[$i++] - 0x80;
            } elseif (0xE0 <= $m[$i]) {
                $c = (($m[$i++] - 0xE0) << 12) + (($m[$i++] - 0x80) << 6) + $m[$i++] - 0x80;
            } else {
                $c = (($m[$i++] - 0xC0) << 6) + $m[$i++] - 0x80;
            }

            $entities .= '&#'.$c.';';
        }

        return $entities;
    }

    private static function title_case(array $s)
    {
        return self::mb_convert_case($s[1], MB_CASE_UPPER, 'UTF-8').self::mb_convert_case($s[2], MB_CASE_LOWER, 'UTF-8');
    }

    private static function getData($file)
    {
        if (file_exists($file = __DIR__.'/Resources/unidata/'.$file.'.php')) {
            return require $file;
        }

        return false;
    }

    private static function getEncoding($encoding)
    {
        if (null === $encoding) {
            return self::$internalEncoding;
        }

        $encoding = strtoupper($encoding);

        if ('8BIT' === $encoding || 'BINARY' === $encoding) {
            return 'CP850';
        }
        if ('UTF8' === $encoding) {
            return 'UTF-8';
        }

        return $encoding;
    }
}
