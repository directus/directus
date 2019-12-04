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
use Exception;
use InvalidArgumentException;
use Ramsey\Uuid\Converter\NumberConverterInterface;
use Ramsey\Uuid\Codec\CodecInterface;
use Ramsey\Uuid\Exception\InvalidUuidStringException;
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;
use Ramsey\Uuid\Exception\UnsupportedOperationException;

/**
 * Represents a universally unique identifier (UUID), according to RFC 4122.
 *
 * This class provides immutable UUID objects (the Uuid class) and the static
 * methods `uuid1()`, `uuid3()`, `uuid4()`, and `uuid5()` for generating version
 * 1, 3, 4, and 5 UUIDs as specified in RFC 4122.
 *
 * If all you want is a unique ID, you should probably call `uuid1()` or `uuid4()`.
 * Note that `uuid1()` may compromise privacy since it creates a UUID containing
 * the computer’s network address. `uuid4()` creates a random UUID.
 *
 * @link http://tools.ietf.org/html/rfc4122
 * @link http://en.wikipedia.org/wiki/Universally_unique_identifier
 * @link http://docs.python.org/3/library/uuid.html
 * @link http://docs.oracle.com/javase/6/docs/api/java/util/UUID.html
 */
class Uuid implements UuidInterface
{
    /**
     * When this namespace is specified, the name string is a fully-qualified domain name.
     * @link http://tools.ietf.org/html/rfc4122#appendix-C
     */
    const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

    /**
     * When this namespace is specified, the name string is a URL.
     * @link http://tools.ietf.org/html/rfc4122#appendix-C
     */
    const NAMESPACE_URL = '6ba7b811-9dad-11d1-80b4-00c04fd430c8';

    /**
     * When this namespace is specified, the name string is an ISO OID.
     * @link http://tools.ietf.org/html/rfc4122#appendix-C
     */
    const NAMESPACE_OID = '6ba7b812-9dad-11d1-80b4-00c04fd430c8';

    /**
     * When this namespace is specified, the name string is an X.500 DN in DER or a text output format.
     * @link http://tools.ietf.org/html/rfc4122#appendix-C
     */
    const NAMESPACE_X500 = '6ba7b814-9dad-11d1-80b4-00c04fd430c8';

    /**
     * The nil UUID is special form of UUID that is specified to have all 128 bits set to zero.
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.7
     */
    const NIL = '00000000-0000-0000-0000-000000000000';

    /**
     * Reserved for NCS compatibility.
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.1
     */
    const RESERVED_NCS = 0;

    /**
     * Specifies the UUID layout given in RFC 4122.
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.1
     */
    const RFC_4122 = 2;

    /**
     * Reserved for Microsoft compatibility.
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.1
     */
    const RESERVED_MICROSOFT = 6;

    /**
     * Reserved for future definition.
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.1
     */
    const RESERVED_FUTURE = 7;

    /**
     * Regular expression pattern for matching a valid UUID of any variant.
     */
    const VALID_PATTERN = '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$';

    /**
     * Version 1 (time-based) UUID object constant identifier
     */
    const UUID_TYPE_TIME = 1;

    /**
     * Version 2 (identifier-based) UUID object constant identifier
     */
    const UUID_TYPE_IDENTIFIER = 2;

    /**
     * Version 3 (name-based and hashed with MD5) UUID object constant identifier
     */
    const UUID_TYPE_HASH_MD5 = 3;

    /**
     * Version 4 (random) UUID object constant identifier
     */
    const UUID_TYPE_RANDOM = 4;

    /**
     * Version 5 (name-based and hashed with SHA1) UUID object constant identifier
     */
    const UUID_TYPE_HASH_SHA1 = 5;

    /**
     * The factory to use when creating UUIDs.
     * @var UuidFactoryInterface
     */
    private static $factory = null;

    /**
     * The codec to use when encoding or decoding UUID strings.
     * @var CodecInterface
     */
    protected $codec;

    /**
     * The fields that make up this UUID.
     *
     * This is initialized to the nil value.
     *
     * @var array
     * @see UuidInterface::getFieldsHex()
     */
    protected $fields = [
        'time_low' => '00000000',
        'time_mid' => '0000',
        'time_hi_and_version' => '0000',
        'clock_seq_hi_and_reserved' => '00',
        'clock_seq_low' => '00',
        'node' => '000000000000',
    ];

    /**
     * The number converter to use for converting hex values to/from integers.
     * @var NumberConverterInterface
     */
    protected $converter;

