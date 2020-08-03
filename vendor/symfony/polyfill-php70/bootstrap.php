<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Symfony\Polyfill\Php70 as p;

if (PHP_VERSION_ID >= 70000) {
    return;
}

if (!defined('PHP_INT_MIN')) {
    define('PHP_INT_MIN', ~PHP_INT_MAX);
}

if (!function_exists('intdiv')) {
    function intdiv($dividend, $divisor) { return p\Php70::intdiv($dividend, $divisor); }
}
if (!function_exists('preg_replace_callback_array')) {
    function preg_replace_callback_array(array $patterns, $subject, $limit = -1, &$count = 0) { return p\Php70::preg_replace_callback_array($patterns, $subject, $limit, $count); }
}
if (!function_exists('error_clear_last')) {
    function error_clear_last() { return p\Php70::error_clear_last(); }
}
