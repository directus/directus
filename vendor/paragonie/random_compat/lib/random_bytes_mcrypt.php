<?php
/**
 * Random_* Compatibility Library 
 * for using the new PHP 7 random_* API in PHP 5 projects
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

if (!is_callable('random_bytes')) {
    /**
     * Powered by ext/mcrypt (and thankfully NOT libmcrypt)
     *
     * @ref https://bugs.php.net/bug.php?id=55169
     * @ref https://github.com/php/php-src/blob/c568ffe5171d942161fc8dda066bce844bdef676/ext/mcrypt/mcrypt.c#L1321-L1386
     *
     * @param int $bytes
     *
     * @throws Exception
     *
     * @return string
     */
    function random_bytes($bytes)
    {
        try {
            /** @var int $bytes */
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

        /** @var string|bool $buf */
        $buf = @mcrypt_create_iv((int) $bytes, (int) MCRYPT_DEV_URANDOM);
        if (
            is_string($buf)
                &&
            RandomCompat_strlen($buf) === $bytes
        ) {
            /**
             * Return our random entropy buffer here:
             */
            return $buf;
        }

        /**
         * If we reach here, PHP has failed us.
         */
        throw new Exception(
            'Could not gather sufficient random data'
        );
    }
}