    /**
     * Creates a universally unique identifier (UUID) from an array of fields.
     *
     * Unless you're making advanced use of this library to generate identifiers
     * that deviate from RFC 4122, you probably do not want to instantiate a
     * UUID directly. Use the static methods, instead:
     *
     * ```
     * use Ramsey\Uuid\Uuid;
     *
     * $timeBasedUuid     = Uuid::uuid1();
     * $namespaceMd5Uuid  = Uuid::uuid3(Uuid::NAMESPACE_URL, 'http://php.net/');
     * $randomUuid        = Uuid::uuid4();
     * $namespaceSha1Uuid = Uuid::uuid5(Uuid::NAMESPACE_URL, 'http://php.net/');
     * ```
     *
     * @param array $fields An array of fields from which to construct a UUID;
     *     see {@see \Ramsey\Uuid\UuidInterface::getFieldsHex()} for array structure.
     * @param NumberConverterInterface $converter The number converter to use
     *     for converting hex values to/from integers.
     * @param CodecInterface $codec The codec to use when encoding or decoding
     *     UUID strings.
     */
    public function __construct(
        array $fields,
        NumberConverterInterface $converter,
        CodecInterface $codec
    ) {
        $this->fields = $fields;
        $this->codec = $codec;
        $this->converter = $converter;
    }

    /**
     * Converts this UUID object to a string when the object is used in any
     * string context.
     *
     * @return string
     * @link http://www.php.net/manual/en/language.oop5.magic.php#object.tostring
     */
    public function __toString()
    {
        return $this->toString();
    }

    /**
     * Converts this UUID object to a string when the object is serialized
     * with `json_encode()`
     *
     * @return string
     * @link http://php.net/manual/en/class.jsonserializable.php
     */
    public function jsonSerialize()
    {
        return $this->toString();
    }

    /**
     * Converts this UUID object to a string when the object is serialized
     * with `serialize()`
     *
     * @return string
     * @link http://php.net/manual/en/class.serializable.php
     */
    public function serialize()
    {
        return $this->toString();
    }

    /**
     * Re-constructs the object from its serialized form.
     *
     * @param string $serialized
     * @link http://php.net/manual/en/class.serializable.php
     * @throws InvalidUuidStringException
     */
    public function unserialize($serialized)
    {
        $uuid = self::fromString($serialized);
        $this->codec = $uuid->codec;
        $this->converter = $uuid->converter;
        $this->fields = $uuid->fields;
    }

    public function compareTo(UuidInterface $other)
    {
        if ($this->getMostSignificantBitsHex() < $other->getMostSignificantBitsHex()) {
            return -1;
        }

        if ($this->getMostSignificantBitsHex() > $other->getMostSignificantBitsHex()) {
            return 1;
        }

        if ($this->getLeastSignificantBitsHex() < $other->getLeastSignificantBitsHex()) {
            return -1;
        }

        if ($this->getLeastSignificantBitsHex() > $other->getLeastSignificantBitsHex()) {
            return 1;
        }

        return 0;
    }

    public function equals($other)
    {
        if (!$other instanceof UuidInterface) {
            return false;
        }

        return $this->compareTo($other) == 0;
    }

    public function getBytes()
    {
        return $this->codec->encodeBinary($this);
    }

    /**
     * Returns the high field of the clock sequence multiplexed with the variant
     * (bits 65-72 of the UUID).
     *
     * @return int Unsigned 8-bit integer value of clock_seq_hi_and_reserved
     */
    public function getClockSeqHiAndReserved()
    {
        return hexdec($this->getClockSeqHiAndReservedHex());
    }

    public function getClockSeqHiAndReservedHex()
    {
        return $this->fields['clock_seq_hi_and_reserved'];
    }

    /**
     * Returns the low field of the clock sequence (bits 73-80 of the UUID).
     *
     * @return int Unsigned 8-bit integer value of clock_seq_low
     */
    public function getClockSeqLow()
    {
        return hexdec($this->getClockSeqLowHex());
    }

    public function getClockSeqLowHex()
    {
        return $this->fields['clock_seq_low'];
    }

    /**
     * Returns the clock sequence value associated with this UUID.
     *
     * For UUID version 1, the clock sequence is used to help avoid
     * duplicates that could arise when the clock is set backwards in time
     * or if the node ID changes.
     *
     * For UUID version 3 or 5, the clock sequence is a 14-bit value
     * constructed from a name as described in RFC 4122, Section 4.3.
     *
     * For UUID version 4, clock sequence is a randomly or pseudo-randomly
     * generated 14-bit value as described in RFC 4122, Section 4.4.
     *
     * @return int Unsigned 14-bit integer value of clock sequence
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.5
     */
    public function getClockSequence()
    {
        return ($this->getClockSeqHiAndReserved() & 0x3f) << 8 | $this->getClockSeqLow();
    }

