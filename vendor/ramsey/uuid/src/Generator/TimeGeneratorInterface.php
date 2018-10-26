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
 * TimeGeneratorInterface provides functionality to generate strings of binary
 * data for version 1 UUIDs based on a host ID, sequence number, and the current
 * time
 */
interface TimeGeneratorInterface
{
    /**
     * Generate a version 1 UUID from a host ID, sequence number, and the current time
     *
     * @param int|string $node A 48-bit number representing the hardware address
     *     This number may be represented as an integer or a hexadecimal string.
     * @param int $clockSeq A 14-bit number used to help avoid duplicates that
     *     could arise when the clock is set backwards in time or if the node ID
     *     changes.
     * @return string A binary string
     * @throws \Ramsey\Uuid\Exception\UnsatisfiedDependencyException if called on a 32-bit system and
     *     `Moontoast\Math\BigNumber` is not present
     * @throws \InvalidArgumentException
     * @throws \Exception if it was not possible to gather sufficient entropy
     */
    public function generate($node = null, $clockSeq = null);
}
