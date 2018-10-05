<?php

namespace Symfony\Component\Validator\Tests\Constraints;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Constraints\ValidValidator;
use Symfony\Component\Validator\ValidatorBuilder;

class ValidValidatorTest extends TestCase
{
    public function testPropertyPathsArePassedToNestedContexts()
    {
        $validatorBuilder = new ValidatorBuilder();
        $validator = $validatorBuilder->enableAnnotationMapping()->getValidator();

        $violations = $validator->validate(new Foo(), null, array('nested'));

        $this->assertCount(1, $violations);
        $this->assertSame('fooBar.fooBarBaz.foo', $violations->get(0)->getPropertyPath());
    }

    public function testNullValues()
    {
        $validatorBuilder = new ValidatorBuilder();
        $validator = $validatorBuilder->enableAnnotationMapping()->getValidator();

        $foo = new Foo();
        $foo->fooBar = null;
        $violations = $validator->validate($foo, null, array('nested'));

        $this->assertCount(0, $violations);
    }

    protected function createValidator()
    {
        return new ValidValidator();
    }
}

class Foo
{
    /**
     * @Assert\Valid(groups={"nested"})
     */
    public $fooBar;

    public function __construct()
    {
        $this->fooBar = new FooBar();
    }
}

class FooBar
{
    /**
     * @Assert\Valid(groups={"nested"})
     */
    public $fooBarBaz;

    public function __construct()
    {
        $this->fooBarBaz = new FooBarBaz();
    }
}

class FooBarBaz
{
    /**
     * @Assert\NotBlank(groups={"nested"})
     */
    public $foo;
}
