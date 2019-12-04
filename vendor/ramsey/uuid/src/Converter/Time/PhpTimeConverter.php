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

namespace Ramsey\Uuid\Converter\Time;

use Ramsey\Uuid\Converter\TimeConverterInterface;

/**
 * PhpTimeConverter uses built-in PHP functions and standard math operations
 * available to the PHP programming language to provide facilities for
 * converting parts of time into representations that may be used in UUIDs
 */
class PhpTimeConverter implements TimeConverterInterface
{
    /**
     * Uses the provided seconds and micro-seconds to calculate the time_low,
     * time_mid, and time_high fields used by RFC 4122 version 1 UUIDs
     *
     * @param string $seconds
     * @param string $microSeconds
     * @return string[] An array containing `low`, `mid`, and `high` keys
     * @link http://tools.ietf.org/html/rfc4122#section-4.2.2
     */
    public function calculateTime($seconds, $microSeconds)
    {
        // 0x01b21dd213814000 is the number of 100-ns intervals between the
        // UUID epoch 1582-10-15 00:00:00 and the Unix epoch 1970-01-01 00:00:00.
        $uuidTime = ($seconds * 10000000) + ($microSeconds * 10) + 0x01b21dd213814000;

        return [
            'low' => sprintf('%08x', $uuidTime & 0xffffffff),
            'mid' => sprintf('%04x', ($uuidTime >> 32) & 0xffff),
            'hi' => sprintf('%04x', ($uuidTime >> 48) & 0x0fff),
        ];
    }
}
