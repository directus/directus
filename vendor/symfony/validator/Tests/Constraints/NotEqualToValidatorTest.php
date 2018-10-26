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

use Symfony\Component\Validator\Constraints\NotEqualTo;
use Symfony\Component\Validator\Constraints\NotEqualToValidator;

/**
 * @author Daniel Holmes <daniel@danielholmes.org>
 */
class NotEqualToValidatorTest extends AbstractComparisonValidatorTestCase
{
    protected function createValidator()
    {
        return new NotEqualToValidator();
    }

    protected function createConstraint(array $options = null)
    {
        return new NotEqualTo($options);
    }

    protected function getErrorCode()
    {
        return NotEqualTo::IS_EQUAL_ERROR;
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisons()
    {
        return array(
            array(1, 2),
            array('22', '333'),
            array(new \DateTime('2001-01-01'), new \DateTime('2000-01-01')),
            array(new \DateTime('2001-01-01'), '2000-01-01'),
            array(new \DateTime('2001-01-01 UTC'), '2000-01-01 UTC'),
            array(new ComparisonTest_Class(6), new ComparisonTest_Class(5)),
            array(null, 1),
        );
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisonsToPropertyPath()
    {
        return array(
            array(0),
        );
    }

    /**
     * {@inheritdoc}
     */
    public function provideInvalidComparisons()
    {
        return array(
            array(3, '3', 3, '3', 'integer'),
            array('2', '"2"', 2, '2', 'integer'),
            array('a', '"a"', 'a', '"a"', 'string'),
            array(new \DateTime('2000-01-01'), 'Jan 1, 2000, 12:00 AM', new \DateTime('2000-01-01'), 'Jan 1, 2000, 12:00 AM', 'DateTime'),
            array(new \DateTime('2000-01-01'), 'Jan 1, 2000, 12:00 AM', '2000-01-01', 'Jan 1, 2000, 12:00 AM', 'DateTime'),
            array(new \DateTime('2000-01-01 UTC'), 'Jan 1, 2000, 12:00 AM', '2000-01-01 UTC', 'Jan 1, 2000, 12:00 AM', 'DateTime'),
            array(new ComparisonTest_Class(5), '5', new ComparisonTest_Class(5), '5', __NAMESPACE__.'\ComparisonTest_Class'),
        );
    }
}
