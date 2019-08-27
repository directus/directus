<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

use Symfony\Polyfill\Php56 as p;

if (PHP_VERSION_ID < 50600) {
    if (!function_exists('hash_equals')) {
        function hash_equals($knownString, $userInput) { return p\Php56::hash_equals($knownString, $userInput); }
    }
    if (extension_loaded('ldap') && !function_exists('ldap_escape')) {
        define('LDAP_ESCAPE_FILTER', 1);
        define('LDAP_ESCAPE_DN', 2);

        function ldap_escape($subject, $ignore = '', $flags = 0) { return p\Php56::ldap_escape($subject, $ignore, $flags); }
    }

    if (50509 === PHP_VERSION_ID && 4 === PHP_INT_SIZE) {
        // Missing functions in PHP 5.5.9 - affects 32 bit builds of Ubuntu 14.04LTS
        // See https://bugs.launchpad.net/ubuntu/+source/php5/+bug/1315888
        if (!function_exists('gzopen') && function_exists('gzopen64')) {
            function gzopen($filename, $mode, $use_include_path = 0) { return gzopen64($filename, $mode, $use_include_path); }
        }
        if (!function_exists('gzseek') && function_exists('gzseek64')) {
            function gzseek($zp, $offset, $whence = SEEK_SET) { return gzseek64($zp, $offset, $whence); }
        }
        if (!function_exists('gztell') && function_exists('gztell64')) {
            function gztell($zp) { return gztell64($zp); }
        }
    }
}
