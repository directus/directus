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

use Ramsey\Uuid\UuidInterface;

/**
 * GuidStringCodec encodes and decodes globally unique identifiers (GUID)
 *
 * @link https://en.wikipedia.org/wiki/Globally_unique_identifier
 */
class GuidStringCodec extends StringCodec
{
    /**
     * Encodes a UuidInterface as a string representation of a GUID
     *
     * @param UuidInterface $uuid
     * @return string Hexadecimal string representation of a GUID
     */
    public function encode(UuidInterface $uuid)
    {
        $components = array_values($uuid->getFieldsHex());

        // Swap byte-order on the first three fields
        $this->swapFields($components);

        return vsprintf(
            '%08s-%04s-%04s-%02s%02s-%012s',
            $components
        );
    }

    /**
     * Encodes a UuidInterface as a binary representation of a GUID
     *
     * @param UuidInterface $uuid
     * @return string Binary string representation of a GUID
     */
    public function encodeBinary(UuidInterface $uuid)
    {
        $components = array_values($uuid->getFieldsHex());

        return hex2bin(implode('', $components));
    }

    /**
     * Decodes a string representation of a GUID into a UuidInterface object instance
     *
     * @param string $encodedUuid
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     */
    public function decode($encodedUuid)
    {
        $components = $this->extractComponents($encodedUuid);

        $this->swapFields($components);

        return $this->getBuilder()->build($this, $this->getFields($components));
    }

    /**
     * Decodes a binary representation of a GUID into a UuidInterface object instance
     *
     * @param string $bytes
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     */
    public function decodeBytes($bytes)
    {
        // Specifically call parent::decode to preserve correct byte order
        return parent::decode(bin2hex($bytes));
    }

    /**
     * Swaps fields to support GUID byte order
     *
     * @param array $components An array of UUID components (the UUID exploded on its dashes)
     * @return void
     */
    protected function swapFields(array &$components)
    {
        $hex = unpack('H*', pack('L', hexdec($components[0])));
        $components[0] = $hex[1];
        $hex = unpack('H*', pack('S', hexdec($components[1])));
        $components[1] = $hex[1];
        $hex = unpack('H*', pack('S', hexdec($components[2])));
        $components[2] = $hex[1];
    }
}
