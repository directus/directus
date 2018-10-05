<?php
/**
 * Random_* Compatibility Library
 * for using the new PHP 7 random_* API in PHP 5 projects
 *
 * @version 2.0.17
 * @released 2018-07-04
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

if (!defined('PHP_VERSION_ID')) {
    // This constant was introduced in PHP 5.2.7
    $RandomCompatversion = array_map('intval', explode('.', PHP_VERSION));
    define(
        'PHP_VERSION_ID',
        $RandomCompatversion[0] * 10000
        + $RandomCompatversion[1] * 100
        + $RandomCompatversion[2]
    );
    $RandomCompatversion = null;
}

/**
 * PHP 7.0.0 and newer have these functions natively.
 */
if (PHP_VERSION_ID >= 70000) {
    return;
}

if (!defined('RANDOM_COMPAT_READ_BUFFER')) {
    define('RANDOM_COMPAT_READ_BUFFER', 8);
}

$RandomCompatDIR = dirname(__FILE__);

require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'byte_safe_strings.php';
require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'cast_to_int.php';
require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'error_polyfill.php';

if (!is_callable('random_bytes')) {
    /**
     * PHP 5.2.0 - 5.6.x way to implement random_bytes()
     *
     * We use conditional statements here to define the function in accordance
     * to the operating environment. It's a micro-optimization.
     *
     * In order of preference:
     *   1. Use libsodium if available.
     *   2. fread() /dev/urandom if available (never on Windows)
     *   3. mcrypt_create_iv($bytes, MCRYPT_DEV_URANDOM)
     *   4. COM('CAPICOM.Utilities.1')->GetRandom()
     *
     * See RATIONALE.md for our reasoning behind this particular order
     */
    if (extension_loaded('libsodium')) {
        // See random_bytes_libsodium.php
        if (PHP_VERSION_ID >= 50300 && is_callable('\\Sodium\\randombytes_buf')) {
            require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'random_bytes_libsodium.php';
        } elseif (method_exists('Sodium', 'randombytes_buf')) {
            require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'random_bytes_libsodium_legacy.php';
        }
    }

    /**
     * Reading directly from /dev/urandom:
     */
    if (DIRECTORY_SEPARATOR === '/') {
        // DIRECTORY_SEPARATOR === '/' on Unix-like OSes -- this is a fast
        // way to exclude Windows.
        $RandomCompatUrandom = true;
        $RandomCompat_basedir = ini_get('open_basedir');

        if (!empty($RandomCompat_basedir)) {
            $RandomCompat_open_basedir = explode(
                PATH_SEPARATOR,
                strtolower($RandomCompat_basedir)
            );
            $RandomCompatUrandom = (array() !== array_intersect(
                array('/dev', '/dev/', '/dev/urandom'),
                $RandomCompat_open_basedir
            ));
            $RandomCompat_open_basedir = null;
        }

        if (
            !is_callable('random_bytes')
            &&
            $RandomCompatUrandom
            &&
            @is_readable('/dev/urandom')
        ) {
            // Error suppression on is_readable() in case of an open_basedir
            // or safe_mode failure. All we care about is whether or not we
            // can read it at this point. If the PHP environment is going to
            // panic over trying to see if the file can be read in the first
            // place, that is not helpful to us here.

            // See random_bytes_dev_urandom.php
            require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'random_bytes_dev_urandom.php';
        }
        // Unset variables after use
        $RandomCompat_basedir = null;
    } else {
        $RandomCompatUrandom = false;
    }

    /**
     * mcrypt_create_iv()
     *
     * We only want to use mcypt_create_iv() if:
     *
     * - random_bytes() hasn't already been defined
     * - the mcrypt extensions is loaded
     * - One of these two conditions is true:
     *   - We're on Windows (DIRECTORY_SEPARATOR !== '/')
     *   - We're not on Windows and /dev/urandom is readabale
     *     (i.e. we're not in a chroot jail)
     * - Special case:
     *   - If we're not on Windows, but the PHP version is between
     *     5.6.10 and 5.6.12, we don't want to use mcrypt. It will
     *     hang indefinitely. This is bad.
     *   - If we're on Windows, we want to use PHP >= 5.3.7 or else
     *     we get insufficient entropy errors.
     */
    if (
        !is_callable('random_bytes')
        &&
        // Windows on PHP < 5.3.7 is broken, but non-Windows is not known to be.
        (DIRECTORY_SEPARATOR === '/' || PHP_VERSION_ID >= 50307)
        &&
        // Prevent this code from hanging indefinitely on non-Windows;
        // see https://bugs.php.net/bug.php?id=69833
        (
            DIRECTORY_SEPARATOR !== '/' ||
            (PHP_VERSION_ID <= 50609 || PHP_VERSION_ID >= 50613)
        )
        &&
        extension_loaded('mcrypt')
    ) {
        // See random_bytes_mcrypt.php
        require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'random_bytes_mcrypt.php';
    }
    $RandomCompatUrandom = null;

    /**
     * This is a Windows-specific fallback, for when the mcrypt extension
     * isn't loaded.
     */
    if (
        !is_callable('random_bytes')
        &&
        extension_loaded('com_dotnet')
        &&
        class_exists('COM')
    ) {
        $RandomCompat_disabled_classes = preg_split(
            '#\s*,\s*#',
            strtolower(ini_get('disable_classes'))
        );

        if (!in_array('com', $RandomCompat_disabled_classes)) {
            try {
                $RandomCompatCOMtest = new COM('CAPICOM.Utilities.1');
                if (method_exists($RandomCompatCOMtest, 'GetRandom')) {
                    // See random_bytes_com_dotnet.php
                    require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'random_bytes_com_dotnet.php';
                }
            } catch (com_exception $e) {
                // Don't try to use it.
            }
        }
        $RandomCompat_disabled_classes = null;
        $RandomCompatCOMtest = null;
    }

    /**
     * throw new Exception
     */
    if (!is_callable('random_bytes')) {
        /**
         * We don't have any more options, so let's throw an exception right now
         * and hope the developer won't let it fail silently.
         *
         * @param mixed $length
         * @psalm-suppress InvalidReturnType
         * @throws Exception
         * @return string
         */
        function random_bytes($length)
        {
            unset($length); // Suppress "variable not used" warnings.
            throw new Exception(
                'There is no suitable CSPRNG installed on your system'
            );
            return '';
        }
    }
}

if (!is_callable('random_int')) {
    require_once $RandomCompatDIR . DIRECTORY_SEPARATOR . 'random_int.php';
}

$RandomCompatDIR = null;
