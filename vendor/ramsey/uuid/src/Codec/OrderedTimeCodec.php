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

use InvalidArgumentException;
use Ramsey\Uuid\UuidInterface;

/**
 * OrderedTimeCodec optimizes the bytes to increment UUIDs when time goes by, to improve database INSERTs.
 * The string value will be unchanged from StringCodec. Only works for UUID type 1.
 */
class OrderedTimeCodec extends StringCodec
{

    /**
     * Encodes a UuidInterface as an optimized binary representation of a UUID
     *
     * @param UuidInterface $uuid
     * @return string Binary string representation of a UUID
     */
    public function encodeBinary(UuidInterface $uuid)
    {
        $fields = $uuid->getFieldsHex();

        $optimized = [
            $fields['time_hi_and_version'],
            $fields['time_mid'],
            $fields['time_low'],
            $fields['clock_seq_hi_and_reserved'],
            $fields['clock_seq_low'],
            $fields['node'],
        ];

        return hex2bin(implode('', $optimized));
    }

    /**
     * Decodes an optimized binary representation of a UUID into a UuidInterface object instance
     *
     * @param string $bytes
     * @return UuidInterface
     * @throws \InvalidArgumentException if string has not 16 characters
     */
    public function decodeBytes($bytes)
    {
        if (strlen($bytes) !== 16) {
            throw new InvalidArgumentException('$bytes string should contain 16 characters.');
        }

        $hex = unpack('H*', $bytes)[1];

        // Rearrange the fields to their original order
        $hex = substr($hex, 8, 4) . substr($hex, 12, 4) . substr($hex, 4, 4) . substr($hex, 0, 4) . substr($hex, 16);

        return $this->decode($hex);
    }
}
