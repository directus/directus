<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use Symfony\Component\Validator\Constraints\GreaterThanOrEqual;
use Symfony\Component\Validator\Constraints\GreaterThanOrEqualValidator;

/**
 * @author Daniel Holmes <daniel@danielholmes.org>
 */
class GreaterThanOrEqualValidatorTest extends AbstractComparisonValidatorTestCase
{
    protected function createValidator()
    {
        return new GreaterThanOrEqualValidator();
    }

    protected function createConstraint(array $options = null)
    {
        return new GreaterThanOrEqual($options);
    }

    protected function getErrorCode()
    {
        return GreaterThanOrEqual::TOO_LOW_ERROR;
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisons()
    {
        return [
            [3, 2],
            [1, 1],
            [new \DateTime('2010/01/01'), new \DateTime('2000/01/01')],
            [new \DateTime('2000/01/01'), new \DateTime('2000/01/01')],
            [new \DateTime('2010/01/01'), '2000/01/01'],
            [new \DateTime('2000/01/01'), '2000/01/01'],
            [new \DateTime('2010/01/01 UTC'), '2000/01/01 UTC'],
            [new \DateTime('2000/01/01 UTC'), '2000/01/01 UTC'],
            ['a', 'a'],
            ['z', 'a'],
            [null, 1],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisonsToPropertyPath()
    {
        return [
            [5],
            [6],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function provideInvalidComparisons()
    {
        return [
            [1, '1', 2, '2', 'integer'],
            [new \DateTime('2000/01/01'), 'Jan 1, 2000, 12:00 AM', new \DateTime('2005/01/01'), 'Jan 1, 2005, 12:00 AM', 'DateTime'],
            [new \DateTime('2000/01/01'), 'Jan 1, 2000, 12:00 AM', '2005/01/01', 'Jan 1, 2005, 12:00 AM', 'DateTime'],
            [new \DateTime('2000/01/01 UTC'), 'Jan 1, 2000, 12:00 AM', '2005/01/01 UTC', 'Jan 1, 2005, 12:00 AM', 'DateTime'],
            ['b', '"b"', 'c', '"c"', 'string'],
        ];
    }

    public function provideComparisonsToNullValueAtPropertyPath()
    {
        return [
            [5, '5', true],
        ];
    }
}
