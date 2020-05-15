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

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

/**
 * Validates a PAN using the LUHN Algorithm.
 *
 * For a list of example card numbers that are used to test this
 * class, please see the LuhnValidatorTest class.
 *
 * @see    http://en.wikipedia.org/wiki/Luhn_algorithm
 *
 * @author Tim Nagel <t.nagel@infinite.net.au>
 * @author Greg Knapp http://gregk.me/2011/php-implementation-of-bank-card-luhn-algorithm/
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class LuhnValidator extends ConstraintValidator
{
    /**
     * Validates a credit card number with the Luhn algorithm.
     *
     * @param mixed $value
     *
     * @throws UnexpectedTypeException when the given credit card number is no string
     */
    public function validate($value, Constraint $constraint)
    {
        if (!$constraint instanceof Luhn) {
            throw new UnexpectedTypeException($constraint, Luhn::class);
        }

        if (null === $value || '' === $value) {
            return;
        }

        // Work with strings only, because long numbers are represented as floats
        // internally and don't work with strlen()
        if (!\is_string($value) && !(\is_object($value) && method_exists($value, '__toString'))) {
            throw new UnexpectedTypeException($value, 'string');
        }

        $value = (string) $value;

        if (!ctype_digit($value)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Luhn::INVALID_CHARACTERS_ERROR)
                ->addViolation();

            return;
        }

        $checkSum = 0;
        $length = \strlen($value);

        // Starting with the last digit and walking left, add every second
        // digit to the check sum
        // e.g. 7  9  9  2  7  3  9  8  7  1  3
        //      ^     ^     ^     ^     ^     ^
        //    = 7  +  9  +  7  +  9  +  7  +  3
        for ($i = $length - 1; $i >= 0; $i -= 2) {
            $checkSum += $value[$i];
        }

        // Starting with the second last digit and walking left, double every
        // second digit and add it to the check sum
        // For doubles greater than 9, sum the individual digits
        // e.g. 7  9  9  2  7  3  9  8  7  1  3
        //         ^     ^     ^     ^     ^
        //    =    1+8 + 4  +  6  +  1+6 + 2
        for ($i = $length - 2; $i >= 0; $i -= 2) {
            $checkSum += array_sum(str_split((int) $value[$i] * 2));
        }

        if (0 === $checkSum || 0 !== $checkSum % 10) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Luhn::CHECKSUM_FAILED_ERROR)
                ->addViolation();
        }
    }
}
