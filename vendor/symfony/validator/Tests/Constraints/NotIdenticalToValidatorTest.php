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

use Symfony\Component\Validator\Constraints\NotIdenticalTo;
use Symfony\Component\Validator\Constraints\NotIdenticalToValidator;

/**
 * @author Daniel Holmes <daniel@danielholmes.org>
 */
class NotIdenticalToValidatorTest extends AbstractComparisonValidatorTestCase
{
    protected function createValidator()
    {
        return new NotIdenticalToValidator();
    }

    protected function createConstraint(array $options = null)
    {
        return new NotIdenticalTo($options);
    }

    protected function getErrorCode()
    {
        return NotIdenticalTo::IS_IDENTICAL_ERROR;
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisons()
    {
        return [
            [1, 2],
            ['2', 2],
            ['22', '333'],
            [new \DateTime('2001-01-01'), new \DateTime('2000-01-01')],
            [new \DateTime('2000-01-01'), new \DateTime('2000-01-01')],
            [new \DateTime('2001-01-01'), '2000-01-01'],
            [new \DateTime('2000-01-01'), '2000-01-01'],
            [new \DateTime('2001-01-01'), '2000-01-01'],
            [new \DateTime('2000-01-01 UTC'), '2000-01-01 UTC'],
            [null, 1],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisonsToPropertyPath()
    {
        return [
            [0],
        ];
    }

    public function provideAllInvalidComparisons()
    {
        $this->setDefaultTimezone('UTC');

        // Don't call addPhp5Dot5Comparisons() automatically, as it does
        // not take care of identical objects
        $comparisons = $this->provideInvalidComparisons();

        $this->restoreDefaultTimezone();

        return $comparisons;
    }

    /**
     * {@inheritdoc}
     */
    public function provideInvalidComparisons()
    {
        $date = new \DateTime('2000-01-01');
        $object = new ComparisonTest_Class(2);

        $comparisons = [
            [3, '3', 3, '3', 'integer'],
            ['a', '"a"', 'a', '"a"', 'string'],
            [$date, 'Jan 1, 2000, 12:00 AM', $date, 'Jan 1, 2000, 12:00 AM', 'DateTime'],
            [$object, '2', $object, '2', __NAMESPACE__.'\ComparisonTest_Class'],
        ];

        return $comparisons;
    }

    public function provideComparisonsToNullValueAtPropertyPath()
    {
        return [
            [5, '5', true],
        ];
    }
}