    public function getClockSequenceHex()
    {
        return sprintf('%04x', $this->getClockSequence());
    }

    public function getNumberConverter()
    {
        return $this->converter;
    }

    /**
     * @inheritdoc
     */
    public function getDateTime()
    {
        if ($this->getVersion() != 1) {
            throw new UnsupportedOperationException('Not a time-based UUID');
        }

        $unixTime = ($this->getTimestamp() - 0x01b21dd213814000) / 1e7;
        $unixTime = number_format($unixTime, 0, '', '');

        return new DateTime("@{$unixTime}");
    }

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
     * @return array The UUID fields represented as integer values
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.2
     */
    public function getFields()
    {
        return [
            'time_low' => $this->getTimeLow(),
            'time_mid' => $this->getTimeMid(),
            'time_hi_and_version' => $this->getTimeHiAndVersion(),
            'clock_seq_hi_and_reserved' => $this->getClockSeqHiAndReserved(),
            'clock_seq_low' => $this->getClockSeqLow(),
            'node' => $this->getNode(),
        ];
    }

    public function getFieldsHex()
    {
        return $this->fields;
    }

    public function getHex()
    {
        return str_replace('-', '', $this->toString());
    }

    /**
     * @inheritdoc
     */
    public function getInteger()
    {
        return $this->converter->fromHex($this->getHex());
    }

    /**
     * Returns the least significant 64 bits of this UUID's 128 bit value.
     *
     * @return mixed Converted representation of the unsigned 64-bit integer value
     * @throws UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     */
    public function getLeastSignificantBits()
    {
        return $this->converter->fromHex($this->getLeastSignificantBitsHex());
    }

    public function getLeastSignificantBitsHex()
    {
        return sprintf(
            '%02s%02s%012s',
            $this->fields['clock_seq_hi_and_reserved'],
            $this->fields['clock_seq_low'],
            $this->fields['node']
        );
    }

    /**
     * Returns the most significant 64 bits of this UUID's 128 bit value.
     *
     * @return mixed Converted representation of the unsigned 64-bit integer value
     * @throws UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     */
    public function getMostSignificantBits()
    {
        return $this->converter->fromHex($this->getMostSignificantBitsHex());
    }

    public function getMostSignificantBitsHex()
    {
        return sprintf(
            '%08s%04s%04s',
            $this->fields['time_low'],
            $this->fields['time_mid'],
            $this->fields['time_hi_and_version']
        );
    }

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
     * @return int Unsigned 48-bit integer value of node
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.6
     */
    public function getNode()
    {
        return hexdec($this->getNodeHex());
    }

    public function getNodeHex()
    {
        return $this->fields['node'];
    }

    /**
     * Returns the high field of the timestamp multiplexed with the version
     * number (bits 49-64 of the UUID).
     *
     * @return int Unsigned 16-bit integer value of time_hi_and_version
     */
    public function getTimeHiAndVersion()
    {
        return hexdec($this->getTimeHiAndVersionHex());
    }

    public function getTimeHiAndVersionHex()
    {
        return $this->fields['time_hi_and_version'];
    }

    /**
     * Returns the low field of the timestamp (the first 32 bits of the UUID).
     *
     * @return int Unsigned 32-bit integer value of time_low
     */
    public function getTimeLow()
    {
        return hexdec($this->getTimeLowHex());
    }

    public function getTimeLowHex()
    {
        return $this->fields['time_low'];
    }

    /**
     * Returns the middle field of the timestamp (bits 33-48 of the UUID).
     *
     * @return int Unsigned 16-bit integer value of time_mid
     */
    public function getTimeMid()
    {
        return hexdec($this->getTimeMidHex());
    }

    public function getTimeMidHex()
    {
        return $this->fields['time_mid'];
    }

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
     * @return int Unsigned 60-bit integer value of the timestamp
     * @throws UnsupportedOperationException If this UUID is not a version 1 UUID
     * @link http://tools.ietf.org/html/rfc4122#section-4.1.4
     */
    public function getTimestamp()
    {
        if ($this->getVersion() != 1) {
            throw new UnsupportedOperationException('Not a time-based UUID');
        }

        return hexdec($this->getTimestampHex());
    }

    /**
     * @inheritdoc
     */
    public function getTimestampHex()
    {
        if ($this->getVersion() != 1) {
            throw new UnsupportedOperationException('Not a time-based UUID');
        }

        return sprintf(
            '%03x%04s%08s',
            ($this->getTimeHiAndVersion() & 0x0fff),
            $this->fields['time_mid'],
            $this->fields['time_low']
        );
    }

