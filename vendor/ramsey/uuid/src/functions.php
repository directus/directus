<?php

/**
 * This file is part of the ramsey/uuid library
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * @copyright Copyright (c) Ben Ramsey <ben@benramsey.com>
 * @license http://opensource.org/licenses/MIT MIT
 */

namespace Ramsey\Uuid;

use Exception;
use InvalidArgumentException;
use Ramsey\Uuid\Exception\InvalidUuidStringException;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

/**
 * Generate a version 1 UUID from a host ID, sequence number, and the current time.
 *
 * @param int|string|null $node A 48-bit number representing the hardware address
 *     This number may be represented as an integer or a hexadecimal string.
 * @param int|null $clockSeq A 14-bit number used to help avoid duplicates that
 *     could arise when the clock is set backwards in time or if the node ID
 *     changes.
 * @return string
 * @throws UnsatisfiedDependencyException if called on a 32-bit system and
 *     `Moontoast\Math\BigNumber` is not present
 * @throws InvalidArgumentException
 * @throws Exception if it was not possible to gather sufficient entropy
 */
function v1($node = null, $clockSeq = null)
{
    return Uuid::uuid1($node, $clockSeq)->toString();
}

/**
 * Generate a version 3 UUID based on the MD5 hash of a namespace identifier
 * (which is a UUID) and a name (which is a string).
 *
 * @param string|UuidInterface $ns The UUID namespace in which to create the named UUID
 * @param string $name The name to create a UUID for
 * @return string
 * @throws InvalidUuidStringException
 */
function v3($ns, $name)
{
    return Uuid::uuid3($ns, $name)->toString();
}

/**
 * Generate a version 4 (random) UUID.
 *
 * @return string
 * @throws UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
 * @throws InvalidArgumentException
 * @throws Exception
 */
function v4()
{
    return Uuid::uuid4()->toString();
}

/**
 * Generate a version 5 UUID based on the SHA-1 hash of a namespace
 * identifier (which is a UUID) and a name (which is a string).
 *
 * @param string|UuidInterface $ns The UUID namespace in which to create the named UUID
 * @param string $name The name to create a UUID for
 * @return string
 * @throws InvalidUuidStringException
 */
function v5($ns, $name)
{
    return Uuid::uuid5($ns, $name)->toString();
}
