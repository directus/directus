<?php
/**
 * This file is part of the ramsey/uuid library
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) Ben Ramsey <ben@benramsey.com>
 * @license http://opensource.org/licenses/MIT MIT
 * @link https://benramsey.com/projects/ramsey-uuid/ Documentation
 * @link https://packagist.org/packages/ramsey/uuid Packagist
 * @link https://github.com/ramsey/uuid GitHub
 */

namespace Ramsey\Uuid\Generator;

/**
 * OpenSslRandomGenerator provides functionality to generate strings of random
 * binary data using the `openssl_random_pseudo_bytes()` PHP function
 *
 * The use of this generator requires PHP to be compiled using the
 * `--with-openssl` option.
 *
 * @deprecated The openssl_random_pseudo_bytes() function is not a reliable
 *     source of randomness. The default RandomBytesGenerator, which uses the
 *     random_bytes() function, is recommended as the safest and most reliable
 *     source of randomness.
 *     <em>This generator will be removed in ramsey/uuid 4.0.0.</em>
 * @link http://php.net/openssl_random_pseudo_bytes
 */
class OpenSslGenerator implements RandomGeneratorInterface
{
    /**
     * Generates a string of random binary data of the specified length
     *
     * @param integer $length The number of bytes of random binary data to generate
     * @return string A binary string
     */
    public function generate($length)
    {
        return openssl_random_pseudo_bytes($length);
    }
}
