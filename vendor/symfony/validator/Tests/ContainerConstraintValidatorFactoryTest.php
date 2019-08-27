<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests;

use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints\Blank as BlankConstraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\ContainerConstraintValidatorFactory;

class ContainerConstraintValidatorFactoryTest extends TestCase
{
    public function testGetInstanceCreatesValidator()
    {
        $factory = new ContainerConstraintValidatorFactory(new Container());
        $this->assertInstanceOf(DummyConstraintValidator::class, $factory->getInstance(new DummyConstraint()));
    }

    public function testGetInstanceReturnsExistingValidator()
    {
        $factory = new ContainerConstraintValidatorFactory(new Container());
        $v1 = $factory->getInstance(new BlankConstraint());
        $v2 = $factory->getInstance(new BlankConstraint());
        $this->assertSame($v1, $v2);
    }

    public function testGetInstanceReturnsService()
    {
        $validator = new DummyConstraintValidator();
        $container = new Container();
        $container->set(DummyConstraintValidator::class, $validator);

        $factory = new ContainerConstraintValidatorFactory($container);

        $this->assertSame($validator, $factory->getInstance(new DummyConstraint()));
    }

    public function testGetInstanceInvalidValidatorClass()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ValidatorException');
        $constraint = $this->getMockBuilder(Constraint::class)->getMock();
        $constraint
            ->expects($this->once())
            ->method('validatedBy')
            ->willReturn('Fully\\Qualified\\ConstraintValidator\\Class\\Name');

        $factory = new ContainerConstraintValidatorFactory(new Container());
        $factory->getInstance($constraint);
    }
}

class DummyConstraint extends Constraint
{
    public function validatedBy()
    {
        return DummyConstraintValidator::class;
    }
}

class DummyConstraintValidator extends ConstraintValidator
{
    public function validate($value, Constraint $constraint)
    {
    }
}
