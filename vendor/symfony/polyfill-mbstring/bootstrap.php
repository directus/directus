<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Symfony\Polyfill\Mbstring as p;

if (!function_exists('mb_convert_encoding')) {
    function mb_convert_encoding($s, $to, $from = null) { return p\Mbstring::mb_convert_encoding($s, $to, $from); }
}
if (!function_exists('mb_decode_mimeheader')) {
    function mb_decode_mimeheader($s) { return p\Mbstring::mb_decode_mimeheader($s); }
}
if (!function_exists('mb_encode_mimeheader')) {
    function mb_encode_mimeheader($s, $charset = null, $transferEnc = null, $lf = null, $indent = null) { return p\Mbstring::mb_encode_mimeheader($s, $charset, $transferEnc, $lf, $indent); }
}
if (!function_exists('mb_decode_numericentity')) {
    function mb_decode_numericentity($s, $convmap, $enc = null) { return p\Mbstring::mb_decode_numericentity($s, $convmap, $enc); }
}
if (!function_exists('mb_encode_numericentity')) {
    function mb_encode_numericentity($s, $convmap, $enc = null, $is_hex = false) { return p\Mbstring::mb_encode_numericentity($s, $convmap, $enc, $is_hex); }
}
if (!function_exists('mb_convert_case')) {
    function mb_convert_case($s, $mode, $enc = null) { return p\Mbstring::mb_convert_case($s, $mode, $enc); }
}
if (!function_exists('mb_internal_encoding')) {
    function mb_internal_encoding($enc = null) { return p\Mbstring::mb_internal_encoding($enc); }
}
if (!function_exists('mb_language')) {
    function mb_language($lang = null) { return p\Mbstring::mb_language($lang); }
}
if (!function_exists('mb_list_encodings')) {
    function mb_list_encodings() { return p\Mbstring::mb_list_encodings(); }
}
if (!function_exists('mb_encoding_aliases')) {
    function mb_encoding_aliases($encoding) { return p\Mbstring::mb_encoding_aliases($encoding); }
}
if (!function_exists('mb_check_encoding')) {
    function mb_check_encoding($var = null, $encoding = null) { return p\Mbstring::mb_check_encoding($var, $encoding); }
}
if (!function_exists('mb_detect_encoding')) {
    function mb_detect_encoding($str, $encodingList = null, $strict = false) { return p\Mbstring::mb_detect_encoding($str, $encodingList, $strict); }
}
if (!function_exists('mb_detect_order')) {
    function mb_detect_order($encodingList = null) { return p\Mbstring::mb_detect_order($encodingList); }
}
if (!function_exists('mb_parse_str')) {
    function mb_parse_str($s, &$result = array()) { parse_str($s, $result); }
}
if (!function_exists('mb_strlen')) {
    function mb_strlen($s, $enc = null) { return p\Mbstring::mb_strlen($s, $enc); }
}
if (!function_exists('mb_strpos')) {
    function mb_strpos($s, $needle, $offset = 0, $enc = null) { return p\Mbstring::mb_strpos($s, $needle, $offset, $enc); }
}
if (!function_exists('mb_strtolower')) {
    function mb_strtolower($s, $enc = null) { return p\Mbstring::mb_strtolower($s, $enc); }
}
if (!function_exists('mb_strtoupper')) {
    function mb_strtoupper($s, $enc = null) { return p\Mbstring::mb_strtoupper($s, $enc); }
}
if (!function_exists('mb_substitute_character')) {
    function mb_substitute_character($char = null) { return p\Mbstring::mb_substitute_character($char); }
}
if (!function_exists('mb_substr')) {
    function mb_substr($s, $start, $length = 2147483647, $enc = null) { return p\Mbstring::mb_substr($s, $start, $length, $enc); }
}
if (!function_exists('mb_stripos')) {
    function mb_stripos($s, $needle, $offset = 0, $enc = null) { return p\Mbstring::mb_stripos($s, $needle, $offset, $enc); }
}
if (!function_exists('mb_stristr')) {
    function mb_stristr($s, $needle, $part = false, $enc = null) { return p\Mbstring::mb_stristr($s, $needle, $part, $enc); }
}
if (!function_exists('mb_strrchr')) {
    function mb_strrchr($s, $needle, $part = false, $enc = null) { return p\Mbstring::mb_strrchr($s, $needle, $part, $enc); }
}
if (!function_exists('mb_strrichr')) {
    function mb_strrichr($s, $needle, $part = false, $enc = null) { return p\Mbstring::mb_strrichr($s, $needle, $part, $enc); }
}
if (!function_exists('mb_strripos')) {
    function mb_strripos($s, $needle, $offset = 0, $enc = null) { return p\Mbstring::mb_strripos($s, $needle, $offset, $enc); }
}
if (!function_exists('mb_strrpos')) {
    function mb_strrpos($s, $needle, $offset = 0, $enc = null) { return p\Mbstring::mb_strrpos($s, $needle, $offset, $enc); }
}
if (!function_exists('mb_strstr')) {
    function mb_strstr($s, $needle, $part = false, $enc = null) { return p\Mbstring::mb_strstr($s, $needle, $part, $enc); }
}
if (!function_exists('mb_get_info')) {
    function mb_get_info($type = 'all') { return p\Mbstring::mb_get_info($type); }
}
if (!function_exists('mb_http_output')) {
    function mb_http_output($enc = null) { return p\Mbstring::mb_http_output($enc); }
}
if (!function_exists('mb_strwidth')) {
    function mb_strwidth($s, $enc = null) { return p\Mbstring::mb_strwidth($s, $enc); }
}
if (!function_exists('mb_substr_count')) {
    function mb_substr_count($haystack, $needle, $enc = null) { return p\Mbstring::mb_substr_count($haystack, $needle, $enc); }
}
if (!function_exists('mb_output_handler')) {
    function mb_output_handler($contents, $status) { return p\Mbstring::mb_output_handler($contents, $status); }
}
if (!function_exists('mb_http_input')) {
    function mb_http_input($type = '') { return p\Mbstring::mb_http_input($type); }
}
if (!function_exists('mb_convert_variables')) {
    function mb_convert_variables($toEncoding, $fromEncoding, &$a = null, &$b = null, &$c = null, &$d = null, &$e = null, &$f = null) { return p\Mbstring::mb_convert_variables($toEncoding, $fromEncoding, $a, $b, $c, $d, $e, $f); }
}
if (!function_exists('mb_ord')) {
    function mb_ord($s, $enc = null) { return p\Mbstring::mb_ord($s, $enc); }
}
if (!function_exists('mb_chr')) {
    function mb_chr($code, $enc = null) { return p\Mbstring::mb_chr($code, $enc); }
}
if (!function_exists('mb_scrub')) {
    function mb_scrub($s, $enc = null) { $enc = null === $enc ? mb_internal_encoding() : $enc; return mb_convert_encoding($s, $enc, $enc); }
}
if (!function_exists('mb_str_split')) {
    function mb_str_split($string, $split_length = 1, $encoding = null) { return p\Mbstring::mb_str_split($string, $split_length, $encoding); }
}

if (extension_loaded('mbstring')) {
    return;
}

if (!defined('MB_CASE_UPPER')) {
    define('MB_CASE_UPPER', 0);
}
if (!defined('MB_CASE_LOWER')) {
    define('MB_CASE_LOWER', 1);
}
if (!defined('MB_CASE_TITLE')) {
    define('MB_CASE_TITLE', 2);
}
