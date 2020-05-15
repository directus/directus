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

use DateTime;
use JsonSerializable;
use Ramsey\Uuid\Converter\NumberConverterInterface;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;
use Ramsey\Uuid\Exception\UnsupportedOperationException;
use Serializable;

/**
 * UuidInterface defines common functionality for all universally unique
 * identifiers (UUIDs)
 */
interface UuidInterface extends JsonSerializable, Serializable
{
    /**
     * Compares this UUID to the specified UUID.
     *
     * The first of two UUIDs is greater than the second if the most
     * significant field in which the UUIDs differ is greater for the first
     * UUID.
     *
     * * Q. What's the value of being able to sort UUIDs?
     * * A. Use them as keys in a B-Tree or similar mapping.
     *
     * @param UuidInterface $other UUID to which this UUID is compared
     * @return int -1, 0 or 1 as this UUID is less than, equal to, or greater than `$uuid`
     */
    public function compareTo(UuidInterface $other);

    /**
     * Compares this object to the specified object.
     *
     * The result is true if and only if the argument is not null, is a UUID
     * object, has the same variant, and contains the same value, bit for bit,
     * as this UUID.
     *
     * @param object $other
     * @return bool True if `$other` is equal to this UUID
     */
    public function equals($other);

    /**
     * Returns the UUID as a 16-byte string (containing the six integer fields
     * in big-endian byte order).
     *
     * @return string
     */
    public function getBytes();

    /**
     * Returns the number converter to use for converting hex values to/from integers.
     *
     * @return NumberConverterInterface
     */
    public function getNumberConverter();

    /**
     * Returns the hexadecimal value of the UUID.
     *
     * @return string
     */
    public function getHex();

    /**
     * Returns an array of the fields of this UUID, with keys named according
     * to the RFC 4122 names for the fields.
     *
     * * **time_low**: The low field of the timestamp, an unsigned 32-bit integer
     * * **time_mid**: The middle field of the timestamp, an unsigned 16-bit integer
     * * **time_hi_and_version**: The high field of the timestamp multiplexed with
     *   the version number, an unsigned 16-bit integer
     * * **clock_seq_hi_and_reserved**: The high field of the clock sequence
     *   multiplexed with the variant, an unsigned 8-bit integer
     * * **clock_seq_low**: The low field of the clock sequence, an unsigned
     *   8-bit integer
     * * **node**: The spatially unique node identifier, an unsigned 48-bit
     *   integer
     *
     * @return array The UUID fields represented as hexadecimal values
     */
    public function getFieldsHex();

    /**
     * Returns the high field of the clock sequence multiplexed with the variant
     * (bits 65-72 of the UUID).
     *
     * @return string Hexadecimal value of clock_seq_hi_and_reserved
     */
    public function getClockSeqHiAndReservedHex();

    /**
     * Returns the low field of the clock sequence (bits 73-80 of the UUID).
     *
     * @return string Hexadecimal value of clock_seq_low
     */
    public function getClockSeqLowHex();

    /**
     * Returns the clock sequence value associated with this UUID.
     *
     * @return string Hexadecimal value of clock sequence
     */
    public function getClockSequenceHex();

    /**
     * Returns a PHP `DateTime` object representing the timestamp associated
     * with this UUID.
     *
     * The timestamp value is only meaningful in a time-based UUID, which
     * has version type 1. If this UUID is not a time-based UUID then
     * this method throws `UnsupportedOperationException`.
     *
     * @return DateTime A PHP DateTime representation of the date
     * @throws UnsupportedOperationException If this UUID is not a version 1 UUID
     * @throws UnsatisfiedDependencyException if called in a 32-bit system and
     *     `Moontoast\Math\BigNumber` is not present
     */
    public function getDateTime();

    /**
     * Returns the integer value of the UUID, converted to an appropriate number
     * representation.
     *
     * @return mixed Converted representation of the unsigned 128-bit integer value
     * @throws UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     */
    public function getInteger();

