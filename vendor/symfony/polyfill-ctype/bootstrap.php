<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Symfony\Polyfill\Ctype as p;

if (!function_exists('ctype_alnum')) {
    function ctype_alnum($text) { return p\Ctype::ctype_alnum($text); }
    function ctype_alpha($text) { return p\Ctype::ctype_alpha($text); }
    function ctype_cntrl($text) { return p\Ctype::ctype_cntrl($text); }
    function ctype_digit($text) { return p\Ctype::ctype_digit($text); }
    function ctype_graph($text) { return p\Ctype::ctype_graph($text); }
    function ctype_lower($text) { return p\Ctype::ctype_lower($text); }
    function ctype_print($text) { return p\Ctype::ctype_print($text); }
    function ctype_punct($text) { return p\Ctype::ctype_punct($text); }
    function ctype_space($text) { return p\Ctype::ctype_space($text); }
    function ctype_upper($text) { return p\Ctype::ctype_upper($text); }
    function ctype_xdigit($text) { return p\Ctype::ctype_xdigit($text); }
}
