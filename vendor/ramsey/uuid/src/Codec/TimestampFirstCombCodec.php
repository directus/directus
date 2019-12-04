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
namespace Ramsey\Uuid\Codec;

use Ramsey\Uuid\Exception\InvalidUuidStringException;
use Ramsey\Uuid\UuidInterface;

/**
 * TimestampLastCombCodec encodes and decodes COMB UUIDs which have the timestamp as the first 48 bits.
 * To be used with MySQL, PostgreSQL, Oracle.
 */
class TimestampFirstCombCodec extends StringCodec
{
    /**
     * Encodes a UuidInterface as a string representation of a timestamp first COMB UUID
     *
     * @param UuidInterface $uuid
     *
     * @return string Hexadecimal string representation of a GUID
     */
    public function encode(UuidInterface $uuid)
    {
        $sixPieceComponents = array_values($uuid->getFieldsHex());

        $this->swapTimestampAndRandomBits($sixPieceComponents);

        return vsprintf(
            '%08s-%04s-%04s-%02s%02s-%012s',
            $sixPieceComponents
        );
    }

    /**
     * Encodes a UuidInterface as a binary representation of timestamp first COMB UUID
     *
     * @param UuidInterface $uuid
     *
     * @return string Binary string representation of timestamp first COMB UUID
     */
    public function encodeBinary(UuidInterface $uuid)
    {
        $stringEncoding = $this->encode($uuid);

        return hex2bin(str_replace('-', '', $stringEncoding));
    }

    /**
     * Decodes a string representation of timestamp first COMB UUID into a UuidInterface object instance
     *
     * @param string $encodedUuid
     *
     * @return UuidInterface
     * @throws InvalidUuidStringException
     */
    public function decode($encodedUuid)
    {
        $fivePieceComponents = $this->extractComponents($encodedUuid);

        $this->swapTimestampAndRandomBits($fivePieceComponents);

        return $this->getBuilder()->build($this, $this->getFields($fivePieceComponents));
    }

    /**
     * Decodes a binary representation of timestamp first COMB UUID into a UuidInterface object instance
     *
     * @param string $bytes
     *
     * @return UuidInterface
     * @throws InvalidUuidStringException
     */
    public function decodeBytes($bytes)
    {
        return $this->decode(bin2hex($bytes));
    }

    /**
     * Swaps the first 48 bits with the last 48 bits
     *
     * @param array $components An array of UUID components (the UUID exploded on its dashes)
     *
     * @return void
     */
    protected function swapTimestampAndRandomBits(array &$components)
    {
        $last48Bits = $components[4];
        if (count($components) == 6) {
            $last48Bits = $components[5];
            $components[5] = $components[0] . $components[1];
        } else {
            $components[4] = $components[0] . $components[1];
        }

        $components[0] = substr($last48Bits, 0, 8);
        $components[1] = substr($last48Bits, 8, 4);
    }
}
