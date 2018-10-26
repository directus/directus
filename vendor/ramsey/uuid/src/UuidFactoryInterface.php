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

namespace Ramsey\Uuid;

/**
 * UuidFactoryInterface defines common functionality all `UuidFactory` instances
 * must implement
 */
interface UuidFactoryInterface
{
    /**
     * Generate a version 1 UUID from a host ID, sequence number, and the current time.
     *
     * @param int|string|null $node A 48-bit number representing the hardware address
     *     This number may be represented as an integer or a hexadecimal string.
     * @param int|null $clockSeq A 14-bit number used to help avoid duplicates that
     *     could arise when the clock is set backwards in time or if the node ID
     *     changes.
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\UnsatisfiedDependencyException if called on a 32-bit system and
     *     `Moontoast\Math\BigNumber` is not present
     * @throws \InvalidArgumentException
     * @throws \Exception if it was not possible to gather sufficient entropy
     */
    public function uuid1($node = null, $clockSeq = null);

    /**
     * Generate a version 3 UUID based on the MD5 hash of a namespace identifier
     * (which is a UUID) and a name (which is a string).
     *
     * @param string $ns The UUID namespace in which to create the named UUID
     * @param string $name The name to create a UUID for
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     */
    public function uuid3($ns, $name);

    /**
     * Generate a version 4 (random) UUID.
     *
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     * @throws \InvalidArgumentException
     * @throws \Exception
     */
    public function uuid4();

    /**
     * Generate a version 5 UUID based on the SHA-1 hash of a namespace
     * identifier (which is a UUID) and a name (which is a string).
     *
     * @param string $ns The UUID namespace in which to create the named UUID
     * @param string $name The name to create a UUID for
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     */
    public function uuid5($ns, $name);

    /**
     * Creates a UUID from a byte string.
     *
     * @param string $bytes A 16-byte string representation of a UUID
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     * @throws \InvalidArgumentException if string has not 16 characters
     */
    public function fromBytes($bytes);

    /**
     * Creates a UUID from the string standard representation
     *
     * @param string $uuid A string representation of a UUID
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     */
    public function fromString($uuid);

    /**
     * Creates a `Uuid` from an integer representation
     *
     * The integer representation may be a real integer, a string integer, or
     * an integer representation supported by a configured number converter.
     *
     * @param mixed $integer The integer to use when creating a `Uuid` from an
     *     integer; may be of any type understood by the configured number converter
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     */
    public function fromInteger($integer);
}
