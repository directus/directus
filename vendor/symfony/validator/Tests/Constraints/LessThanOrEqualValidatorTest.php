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

use Symfony\Component\Validator\Constraints\LessThanOrEqual;
use Symfony\Component\Validator\Constraints\LessThanOrEqualValidator;

/**
 * @author Daniel Holmes <daniel@danielholmes.org>
 */
class LessThanOrEqualValidatorTest extends AbstractComparisonValidatorTestCase
{
    protected function createValidator()
    {
        return new LessThanOrEqualValidator();
    }

    protected function createConstraint(array $options = null)
    {
        return new LessThanOrEqual($options);
    }

    protected function getErrorCode()
    {
        return LessThanOrEqual::TOO_HIGH_ERROR;
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisons()
    {
        return array(
            array(1, 2),
            array(1, 1),
            array(new \DateTime('2000-01-01'), new \DateTime('2000-01-01')),
            array(new \DateTime('2000-01-01'), new \DateTime('2020-01-01')),
            array(new \DateTime('2000-01-01'), '2000-01-01'),
            array(new \DateTime('2000-01-01'), '2020-01-01'),
            array(new \DateTime('2000-01-01 UTC'), '2000-01-01 UTC'),
            array(new \DateTime('2000-01-01 UTC'), '2020-01-01 UTC'),
            array(new ComparisonTest_Class(4), new ComparisonTest_Class(5)),
            array(new ComparisonTest_Class(5), new ComparisonTest_Class(5)),
            array('a', 'a'),
            array('a', 'z'),
            array(null, 1),
        );
    }

    /**
     * {@inheritdoc}
     */
    public function provideValidComparisonsToPropertyPath()
    {
        return array(
            array(4),
            array(5),
        );
    }

    /**
     * {@inheritdoc}
     */
    public function provideInvalidComparisons()
    {
        return array(
            array(2, '2', 1, '1', 'integer'),
            array(new \DateTime('2010-01-01'), 'Jan 1, 2010, 12:00 AM', new \DateTime('2000-01-01'), 'Jan 1, 2000, 12:00 AM', 'DateTime'),
            array(new \DateTime('2010-01-01'), 'Jan 1, 2010, 12:00 AM', '2000-01-01', 'Jan 1, 2000, 12:00 AM', 'DateTime'),
            array(new \DateTime('2010-01-01 UTC'), 'Jan 1, 2010, 12:00 AM', '2000-01-01 UTC', 'Jan 1, 2000, 12:00 AM', 'DateTime'),
            array(new ComparisonTest_Class(5), '5', new ComparisonTest_Class(4), '4', __NAMESPACE__.'\ComparisonTest_Class'),
            array('c', '"c"', 'b', '"b"', 'string'),
        );
    }
}