    /**
     * Returns the least significant 64 bits of this UUID's 128 bit value.
     *
     * @return string Hexadecimal value of least significant bits
     */
    public function getLeastSignificantBitsHex();

    /**
     * Returns the most significant 64 bits of this UUID's 128 bit value.
     *
     * @return string Hexadecimal value of most significant bits
     */
    public function getMostSignificantBitsHex();

    /**
     * Returns the node value associated with this UUID
     *
     * For UUID version 1, the node field consists of an IEEE 802 MAC
     * address, usually the host address. For systems with multiple IEEE
     * 802 addresses, any available one can be used. The lowest addressed
     * octet (octet number 10) contains the global/local bit and the
     * unicast/multicast bit, and is the first octet of the address
     * transmitted on an 802.3 LAN.
     *
     * For systems with no IEEE address, a randomly or pseudo-randomly
     * generated value may be used; see RFC 4122, Section 4.5. The
     * multicast bit must be set in such addresses, in order that they
     * will never conflict with addresses obtained from network cards.
     *
     * For UUID version 3 or 5, the node field is a 48-bit value constructed
     * from a name as described in RFC 4122, Section 4.3.
     *
     * For UUID version 4, the node field is a randomly or pseudo-randomly
     * generated 48-bit value as described in RFC 4122, Section 4.4.
     *
     * @return string Hexadecimal value of node
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.6
     */
    public function getNodeHex();

    /**
     * Returns the high field of the timestamp multiplexed with the version
     * number (bits 49-64 of the UUID).
     *
     * @return string Hexadecimal value of time_hi_and_version
     */
    public function getTimeHiAndVersionHex();

    /**
     * Returns the low field of the timestamp (the first 32 bits of the UUID).
     *
     * @return string Hexadecimal value of time_low
     */
    public function getTimeLowHex();

    /**
     * Returns the middle field of the timestamp (bits 33-48 of the UUID).
     *
     * @return string Hexadecimal value of time_mid
     */
    public function getTimeMidHex();

    /**
     * Returns the timestamp value associated with this UUID.
     *
     * The 60 bit timestamp value is constructed from the time_low,
     * time_mid, and time_hi fields of this UUID. The resulting
     * timestamp is measured in 100-nanosecond units since midnight,
     * October 15, 1582 UTC.
     *
     * The timestamp value is only meaningful in a time-based UUID, which
     * has version type 1. If this UUID is not a time-based UUID then
     * this method throws UnsupportedOperationException.
     *
     * @return string Hexadecimal value of the timestamp
     * @throws UnsupportedOperationException If this UUID is not a version 1 UUID
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.4
     */
    public function getTimestampHex();

    /**
     * Returns the string representation of the UUID as a URN.
     *
     * @return string
     * @link http://en.wikipedia.org/wiki/Uniform_Resource_Name
     */
    public function getUrn();

    /**
     * Returns the variant number associated with this UUID.
     *
     * The variant number describes the layout of the UUID. The variant
     * number has the following meaning:
     *
     * * 0 - Reserved for NCS backward compatibility
     * * 2 - The RFC 4122 variant (used by this class)
     * * 6 - Reserved, Microsoft Corporation backward compatibility
     * * 7 - Reserved for future definition
     *
     * @return int
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.1
     */
    public function getVariant();

    /**
     * Returns the version number associated with this UUID.
     *
     * The version number describes how this UUID was generated and has the
     * following meaning:
     *
     * * 1 - Time-based UUID
     * * 2 - DCE security UUID
     * * 3 - Name-based UUID hashed with MD5
     * * 4 - Randomly generated UUID
     * * 5 - Name-based UUID hashed with SHA-1
     *
     * Returns null if this UUID is not an RFC 4122 variant, since version
     * is only meaningful for this variant.
     *
     * @return int|null
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.3
     */
    public function getVersion();

    /**
     * Converts this UUID into a string representation.
     *
     * @return string
     */
    public function toString();
}
