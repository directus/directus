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

namespace Ramsey\Uuid\Converter\Number;

use Ramsey\Uuid\Exception\UnsatisfiedDependencyException;
use Ramsey\Uuid\Converter\NumberConverterInterface;

/**
 * DegradedNumberConverter throws `UnsatisfiedDependencyException` exceptions
 * if attempting to use number conversion functionality in an environment that
 * does not support large integers (i.e. when moontoast/math is not available)
 */
class DegradedNumberConverter implements NumberConverterInterface
{
    /**
     * Throws an `UnsatisfiedDependencyException`
     *
     * @param string $hex The hexadecimal string representation to convert
     * @return void
     * @throws UnsatisfiedDependencyException
     */
    public function fromHex($hex)
    {
        throw new UnsatisfiedDependencyException(
            'Cannot call ' . __METHOD__ . ' without support for large '
            . 'integers, since integer is an unsigned '
            . '128-bit integer; Moontoast\Math\BigNumber is required.'
        );
    }

    /**
     * Throws an `UnsatisfiedDependencyException`
     *
     * @param mixed $integer An integer representation to convert
     * @return void
     * @throws UnsatisfiedDependencyException
     */
    public function toHex($integer)
    {
        throw new UnsatisfiedDependencyException(
            'Cannot call ' . __METHOD__ . ' without support for large '
            . 'integers, since integer is an unsigned '
            . '128-bit integer; Moontoast\Math\BigNumber is required. '
        );
    }
}
