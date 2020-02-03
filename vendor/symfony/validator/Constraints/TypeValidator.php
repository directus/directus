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
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class TypeValidator extends ConstraintValidator
{
    /**
     * {@inheritdoc}
     */
    public function validate($value, Constraint $constraint)
    {
        if (!$constraint instanceof Type) {
            throw new UnexpectedTypeException($constraint, Type::class);
        }

        if (null === $value) {
            return;
        }

        $type = strtolower($constraint->type);
        $type = 'boolean' == $type ? 'bool' : $constraint->type;
        $isFunction = 'is_'.$type;
        $ctypeFunction = 'ctype_'.$type;

        if (\function_exists($isFunction) && $isFunction($value)) {
            return;
        } elseif (\function_exists($ctypeFunction) && $ctypeFunction($value)) {
            return;
        } elseif ($value instanceof $constraint->type) {
            return;
        }

        $this->context->buildViolation($constraint->message)
            ->setParameter('{{ value }}', $this->formatValue($value))
            ->setParameter('{{ type }}', $constraint->type)
            ->setCode(Type::INVALID_TYPE_ERROR)
            ->addViolation();
    }
}
