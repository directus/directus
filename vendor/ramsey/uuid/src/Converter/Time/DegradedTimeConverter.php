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
use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;

/**
 * DegradedTimeConverter throws `UnsatisfiedDependencyException` exceptions
 * if attempting to use time conversion functionality in an environment that
 * does not support large integers (i.e. when moontoast/math is not available)
 */
class DegradedTimeConverter implements TimeConverterInterface
{
    /**
     * Throws an `UnsatisfiedDependencyException`
     *
     * @param string $seconds
     * @param string $microSeconds
     * @return void
     * @throws UnsatisfiedDependencyException if called on a 32-bit system and `Moontoast\Math\BigNumber` is not present
     */
    public function calculateTime($seconds, $microSeconds)
    {
        throw new UnsatisfiedDependencyException(
            'When calling ' . __METHOD__ . ' on a 32-bit system, '
            . 'Moontoast\Math\BigNumber must be present.'
        );
    }
}
