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
 * CodecInterface represents a UUID coder-decoder
 */
interface CodecInterface
{
    /**
     * Encodes a UuidInterface as a string representation of a UUID
     *
     * @param UuidInterface $uuid
     * @return string Hexadecimal string representation of a UUID
     */
    public function encode(UuidInterface $uuid);

    /**
     * Encodes a UuidInterface as a binary representation of a UUID
     *
     * @param UuidInterface $uuid
     * @return string Binary string representation of a UUID
     */
    public function encodeBinary(UuidInterface $uuid);

    /**
     * Decodes a string representation of a UUID into a UuidInterface object instance
     *
     * @param string $encodedUuid
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     */
    public function decode($encodedUuid);

    /**
     * Decodes a binary representation of a UUID into a UuidInterface object instance
     *
     * @param string $bytes
     * @return UuidInterface
     * @throws \Ramsey\Uuid\Exception\InvalidUuidStringException
     * @throws \InvalidArgumentException if string has not 16 characters
     */
    public function decodeBytes($bytes);
}
