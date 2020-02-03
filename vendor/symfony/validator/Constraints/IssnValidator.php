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
 * Validates whether the value is a valid ISSN.
 *
 * @author Antonio J. García Lagar <aj@garcialagar.es>
 * @author Bernhard Schussek <bschussek@gmail.com>
 *
 * @see https://en.wikipedia.org/wiki/Issn
 */
class IssnValidator extends ConstraintValidator
{
    /**
     * {@inheritdoc}
     */
    public function validate($value, Constraint $constraint)
    {
        if (!$constraint instanceof Issn) {
            throw new UnexpectedTypeException($constraint, Issn::class);
        }

        if (null === $value || '' === $value) {
            return;
        }

        if (!is_scalar($value) && !(\is_object($value) && method_exists($value, '__toString'))) {
            throw new UnexpectedTypeException($value, 'string');
        }

        $value = (string) $value;
        $canonical = $value;

        // 1234-567X
        //     ^
        if (isset($canonical[4]) && '-' === $canonical[4]) {
            // remove hyphen
            $canonical = substr($canonical, 0, 4).substr($canonical, 5);
        } elseif ($constraint->requireHyphen) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Issn::MISSING_HYPHEN_ERROR)
                ->addViolation();

            return;
        }

        $length = \strlen($canonical);

        if ($length < 8) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Issn::TOO_SHORT_ERROR)
                ->addViolation();

            return;
        }

        if ($length > 8) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Issn::TOO_LONG_ERROR)
                ->addViolation();

            return;
        }

        // 1234567X
        // ^^^^^^^ digits only
        if (!ctype_digit(substr($canonical, 0, 7))) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Issn::INVALID_CHARACTERS_ERROR)
                ->addViolation();

            return;
        }

        // 1234567X
        //        ^ digit, x or X
        if (!ctype_digit($canonical[7]) && 'x' !== $canonical[7] && 'X' !== $canonical[7]) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Issn::INVALID_CHARACTERS_ERROR)
                ->addViolation();

            return;
        }

        // 1234567X
        //        ^ case-sensitive?
        if ($constraint->caseSensitive && 'x' === $canonical[7]) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Issn::INVALID_CASE_ERROR)
                ->addViolation();

            return;
        }

        // Calculate a checksum. "X" equals 10.
        $checkSum = 'X' === $canonical[7]
        || 'x' === $canonical[7]
        ? 10
            : $canonical[7];

        for ($i = 0; $i < 7; ++$i) {
            // Multiply the first digit by 8, the second by 7, etc.
            $checkSum += (8 - $i) * (int) $canonical[$i];
        }

        if (0 !== $checkSum % 11) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Issn::CHECKSUM_FAILED_ERROR)
                ->addViolation();
        }
    }
}
