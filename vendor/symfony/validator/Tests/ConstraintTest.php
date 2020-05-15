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
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Tests\Fixtures\ClassConstraint;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintA;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintB;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintC;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintWithValue;
use Symfony\Component\Validator\Tests\Fixtures\ConstraintWithValueAsDefault;

class ConstraintTest extends TestCase
{
    public function testSetProperties()
    {
        $constraint = new ConstraintA([
            'property1' => 'foo',
            'property2' => 'bar',
        ]);

        $this->assertEquals('foo', $constraint->property1);
        $this->assertEquals('bar', $constraint->property2);
    }

    public function testSetNotExistingPropertyThrowsException()
    {
        $this->expectException('Symfony\Component\Validator\Exception\InvalidOptionsException');

        new ConstraintA([
            'foo' => 'bar',
        ]);
    }

    public function testMagicPropertiesAreNotAllowed()
    {
        $constraint = new ConstraintA();

        $this->expectException('Symfony\Component\Validator\Exception\InvalidOptionsException');

        $constraint->foo = 'bar';
    }

    public function testInvalidAndRequiredOptionsPassed()
    {
        $this->expectException('Symfony\Component\Validator\Exception\InvalidOptionsException');

        new ConstraintC([
            'option1' => 'default',
            'foo' => 'bar',
        ]);
    }

    public function testSetDefaultProperty()
    {
        $constraint = new ConstraintA('foo');

        $this->assertEquals('foo', $constraint->property2);
    }

    public function testSetDefaultPropertyDoctrineStyle()
    {
        $constraint = new ConstraintA(['value' => 'foo']);

        $this->assertEquals('foo', $constraint->property2);
    }

    public function testSetDefaultPropertyDoctrineStylePlusOtherProperty()
    {
        $constraint = new ConstraintA(['value' => 'foo', 'property1' => 'bar']);

        $this->assertEquals('foo', $constraint->property2);
        $this->assertEquals('bar', $constraint->property1);
    }

    public function testSetDefaultPropertyDoctrineStyleWhenDefaultPropertyIsNamedValue()
    {
        $constraint = new ConstraintWithValueAsDefault(['value' => 'foo']);

        $this->assertEquals('foo', $constraint->value);
        $this->assertNull($constraint->property);
    }

    public function testDontSetDefaultPropertyIfValuePropertyExists()
    {
        $constraint = new ConstraintWithValue(['value' => 'foo']);

        $this->assertEquals('foo', $constraint->value);
        $this->assertNull($constraint->property);
    }

    public function testSetUndefinedDefaultProperty()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');

        new ConstraintB('foo');
    }

    public function testRequiredOptionsMustBeDefined()
    {
        $this->expectException('Symfony\Component\Validator\Exception\MissingOptionsException');

        new ConstraintC();
    }

    public function testRequiredOptionsPassed()
    {
        $constraint = new ConstraintC(['option1' => 'default']);

        $this->assertSame('default', $constraint->option1);
    }

    public function testGroupsAreConvertedToArray()
    {
        $constraint = new ConstraintA(['groups' => 'Foo']);

        $this->assertEquals(['Foo'], $constraint->groups);
    }

    public function testAddDefaultGroupAddsGroup()
    {
        $constraint = new ConstraintA(['groups' => 'Default']);
        $constraint->addImplicitGroupName('Foo');
        $this->assertEquals(['Default', 'Foo'], $constraint->groups);
    }

    public function testAllowsSettingZeroRequiredPropertyValue()
    {
        $constraint = new ConstraintA(0);
        $this->assertEquals(0, $constraint->property2);
    }

    public function testCanCreateConstraintWithNoDefaultOptionAndEmptyArray()
    {
        $constraint = new ConstraintB([]);

        $this->assertSame([Constraint::PROPERTY_CONSTRAINT, Constraint::CLASS_CONSTRAINT], $constraint->getTargets());
    }

    public function testGetTargetsCanBeString()
    {
        $constraint = new ClassConstraint();

        $this->assertEquals('class', $constraint->getTargets());
    }

    public function testGetTargetsCanBeArray()
    {
        $constraint = new ConstraintA();

        $this->assertEquals(['property', 'class'], $constraint->getTargets());
    }

    public function testSerialize()
    {
        $constraint = new ConstraintA([
            'property1' => 'foo',
            'property2' => 'bar',
        ]);

        $restoredConstraint = unserialize(serialize($constraint));

        $this->assertEquals($constraint, $restoredConstraint);
    }

    public function testSerializeInitializesGroupsOptionToDefault()
    {
        $constraint = new ConstraintA([
            'property1' => 'foo',
            'property2' => 'bar',
        ]);

        $constraint = unserialize(serialize($constraint));

        $expected = new ConstraintA([
            'property1' => 'foo',
            'property2' => 'bar',
            'groups' => 'Default',
        ]);

        $this->assertEquals($expected, $constraint);
    }

    public function testSerializeKeepsCustomGroups()
    {
        $constraint = new ConstraintA([
            'property1' => 'foo',
            'property2' => 'bar',
            'groups' => 'MyGroup',
        ]);

        $constraint = unserialize(serialize($constraint));

        $this->assertSame(['MyGroup'], $constraint->groups);
    }

    public function testGetErrorNameForUnknownCode()
    {
        $this->expectException('Symfony\Component\Validator\Exception\InvalidArgumentException');
        Constraint::getErrorName(1);
    }

    public function testOptionsAsDefaultOption()
    {
        $constraint = new ConstraintA($options = ['value1']);

        $this->assertEquals($options, $constraint->property2);

        $constraint = new ConstraintA($options = ['value1', 'property1' => 'value2']);

        $this->assertEquals($options, $constraint->property2);
    }

    public function testInvalidOptions()
    {
        $this->expectException('Symfony\Component\Validator\Exception\InvalidOptionsException');
        $this->expectExceptionMessage('The options "0", "5" do not exist in constraint "Symfony\Component\Validator\Tests\Fixtures\ConstraintA".');
        new ConstraintA(['property2' => 'foo', 'bar', 5 => 'baz']);
    }

    public function testOptionsWithInvalidInternalPointer()
    {
        $options = ['property1' => 'foo'];
        next($options);
        next($options);

        $constraint = new ConstraintA($options);

        $this->assertEquals('foo', $constraint->property1);
    }

    public function testAnnotationSetUndefinedDefaultOption()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        $this->expectExceptionMessage('No default option is configured for constraint "Symfony\Component\Validator\Tests\Fixtures\ConstraintB".');
        new ConstraintB(['value' => 1]);
    }
}
