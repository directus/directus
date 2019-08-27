<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Constraints;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\Constraints\Composite;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\NotNull;
use Symfony\Component\Validator\Constraints\Valid;

class ConcreteComposite extends Composite
{
    public $constraints;

    protected function getCompositeOption()
    {
        return 'constraints';
    }

    public function getDefaultOption()
    {
        return 'constraints';
    }
}

/**
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class CompositeTest extends TestCase
{
    public function testMergeNestedGroupsIfNoExplicitParentGroup()
    {
        $constraint = new ConcreteComposite([
            new NotNull(['groups' => 'Default']),
            new NotBlank(['groups' => ['Default', 'Strict']]),
        ]);

        $this->assertEquals(['Default', 'Strict'], $constraint->groups);
        $this->assertEquals(['Default'], $constraint->constraints[0]->groups);
        $this->assertEquals(['Default', 'Strict'], $constraint->constraints[1]->groups);
    }

    public function testSetImplicitNestedGroupsIfExplicitParentGroup()
    {
        $constraint = new ConcreteComposite([
            'constraints' => [
                new NotNull(),
                new NotBlank(),
            ],
            'groups' => ['Default', 'Strict'],
        ]);

        $this->assertEquals(['Default', 'Strict'], $constraint->groups);
        $this->assertEquals(['Default', 'Strict'], $constraint->constraints[0]->groups);
        $this->assertEquals(['Default', 'Strict'], $constraint->constraints[1]->groups);
    }

    public function testExplicitNestedGroupsMustBeSubsetOfExplicitParentGroups()
    {
        $constraint = new ConcreteComposite([
            'constraints' => [
                new NotNull(['groups' => 'Default']),
                new NotBlank(['groups' => 'Strict']),
            ],
            'groups' => ['Default', 'Strict'],
        ]);

        $this->assertEquals(['Default', 'Strict'], $constraint->groups);
        $this->assertEquals(['Default'], $constraint->constraints[0]->groups);
        $this->assertEquals(['Strict'], $constraint->constraints[1]->groups);
    }

    public function testFailIfExplicitNestedGroupsNotSubsetOfExplicitParentGroups()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new ConcreteComposite([
            'constraints' => [
                new NotNull(['groups' => ['Default', 'Foobar']]),
            ],
            'groups' => ['Default', 'Strict'],
        ]);
    }

    public function testImplicitGroupNamesAreForwarded()
    {
        $constraint = new ConcreteComposite([
            new NotNull(['groups' => 'Default']),
            new NotBlank(['groups' => 'Strict']),
        ]);

        $constraint->addImplicitGroupName('ImplicitGroup');

        $this->assertEquals(['Default', 'Strict', 'ImplicitGroup'], $constraint->groups);
        $this->assertEquals(['Default', 'ImplicitGroup'], $constraint->constraints[0]->groups);
        $this->assertEquals(['Strict'], $constraint->constraints[1]->groups);
    }

    public function testSingleConstraintsAccepted()
    {
        $nestedConstraint = new NotNull();
        $constraint = new ConcreteComposite($nestedConstraint);

        $this->assertEquals([$nestedConstraint], $constraint->constraints);
    }

    public function testFailIfNoConstraint()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new ConcreteComposite([
            new NotNull(['groups' => 'Default']),
            'NotBlank',
        ]);
    }

    public function testFailIfNoConstraintObject()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new ConcreteComposite([
            new NotNull(['groups' => 'Default']),
            new \ArrayObject(),
        ]);
    }

    public function testValidCantBeNested()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new ConcreteComposite([
            new Valid(),
        ]);
    }
}
