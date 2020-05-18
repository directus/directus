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
use Symfony\Component\Validator\Constraints\Collection;
use Symfony\Component\Validator\Constraints\Email;
use Symfony\Component\Validator\Constraints\Optional;
use Symfony\Component\Validator\Constraints\Required;
use Symfony\Component\Validator\Constraints\Valid;

/**
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
class CollectionTest extends TestCase
{
    public function testRejectInvalidFieldsOption()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new Collection([
            'fields' => 'foo',
        ]);
    }

    public function testRejectNonConstraints()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new Collection([
            'foo' => 'bar',
        ]);
    }

    public function testRejectValidConstraint()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new Collection([
            'foo' => new Valid(),
        ]);
    }

    public function testRejectValidConstraintWithinOptional()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new Collection([
            'foo' => new Optional(new Valid()),
        ]);
    }

    public function testRejectValidConstraintWithinRequired()
    {
        $this->expectException('Symfony\Component\Validator\Exception\ConstraintDefinitionException');
        new Collection([
            'foo' => new Required(new Valid()),
        ]);
    }

    public function testAcceptOptionalConstraintAsOneElementArray()
    {
        $collection1 = new Collection([
            'fields' => [
                'alternate_email' => [
                    new Optional(new Email()),
                ],
            ],
        ]);

        $collection2 = new Collection([
            'fields' => [
                'alternate_email' => new Optional(new Email()),
            ],
        ]);

        $this->assertEquals($collection1, $collection2);
    }

    public function testAcceptRequiredConstraintAsOneElementArray()
    {
        $collection1 = new Collection([
            'fields' => [
                'alternate_email' => [
                    new Required(new Email()),
                ],
            ],
        ]);

        $collection2 = new Collection([
            'fields' => [
                'alternate_email' => new Required(new Email()),
            ],
        ]);

        $this->assertEquals($collection1, $collection2);
    }

    public function testConstraintHasDefaultGroupWithOptionalValues()
    {
        $constraint = new Collection([
            'foo' => new Required(),
            'bar' => new Optional(),
        ]);

        $this->assertEquals(['Default'], $constraint->groups);
        $this->assertEquals(['Default'], $constraint->fields['foo']->groups);
        $this->assertEquals(['Default'], $constraint->fields['bar']->groups);
    }
}
