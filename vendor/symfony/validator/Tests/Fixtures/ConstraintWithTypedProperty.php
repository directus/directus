<?php

namespace Symfony\Component\Validator\Tests\Fixtures;

use Symfony\Component\Validator\Constraint;

class ConstraintWithTypedProperty extends Constraint
{
    public string $foo;
}
