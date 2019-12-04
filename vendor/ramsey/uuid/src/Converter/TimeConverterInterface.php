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

namespace Ramsey\Uuid\Converter;

use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

/**
 * TimeConverterInterface provides facilities for converting parts of time into
 * representations that may be used in UUIDs
 */
interface TimeConverterInterface
{
    /**
     * Uses the provided seconds and micro-seconds to calculate the time_low,
     * time_mid, and time_high fields used by RFC 4122 version 1 UUIDs
     *
     * @param string $seconds
     * @param string $microSeconds
     * @return string[] An array guaranteed to contain `low`, `mid`, and `high` keys
     * @throws UnsatisfiedDependencyException if called on a 32-bit system and
     *     `Moontoast\Math\BigNumber` is not present
     * @link http://tools.ietf.org/html/rfc4122#section-4.2.2
     */
    public function calculateTime($seconds, $microSeconds);
}
