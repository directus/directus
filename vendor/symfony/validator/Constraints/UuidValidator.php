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
 * Validates whether the value is a valid UUID (also known as GUID).
 *
 * Strict validation will allow a UUID as specified per RFC 4122.
 * Loose validation will allow any type of UUID.
 *
 * For better compatibility, both loose and strict, you should consider using a specialized UUID library like "ramsey/uuid" instead.
 *
 * @author Colin O'Dell <colinodell@gmail.com>
 * @author Bernhard Schussek <bschussek@gmail.com>
 *
 * @see http://tools.ietf.org/html/rfc4122
 * @see https://en.wikipedia.org/wiki/Universally_unique_identifier
 * @see https://github.com/ramsey/uuid
 */
class UuidValidator extends ConstraintValidator
{
    // The strict pattern matches UUIDs like this:
    // xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx

    // Roughly speaking:
    // x = any hexadecimal character
    // M = any allowed version {1..5}
    // N = any allowed variant {8, 9, a, b}

    const STRICT_LENGTH = 36;
    const STRICT_FIRST_HYPHEN_POSITION = 8;
    const STRICT_LAST_HYPHEN_POSITION = 23;
    const STRICT_VERSION_POSITION = 14;
    const STRICT_VARIANT_POSITION = 19;

    // The loose pattern validates similar yet non-compliant UUIDs.
    // Hyphens are completely optional. If present, they should only appear
    // between every fourth character:
    // xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx
    // xxxxxxxxxxxx-xxxx-xxxx-xxxx-xxxx-xxxx
    // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    // The value can also be wrapped with characters like []{}:
    // {xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx}

    // Neither the version nor the variant is validated by this pattern.

    const LOOSE_MAX_LENGTH = 39;
    const LOOSE_FIRST_HYPHEN_POSITION = 4;

    /**
     * {@inheritdoc}
     */
    public function validate($value, Constraint $constraint)
    {
        if (!$constraint instanceof Uuid) {
            throw new UnexpectedTypeException($constraint, Uuid::class);
        }

        if (null === $value || '' === $value) {
            return;
        }

        if (!is_scalar($value) && !(\is_object($value) && method_exists($value, '__toString'))) {
            throw new UnexpectedTypeException($value, 'string');
        }

        $value = (string) $value;

        if ($constraint->strict) {
            $this->validateStrict($value, $constraint);

            return;
        }

        $this->validateLoose($value, $constraint);
    }

    private function validateLoose($value, Uuid $constraint)
    {
        // Error priority:
        // 1. ERROR_INVALID_CHARACTERS
        // 2. ERROR_INVALID_HYPHEN_PLACEMENT
        // 3. ERROR_TOO_SHORT/ERROR_TOO_LONG

        // Trim any wrapping characters like [] or {} used by some legacy systems
        $trimmed = trim($value, '[]{}');

        // Position of the next expected hyphen
        $h = self::LOOSE_FIRST_HYPHEN_POSITION;

        // Expected length
        $l = self::LOOSE_MAX_LENGTH;

        for ($i = 0; $i < $l; ++$i) {
            // Check length
            if (!isset($trimmed[$i])) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ value }}', $this->formatValue($value))
                    ->setCode(Uuid::TOO_SHORT_ERROR)
                    ->addViolation();

                return;
            }

            // Hyphens must occur every fifth position
            // xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx
            //     ^    ^    ^    ^    ^    ^    ^
            if ('-' === $trimmed[$i]) {
                if ($i !== $h) {
                    $this->context->buildViolation($constraint->message)
                        ->setParameter('{{ value }}', $this->formatValue($value))
                        ->setCode(Uuid::INVALID_HYPHEN_PLACEMENT_ERROR)
                        ->addViolation();

                    return;
                }

                $h += 5;

                continue;
            }

            // Missing hyphens are ignored
            if ($i === $h) {
                $h += 4;
                --$l;
            }

            // Check characters
            if (!ctype_xdigit($trimmed[$i])) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ value }}', $this->formatValue($value))
                    ->setCode(Uuid::INVALID_CHARACTERS_ERROR)
                    ->addViolation();

                return;
            }
        }

        // Check length again
        if (isset($trimmed[$i])) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Uuid::TOO_LONG_ERROR)
                ->addViolation();
        }
    }

    private function validateStrict($value, Uuid $constraint)
    {
        // Error priority:
        // 1. ERROR_INVALID_CHARACTERS
        // 2. ERROR_INVALID_HYPHEN_PLACEMENT
        // 3. ERROR_TOO_SHORT/ERROR_TOO_LONG
        // 4. ERROR_INVALID_VERSION
        // 5. ERROR_INVALID_VARIANT

        // Position of the next expected hyphen
        $h = self::STRICT_FIRST_HYPHEN_POSITION;

        for ($i = 0; $i < self::STRICT_LENGTH; ++$i) {
            // Check length
            if (!isset($value[$i])) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ value }}', $this->formatValue($value))
                    ->setCode(Uuid::TOO_SHORT_ERROR)
                    ->addViolation();

                return;
            }

            // Check hyphen placement
            // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
            //         ^    ^    ^    ^
            if ('-' === $value[$i]) {
                if ($i !== $h) {
                    $this->context->buildViolation($constraint->message)
                        ->setParameter('{{ value }}', $this->formatValue($value))
                        ->setCode(Uuid::INVALID_HYPHEN_PLACEMENT_ERROR)
                        ->addViolation();

                    return;
                }

                // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
                //                        ^
                if ($h < self::STRICT_LAST_HYPHEN_POSITION) {
                    $h += 5;
                }

                continue;
            }

            // Check characters
            if (!ctype_xdigit($value[$i])) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ value }}', $this->formatValue($value))
                    ->setCode(Uuid::INVALID_CHARACTERS_ERROR)
                    ->addViolation();

                return;
            }

            // Missing hyphen
            if ($i === $h) {
                $this->context->buildViolation($constraint->message)
                    ->setParameter('{{ value }}', $this->formatValue($value))
                    ->setCode(Uuid::INVALID_HYPHEN_PLACEMENT_ERROR)
                    ->addViolation();

                return;
            }
        }

        // Check length again
        if (isset($value[$i])) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Uuid::TOO_LONG_ERROR)
                ->addViolation();
        }

        // Check version
        if (!\in_array($value[self::STRICT_VERSION_POSITION], $constraint->versions)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Uuid::INVALID_VERSION_ERROR)
                ->addViolation();
        }

        // Check variant - first two bits must equal "10"
        //   0b10xx
        // & 0b1100 (12)
        // = 0b1000 (8)
        if (8 !== (hexdec($value[self::STRICT_VARIANT_POSITION]) & 12)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ value }}', $this->formatValue($value))
                ->setCode(Uuid::INVALID_VARIANT_ERROR)
                ->addViolation();
        }
    }
}
