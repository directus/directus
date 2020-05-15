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

use Symfony\Component\Validator\Constraints\IdenticalTo;
use Symfony\Component\Validator\Constraints\IdenticalToValidator;

/**
 * @author Daniel Holmes <daniel@danielholmes.org>
 */
class IdenticalToValidatorTest extends AbstractComparisonValidatorTestCase
{
    protected function createValidator()
    {
        return new IdenticalToValidator();
    }

    protected function createConstraint(array $options = null)
    {
        return new IdenticalTo($options);
    }

    protected function getErrorCode()
    {
        return IdenticalTo::NOT_IDENTICAL_ERROR;
    }

    public function provideAllValidComparisons()
    {
        $this->setDefaultTimezone('UTC');

        // Don't call addPhp5Dot5Comparisons() automatically, as it does
        // not take care of identical objects
        $comparisons = $this->provideValidComparisons();

        $this->restoreDefaultTimezone();

        return $comparisons;
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisons()
    {
        $date = new \DateTime('2000-01-01');
        $object = new ComparisonTest_Class(2);

        $comparisons = [
            [3, 3],
            ['a', 'a'],
            [$date, $date],
            [$object, $object],
            [null, 1],
        ];

        $immutableDate = new \DateTimeImmutable('2000-01-01');
        $comparisons[] = [$immutableDate, $immutableDate];

        return $comparisons;
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisonsToPropertyPath()
    {
        return [
            [5],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function provideInvalidComparisons()
    {
        return [
            [1, '1', 2, '2', 'integer'],
            [2, '2', '2', '"2"', 'string'],
            ['22', '"22"', '333', '"333"', 'string'],
            [new \DateTime('2001-01-01'), 'Jan 1, 2001, 12:00 AM', new \DateTime('2001-01-01'), 'Jan 1, 2001, 12:00 AM', 'DateTime'],
            [new \DateTime('2001-01-01'), 'Jan 1, 2001, 12:00 AM', new \DateTime('1999-01-01'), 'Jan 1, 1999, 12:00 AM', 'DateTime'],
            [new ComparisonTest_Class(4), '4', new ComparisonTest_Class(5), '5', __NAMESPACE__.'\ComparisonTest_Class'],
        ];
    }

    public function provideComparisonsToNullValueAtPropertyPath()
    {
        return [
            [5, '5', false],
        ];
    }
}
