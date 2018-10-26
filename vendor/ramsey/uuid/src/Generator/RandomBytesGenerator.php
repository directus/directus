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
 * RandomBytesGenerator provides functionality to generate strings of random
 * binary data using `random_bytes()` function in PHP 7+ or paragonie/random_compat
 *
 * @link http://php.net/random_bytes
 * @link https://github.com/paragonie/random_compat
 */
class RandomBytesGenerator implements RandomGeneratorInterface
{
    /**
     * Generates a string of random binary data of the specified length
     *
     * @param integer $length The number of bytes of random binary data to generate
     * @return string A binary string
     * @throws \Exception if it was not possible to gather sufficient entropy
     */
    public function generate($length)
    {
        return random_bytes($length);
    }
}
