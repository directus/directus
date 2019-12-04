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
 * SodiumRandomGenerator provides functionality to generate strings of random
 * binary data using the PECL libsodium extension
 *
 * @deprecated As of PHP 7.2.0, the libsodium extension is bundled with PHP, and
 *     the random_bytes() PHP function is now the recommended method for
 *     generating random byes. The default RandomBytesGenerator uses the
 *     random_bytes() function.
 *     <em>This generator will be removed in ramsey/uuid 4.0.0.</em>
 * @link http://pecl.php.net/package/libsodium
 * @link https://paragonie.com/book/pecl-libsodium
 */
class SodiumRandomGenerator implements RandomGeneratorInterface
{
    /**
     * Generates a string of random binary data of the specified length
     *
     * @param integer $length The number of bytes of random binary data to generate
     * @return string A binary string
     */
    public function generate($length)
    {
        return \Sodium\randombytes_buf($length);
    }
}
