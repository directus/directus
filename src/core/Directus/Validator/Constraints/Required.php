<?php

namespace Directus\Validator\Constraints;

use Symfony\Component\Validator\Constraint;

class Required extends Constraint
{
    public $message = 'This value should not be blank.';
}