    public function getUrn()
    {
        return 'urn:uuid:' . $this->toString();
    }

    public function getVariant()
    {
        $clockSeq = $this->getClockSeqHiAndReserved();

        if (0 === ($clockSeq & 0x80)) {
            return self::RESERVED_NCS;
        }

        if (0 === ($clockSeq & 0x40)) {
            return self::RFC_4122;
        }

        if (0 === ($clockSeq & 0x20)) {
            return self::RESERVED_MICROSOFT;
        }

        return self::RESERVED_FUTURE;
    }

    public function getVersion()
    {
        if ($this->getVariant() == self::RFC_4122) {
            return (int) (($this->getTimeHiAndVersion() >> 12) & 0x0f);
        }

        return null;
    }

    public function toString()
    {
        return $this->codec->encode($this);
    }

    /**
     * Returns the currently set factory used to create UUIDs.
     *
     * @return UuidFactoryInterface
     */
    public static function getFactory()
    {
        if (!self::$factory) {
            self::$factory = new UuidFactory();
        }

        return self::$factory;
    }

    /**
     * Sets the factory used to create UUIDs.
     *
     * @param UuidFactoryInterface $factory
     */
    public static function setFactory(UuidFactoryInterface $factory)
    {
        self::$factory = $factory;
    }

    /**
     * Creates a UUID from a byte string.
     *
     * @param string $bytes
     * @return UuidInterface
     * @throws InvalidUuidStringException
     * @throws InvalidArgumentException
     */
    public static function fromBytes($bytes)
    {
        return self::getFactory()->fromBytes($bytes);
    }

    /**
     * Creates a UUID from the string standard representation.
     *
     * @param string $name A string that specifies a UUID
     * @return UuidInterface
     * @throws InvalidUuidStringException
     */
    public static function fromString($name)
    {
        return self::getFactory()->fromString($name);
    }

    /**
     * Creates a UUID from a 128-bit integer string.
     *
     * @param string $integer String representation of 128-bit integer
     * @return UuidInterface
     * @throws UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     * @throws InvalidUuidStringException
     */
    public static function fromInteger($integer)
    {
        return self::getFactory()->fromInteger($integer);
    }

    /**
     * Check if a string is a valid UUID.
     *
     * @param string $uuid The string UUID to test
     * @return boolean
     */
    public static function isValid($uuid)
    {
        $uuid = str_replace(['urn:', 'uuid:', '{', '}'], '', $uuid);

        if ($uuid == self::NIL) {
            return true;
        }

        if (!preg_match('/' . self::VALID_PATTERN . '/D', $uuid)) {
            return false;
        }

        return true;
    }

    /**
     * Generate a version 1 UUID from a host ID, sequence number, and the current time.
     *
     * @param int|string $node A 48-bit number representing the hardware address
     *     This number may be represented as an integer or a hexadecimal string.
     * @param int $clockSeq A 14-bit number used to help avoid duplicates that
     *     could arise when the clock is set backwards in time or if the node ID
     *     changes.
     * @return UuidInterface
     * @throws UnsatisfiedDependencyException if called on a 32-bit system and
     *     `Moontoast\Math\BigNumber` is not present
     * @throws InvalidArgumentException
     * @throws Exception if it was not possible to gather sufficient entropy
     */
    public static function uuid1($node = null, $clockSeq = null)
    {
        return self::getFactory()->uuid1($node, $clockSeq);
    }

    /**
     * Generate a version 3 UUID based on the MD5 hash of a namespace identifier
     * (which is a UUID) and a name (which is a string).
     *
     * @param string|UuidInterface $ns The UUID namespace in which to create the named UUID
     * @param string $name The name to create a UUID for
     * @return UuidInterface
     * @throws InvalidUuidStringException
     */
    public static function uuid3($ns, $name)
    {
        return self::getFactory()->uuid3($ns, $name);
    }

    /**
     * Generate a version 4 (random) UUID.
     *
     * @return UuidInterface
     * @throws UnsatisfiedDependencyException if `Moontoast\Math\BigNumber` is not present
     * @throws InvalidArgumentException
     * @throws Exception
     */
    public static function uuid4()
    {
        return self::getFactory()->uuid4();
    }

    /**
     * Generate a version 5 UUID based on the SHA-1 hash of a namespace
     * identifier (which is a UUID) and a name (which is a string).
     *
     * @param string|UuidInterface $ns The UUID namespace in which to create the named UUID
     * @param string $name The name to create a UUID for
     * @return UuidInterface
     * @throws InvalidUuidStringException
     */
    public static function uuid5($ns, $name)
    {
        return self::getFactory()->uuid5($ns, $name);
    }
}
