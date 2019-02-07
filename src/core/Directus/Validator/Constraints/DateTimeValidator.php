<?php

namespace Directus\Validator\Constraints;

use function Directus\get_iso8601_format;
use function Directus\is_iso8601_datetime;
use Symfony\Component\Validator\Constraint;

class DateTimeValidator extends \Symfony\Component\Validator\Constraints\DateTimeValidator
{
    public function validate($value, Constraint $constraint)
    {
        if ($constraint instanceof DateTime && is_iso8601_datetime($value)) {
            $constraint->format = get_iso8601_format($value);
        }

        parent::validate($value, $constraint);
    }
}
