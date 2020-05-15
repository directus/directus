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

namespace Ramsey\Uuid\Provider\Time;

use InvalidArgumentException;
use Ramsey\Uuid\Provider\TimeProviderInterface;

/**
 * FixedTimeProvider uses an previously-generated timestamp to provide the time
 *
 * This provider allows the use of a previously-generated timestamp, such as one
 * stored in a database, when creating version 1 UUIDs.
 */
class FixedTimeProvider implements TimeProviderInterface
{
    /**
     * @var int[] Array containing `sec` and `usec` components of a timestamp
     */
    private $fixedTime;

    /**
     * Constructs a `FixedTimeProvider` using the provided `$timestamp`
     *
     * @param int[] Array containing `sec` and `usec` components of a timestamp
     * @throws InvalidArgumentException if the `$timestamp` does not contain `sec` or `usec` components
     */
    public function __construct(array $timestamp)
    {
        if (!array_key_exists('sec', $timestamp) || !array_key_exists('usec', $timestamp)) {
            throw new InvalidArgumentException('Array must contain sec and usec keys.');
        }

        $this->fixedTime = $timestamp;
    }

    /**
     * Sets the `usec` component of the timestamp
     *
     * @param int $value The `usec` value to set
     */
    public function setUsec($value)
    {
        $this->fixedTime['usec'] = $value;
    }

    /**
     * Sets the `sec` component of the timestamp
     *
     * @param int $value The `sec` value to set
     */
    public function setSec($value)
    {
        $this->fixedTime['sec'] = $value;
    }

    /**
     * Returns a timestamp array
     *
     * @return int[] Array containing `sec` and `usec` components of a timestamp
     */
    public function currentTime()
    {
        return $this->fixedTime;
    }
}
