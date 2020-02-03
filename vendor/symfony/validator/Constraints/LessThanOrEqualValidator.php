<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Constraints;

/**
 * Validates values are less than or equal to the previous (<=).
 *
 * @author Daniel Holmes <daniel@danielholmes.org>
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class LessThanOrEqualValidator extends AbstractComparisonValidator
{
    /**
     * {@inheritdoc}
     */
    protected function compareValues($value1, $value2)
    {
        return null === $value2 || $value1 <= $value2;
    }

    /**
     * {@inheritdoc}
     */
    protected function getErrorCode()
    {
        return LessThanOrEqual::TOO_HIGH_ERROR;
    }
}
