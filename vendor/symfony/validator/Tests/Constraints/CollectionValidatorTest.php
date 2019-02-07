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

use Symfony\Component\Validator\Constraints\Collection;
use Symfony\Component\Validator\Constraints\CollectionValidator;
use Symfony\Component\Validator\Constraints\NotNull;
use Symfony\Component\Validator\Constraints\Optional;
use Symfony\Component\Validator\Constraints\Range;
use Symfony\Component\Validator\Constraints\Required;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

abstract class CollectionValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator()
    {
        return new CollectionValidator();
    }

    abstract protected function prepareTestData(array $contents);

    public function testNullIsValid()
    {
        $this->validator->validate(null, new Collection(['fields' => [
            'foo' => new Range(['min' => 4]),
        ]]));

        $this->assertNoViolation();
    }

    public function testFieldsAsDefaultOption()
    {
        $constraint = new Range(['min' => 4]);

        $data = $this->prepareTestData(['foo' => 'foobar']);

        $this->expectValidateValueAt(0, '[foo]', $data['foo'], [$constraint]);

        $this->validator->validate($data, new Collection([
            'foo' => $constraint,
        ]));

        $this->assertNoViolation();
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\UnexpectedTypeException
     */
    public function testThrowsExceptionIfNotTraversable()
    {
        $this->validator->validate('foobar', new Collection(['fields' => [
            'foo' => new Range(['min' => 4]),
        ]]));
    }

    public function testWalkSingleConstraint()
    {
        $constraint = new Range(['min' => 4]);

        $array = [
            'foo' => 3,
            'bar' => 5,
        ];

        $i = 0;

        foreach ($array as $key => $value) {
            $this->expectValidateValueAt($i++, '['.$key.']', $value, [$constraint]);
        }

        $data = $this->prepareTestData($array);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => $constraint,
                'bar' => $constraint,
            ],
        ]));

        $this->assertNoViolation();
    }

    public function testWalkMultipleConstraints()
    {
        $constraints = [
            new Range(['min' => 4]),
            new NotNull(),
        ];

        $array = [
            'foo' => 3,
            'bar' => 5,
        ];

        $i = 0;

        foreach ($array as $key => $value) {
            $this->expectValidateValueAt($i++, '['.$key.']', $value, $constraints);
        }

        $data = $this->prepareTestData($array);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => $constraints,
                'bar' => $constraints,
            ],
        ]));

        $this->assertNoViolation();
    }

    public function testExtraFieldsDisallowed()
    {
        $constraint = new Range(['min' => 4]);

        $data = $this->prepareTestData([
            'foo' => 5,
            'baz' => 6,
        ]);

        $this->expectValidateValueAt(0, '[foo]', $data['foo'], [$constraint]);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => $constraint,
            ],
            'extraFieldsMessage' => 'myMessage',
        ]));

        $this->buildViolation('myMessage')
            ->setParameter('{{ field }}', '"baz"')
            ->atPath('property.path[baz]')
            ->setInvalidValue(6)
            ->setCode(Collection::NO_SUCH_FIELD_ERROR)
            ->assertRaised();
    }

    // bug fix
    public function testNullNotConsideredExtraField()
    {
        $data = $this->prepareTestData([
            'foo' => null,
        ]);

        $constraint = new Range(['min' => 4]);

        $this->expectValidateValueAt(0, '[foo]', $data['foo'], [$constraint]);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => $constraint,
            ],
        ]));

        $this->assertNoViolation();
    }

    public function testExtraFieldsAllowed()
    {
        $data = $this->prepareTestData([
            'foo' => 5,
            'bar' => 6,
        ]);

        $constraint = new Range(['min' => 4]);

        $this->expectValidateValueAt(0, '[foo]', $data['foo'], [$constraint]);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => $constraint,
            ],
            'allowExtraFields' => true,
        ]));

        $this->assertNoViolation();
    }

    public function testMissingFieldsDisallowed()
    {
        $data = $this->prepareTestData([]);

        $constraint = new Range(['min' => 4]);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => $constraint,
            ],
            'missingFieldsMessage' => 'myMessage',
        ]));

        $this->buildViolation('myMessage')
            ->setParameter('{{ field }}', '"foo"')
            ->atPath('property.path[foo]')
            ->setInvalidValue(null)
            ->setCode(Collection::MISSING_FIELD_ERROR)
            ->assertRaised();
    }

    public function testMissingFieldsAllowed()
    {
        $data = $this->prepareTestData([]);

        $constraint = new Range(['min' => 4]);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => $constraint,
            ],
            'allowMissingFields' => true,
        ]));

        $this->assertNoViolation();
    }

    public function testOptionalFieldPresent()
    {
        $data = $this->prepareTestData([
            'foo' => null,
        ]);

        $this->validator->validate($data, new Collection([
            'foo' => new Optional(),
        ]));

        $this->assertNoViolation();
    }

    public function testOptionalFieldNotPresent()
    {
        $data = $this->prepareTestData([]);

        $this->validator->validate($data, new Collection([
            'foo' => new Optional(),
        ]));

        $this->assertNoViolation();
    }

    public function testOptionalFieldSingleConstraint()
    {
        $array = [
            'foo' => 5,
        ];

        $constraint = new Range(['min' => 4]);

        $this->expectValidateValueAt(0, '[foo]', $array['foo'], [$constraint]);

        $data = $this->prepareTestData($array);

        $this->validator->validate($data, new Collection([
            'foo' => new Optional($constraint),
        ]));

        $this->assertNoViolation();
    }

    public function testOptionalFieldMultipleConstraints()
    {
        $array = [
            'foo' => 5,
        ];

        $constraints = [
            new NotNull(),
            new Range(['min' => 4]),
        ];

        $this->expectValidateValueAt(0, '[foo]', $array['foo'], $constraints);

        $data = $this->prepareTestData($array);

        $this->validator->validate($data, new Collection([
            'foo' => new Optional($constraints),
        ]));

        $this->assertNoViolation();
    }

    public function testRequiredFieldPresent()
    {
        $data = $this->prepareTestData([
            'foo' => null,
        ]);

        $this->validator->validate($data, new Collection([
            'foo' => new Required(),
        ]));

        $this->assertNoViolation();
    }

    public function testRequiredFieldNotPresent()
    {
        $data = $this->prepareTestData([]);

        $this->validator->validate($data, new Collection([
            'fields' => [
                'foo' => new Required(),
            ],
            'missingFieldsMessage' => 'myMessage',
        ]));

        $this->buildViolation('myMessage')
            ->setParameter('{{ field }}', '"foo"')
            ->atPath('property.path[foo]')
            ->setInvalidValue(null)
            ->setCode(Collection::MISSING_FIELD_ERROR)
            ->assertRaised();
    }

    public function testRequiredFieldSingleConstraint()
    {
        $array = [
            'foo' => 5,
        ];

        $constraint = new Range(['min' => 4]);

        $this->expectValidateValueAt(0, '[foo]', $array['foo'], [$constraint]);

        $data = $this->prepareTestData($array);

        $this->validator->validate($data, new Collection([
            'foo' => new Required($constraint),
        ]));

        $this->assertNoViolation();
    }

    public function testRequiredFieldMultipleConstraints()
    {
        $array = [
            'foo' => 5,
        ];

        $constraints = [
            new NotNull(),
            new Range(['min' => 4]),
        ];

        $this->expectValidateValueAt(0, '[foo]', $array['foo'], $constraints);

        $data = $this->prepareTestData($array);

        $this->validator->validate($data, new Collection([
            'foo' => new Required($constraints),
        ]));

        $this->assertNoViolation();
    }

    public function testObjectShouldBeLeftUnchanged()
    {
        $value = new \ArrayObject([
            'foo' => 3,
        ]);

        $constraint = new Range(['min' => 2]);

        $this->expectValidateValueAt(0, '[foo]', $value['foo'], [$constraint]);

        $this->validator->validate($value, new Collection([
            'fields' => [
                'foo' => $constraint,
            ],
        ]));

        $this->assertEquals([
            'foo' => 3,
        ], (array) $value);
    }
}
