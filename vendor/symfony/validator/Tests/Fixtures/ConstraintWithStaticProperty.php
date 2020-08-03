<?php

namespace Symfony\Component\Validator\Tests\Fixtures;

use Symfony\Component\Validator\Constraint;

class ConstraintWithStaticProperty extends Constraint
{
    public static $foo;
}
