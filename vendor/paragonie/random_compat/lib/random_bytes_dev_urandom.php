<?php
/**
 * Random_* Compatibility Library 
 * for using the new PHP 7 random_* API in PHP 5 projects
 * 
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2017 Paragon Initiative Enterprises
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

if (!defined('RANDOM_COMPAT_READ_BUFFER')) {
    define('RANDOM_COMPAT_READ_BUFFER', 8);
}

if (!is_callable('random_bytes')) {
    /**
     * Unless open_basedir is enabled, use /dev/urandom for
     * random numbers in accordance with best practices
     *
     * Why we use /dev/urandom and not /dev/random
     * @ref http://sockpuppet.org/blog/2014/02/25/safely-generate-random-numbers
     *
     * @param int $bytes
     *
     * @throws Exception
     *
     * @return string
     */
    function random_bytes($bytes)
    {
        static $fp = null;
        /**
         * This block should only be run once
         */
        if (empty($fp)) {
            /**
             * We use /dev/urandom if it is a char device.
             * We never fall back to /dev/random
             */
            $fp = fopen('/dev/urandom', 'rb');
            if (!empty($fp)) {
                $st = fstat($fp);
                if (($st['mode'] & 0170000) !== 020000) {
                    fclose($fp);
                    $fp = false;
                }
            }

            if (!empty($fp)) {
                /**
                 * stream_set_read_buffer() does not exist in HHVM
                 *
                 * If we don't set the stream's read buffer to 0, PHP will
                 * internally buffer 8192 bytes, which can waste entropy
                 *
                 * stream_set_read_buffer returns 0 on success
                 */
                if (is_callable('stream_set_read_buffer')) {
                    stream_set_read_buffer($fp, RANDOM_COMPAT_READ_BUFFER);
                }
                if (is_callable('stream_set_chunk_size')) {
                    stream_set_chunk_size($fp, RANDOM_COMPAT_READ_BUFFER);
                }
            }
        }

        try {
            $bytes = RandomCompat_intval($bytes);
        } catch (TypeError $ex) {
            throw new TypeError(
                'random_bytes(): $bytes must be an integer'
            );
        }

        if ($bytes < 1) {
            throw new Error(
                'Length must be greater than 0'
            );
        }

        /**
         * This if() block only runs if we managed to open a file handle
         *
         * It does not belong in an else {} block, because the above
         * if (empty($fp)) line is logic that should only be run once per
         * page load.
         */
        if (!empty($fp)) {
            /**
             * @var int
             */
            $remaining = $bytes;

            /**
             * @var string|bool
             */
            $buf = '';

            /**
             * We use fread() in a loop to protect against partial reads
             */
            do {
                /**
                 * @var string|bool
                 */
                $read = fread($fp, $remaining);
                if (!is_string($read)) {
                    if ($read === false) {
                        /**
                         * We cannot safely read from the file. Exit the
                         * do-while loop and trigger the exception condition
                         *
                         * @var string|bool
                         */
                        $buf = false;
                        break;
                    }
                }
                /**
                 * Decrease the number of bytes returned from remaining
                 */
                $remaining -= RandomCompat_strlen($read);
                /**
                 * @var string|bool
                 */
                $buf = $buf . $read;
            } while ($remaining > 0);

            /**
             * Is our result valid?
             */
            if (is_string($buf)) {
                if (RandomCompat_strlen($buf) === $bytes) {
                    /**
                     * Return our random entropy buffer here:
                     */
                    return $buf;
                }
            }
        }

        /**
         * If we reach here, PHP has failed us.
         */
        throw new Exception(
            'Error reading from source device'
        );
    }
}
