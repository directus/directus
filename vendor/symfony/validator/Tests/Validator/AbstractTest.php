<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\Validator;

use Symfony\Component\Validator\Constraints\Callback;
use Symfony\Component\Validator\Constraints\Collection;
use Symfony\Component\Validator\Constraints\Expression;
use Symfony\Component\Validator\Constraints\GroupSequence;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\NotNull;
use Symfony\Component\Validator\Constraints\Traverse;
use Symfony\Component\Validator\Constraints\Valid;
use Symfony\Component\Validator\ConstraintViolationInterface;
use Symfony\Component\Validator\Context\ExecutionContextInterface;
use Symfony\Component\Validator\Mapping\ClassMetadata;
use Symfony\Component\Validator\Mapping\Factory\MetadataFactoryInterface;
use Symfony\Component\Validator\Tests\Fixtures\Entity;
use Symfony\Component\Validator\Tests\Fixtures\FailingConstraint;
use Symfony\Component\Validator\Tests\Fixtures\Reference;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * @author Bernhard Schussek <bschussek@gmail.com>
 */
abstract class AbstractTest extends AbstractValidatorTest
{
    /**
     * @var ValidatorInterface
     */
    protected $validator;

    /**
     * @return ValidatorInterface
     */
    abstract protected function createValidator(MetadataFactoryInterface $metadataFactory, array $objectInitializers = []);

    protected function setUp()
    {
        parent::setUp();

        $this->validator = $this->createValidator($this->metadataFactory);
    }

    protected function validate($value, $constraints = null, $groups = null)
    {
        return $this->validator->validate($value, $constraints, $groups);
    }

    protected function validateProperty($object, $propertyName, $groups = null)
    {
        return $this->validator->validateProperty($object, $propertyName, $groups);
    }

    protected function validatePropertyValue($object, $propertyName, $value, $groups = null)
    {
        return $this->validator->validatePropertyValue($object, $propertyName, $value, $groups);
    }

    public function testValidateConstraintWithoutGroup()
    {
        $violations = $this->validator->validate(null, new NotNull());

        $this->assertCount(1, $violations);
    }

    public function testValidateWithEmptyArrayAsConstraint()
    {
        $violations = $this->validator->validate('value', []);
        $this->assertCount(0, $violations);
    }

    public function testGroupSequenceAbortsAfterFailedGroup()
    {
        $entity = new Entity();

        $callback1 = function ($value, ExecutionContextInterface $context) {
            $context->addViolation('Message 1');
        };
        $callback2 = function ($value, ExecutionContextInterface $context) {
            $context->addViolation('Message 2');
        };

        $this->metadata->addConstraint(new Callback([
            'callback' => function () {},
            'groups' => 'Group 1',
        ]));
        $this->metadata->addConstraint(new Callback([
            'callback' => $callback1,
            'groups' => 'Group 2',
        ]));
        $this->metadata->addConstraint(new Callback([
            'callback' => $callback2,
            'groups' => 'Group 3',
        ]));

        $sequence = new GroupSequence(['Group 1', 'Group 2', 'Group 3']);
        $violations = $this->validator->validate($entity, new Valid(), $sequence);

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
        $this->assertSame('Message 1', $violations[0]->getMessage());
    }

    public function testGroupSequenceIncludesReferences()
    {
        $entity = new Entity();
        $entity->reference = new Reference();

        $callback1 = function ($value, ExecutionContextInterface $context) {
            $context->addViolation('Reference violation 1');
        };
        $callback2 = function ($value, ExecutionContextInterface $context) {
            $context->addViolation('Reference violation 2');
        };

        $this->metadata->addPropertyConstraint('reference', new Valid());
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback1,
            'groups' => 'Group 1',
        ]));
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback2,
            'groups' => 'Group 2',
        ]));

        $sequence = new GroupSequence(['Group 1', 'Entity']);
        $violations = $this->validator->validate($entity, new Valid(), $sequence);

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
        $this->assertSame('Reference violation 1', $violations[0]->getMessage());
    }

    public function testValidateInSeparateContext()
    {
        $entity = new Entity();
        $entity->reference = new Reference();

        $callback1 = function ($value, ExecutionContextInterface $context) use ($entity) {
            $violations = $context
                ->getValidator()
                // Since the validator is not context aware, the group must
                // be passed explicitly
                ->validate($value->reference, new Valid(), 'Group')
            ;

            /* @var ConstraintViolationInterface[] $violations */
            $this->assertCount(1, $violations);
            $this->assertSame('Message value', $violations[0]->getMessage());
            $this->assertSame('Message %param%', $violations[0]->getMessageTemplate());
            $this->assertSame(['%param%' => 'value'], $violations[0]->getParameters());
            $this->assertSame('', $violations[0]->getPropertyPath());

            // The root is different as we're in a new context
            $this->assertSame($entity->reference, $violations[0]->getRoot());
            $this->assertSame($entity->reference, $violations[0]->getInvalidValue());
            $this->assertNull($violations[0]->getPlural());
            $this->assertNull($violations[0]->getCode());

            // Verify that this method is called
            $context->addViolation('Separate violation');
        };

        $callback2 = function ($value, ExecutionContextInterface $context) use ($entity) {
            $this->assertSame($this::REFERENCE_CLASS, $context->getClassName());
            $this->assertNull($context->getPropertyName());
            $this->assertSame('', $context->getPropertyPath());
            $this->assertSame('Group', $context->getGroup());
            $this->assertSame($this->referenceMetadata, $context->getMetadata());
            $this->assertSame($entity->reference, $context->getRoot());
            $this->assertSame($entity->reference, $context->getValue());
            $this->assertSame($entity->reference, $value);

            $context->addViolation('Message %param%', ['%param%' => 'value']);
        };

        $this->metadata->addConstraint(new Callback([
            'callback' => $callback1,
            'groups' => 'Group',
        ]));
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback2,
            'groups' => 'Group',
        ]));

        $violations = $this->validator->validate($entity, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
        $this->assertSame('Separate violation', $violations[0]->getMessage());
    }

    public function testValidateInContext()
    {
        $entity = new Entity();
        $entity->reference = new Reference();

        $callback1 = function ($value, ExecutionContextInterface $context) {
            $previousValue = $context->getValue();
            $previousObject = $context->getObject();
            $previousMetadata = $context->getMetadata();
            $previousPath = $context->getPropertyPath();
            $previousGroup = $context->getGroup();

            $context
                ->getValidator()
                ->inContext($context)
                ->atPath('subpath')
                ->validate($value->reference)
            ;

            // context changes shouldn't leak out of the validate() call
            $this->assertSame($previousValue, $context->getValue());
            $this->assertSame($previousObject, $context->getObject());
            $this->assertSame($previousMetadata, $context->getMetadata());
            $this->assertSame($previousPath, $context->getPropertyPath());
            $this->assertSame($previousGroup, $context->getGroup());
        };

        $callback2 = function ($value, ExecutionContextInterface $context) use ($entity) {
            $this->assertSame($this::REFERENCE_CLASS, $context->getClassName());
            $this->assertNull($context->getPropertyName());
            $this->assertSame('subpath', $context->getPropertyPath());
            $this->assertSame('Group', $context->getGroup());
            $this->assertSame($this->referenceMetadata, $context->getMetadata());
            $this->assertSame($entity, $context->getRoot());
            $this->assertSame($entity->reference, $context->getValue());
            $this->assertSame($entity->reference, $value);

            $context->addViolation('Message %param%', ['%param%' => 'value']);
        };

        $this->metadata->addConstraint(new Callback([
            'callback' => $callback1,
            'groups' => 'Group',
        ]));
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback2,
            'groups' => 'Group',
        ]));

        $violations = $this->validator->validate($entity, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
        $this->assertSame('Message value', $violations[0]->getMessage());
        $this->assertSame('Message %param%', $violations[0]->getMessageTemplate());
        $this->assertSame(['%param%' => 'value'], $violations[0]->getParameters());
        $this->assertSame('subpath', $violations[0]->getPropertyPath());
        $this->assertSame($entity, $violations[0]->getRoot());
        $this->assertSame($entity->reference, $violations[0]->getInvalidValue());
        $this->assertNull($violations[0]->getPlural());
        $this->assertNull($violations[0]->getCode());
    }

    public function testValidateArrayInContext()
    {
        $entity = new Entity();
        $entity->reference = new Reference();

        $callback1 = function ($value, ExecutionContextInterface $context) {
            $previousValue = $context->getValue();
            $previousObject = $context->getObject();
            $previousMetadata = $context->getMetadata();
            $previousPath = $context->getPropertyPath();
            $previousGroup = $context->getGroup();

            $context
                ->getValidator()
                ->inContext($context)
                ->atPath('subpath')
                ->validate(['key' => $value->reference])
            ;

            // context changes shouldn't leak out of the validate() call
            $this->assertSame($previousValue, $context->getValue());
            $this->assertSame($previousObject, $context->getObject());
            $this->assertSame($previousMetadata, $context->getMetadata());
            $this->assertSame($previousPath, $context->getPropertyPath());
            $this->assertSame($previousGroup, $context->getGroup());
        };

        $callback2 = function ($value, ExecutionContextInterface $context) use ($entity) {
            $this->assertSame($this::REFERENCE_CLASS, $context->getClassName());
            $this->assertNull($context->getPropertyName());
            $this->assertSame('subpath[key]', $context->getPropertyPath());
            $this->assertSame('Group', $context->getGroup());
            $this->assertSame($this->referenceMetadata, $context->getMetadata());
            $this->assertSame($entity, $context->getRoot());
            $this->assertSame($entity->reference, $context->getValue());
            $this->assertSame($entity->reference, $value);

            $context->addViolation('Message %param%', ['%param%' => 'value']);
        };

        $this->metadata->addConstraint(new Callback([
            'callback' => $callback1,
            'groups' => 'Group',
        ]));
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback2,
            'groups' => 'Group',
        ]));

        $violations = $this->validator->validate($entity, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
        $this->assertSame('Message value', $violations[0]->getMessage());
        $this->assertSame('Message %param%', $violations[0]->getMessageTemplate());
        $this->assertSame(['%param%' => 'value'], $violations[0]->getParameters());
        $this->assertSame('subpath[key]', $violations[0]->getPropertyPath());
        $this->assertSame($entity, $violations[0]->getRoot());
        $this->assertSame($entity->reference, $violations[0]->getInvalidValue());
        $this->assertNull($violations[0]->getPlural());
        $this->assertNull($violations[0]->getCode());
    }

    public function testTraverseTraversableByDefault()
    {
        $entity = new Entity();
        $traversable = new \ArrayIterator(['key' => $entity]);

        $callback = function ($value, ExecutionContextInterface $context) use ($entity, $traversable) {
            $this->assertSame($this::ENTITY_CLASS, $context->getClassName());
            $this->assertNull($context->getPropertyName());
            $this->assertSame('[key]', $context->getPropertyPath());
            $this->assertSame('Group', $context->getGroup());
            $this->assertSame($this->metadata, $context->getMetadata());
            $this->assertSame($traversable, $context->getRoot());
            $this->assertSame($entity, $context->getValue());
            $this->assertSame($entity, $value);

            $context->addViolation('Message %param%', ['%param%' => 'value']);
        };

        $this->metadataFactory->addMetadata(new ClassMetadata('ArrayIterator'));
        $this->metadata->addConstraint(new Callback([
            'callback' => $callback,
            'groups' => 'Group',
        ]));

        $violations = $this->validate($traversable, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
        $this->assertSame('Message value', $violations[0]->getMessage());
        $this->assertSame('Message %param%', $violations[0]->getMessageTemplate());
        $this->assertSame(['%param%' => 'value'], $violations[0]->getParameters());
        $this->assertSame('[key]', $violations[0]->getPropertyPath());
        $this->assertSame($traversable, $violations[0]->getRoot());
        $this->assertSame($entity, $violations[0]->getInvalidValue());
        $this->assertNull($violations[0]->getPlural());
        $this->assertNull($violations[0]->getCode());
    }

    public function testTraversalEnabledOnClass()
    {
        $entity = new Entity();
        $traversable = new \ArrayIterator(['key' => $entity]);

        $callback = function ($value, ExecutionContextInterface $context) {
            $context->addViolation('Message');
        };

        $traversableMetadata = new ClassMetadata('ArrayIterator');
        $traversableMetadata->addConstraint(new Traverse(true));

        $this->metadataFactory->addMetadata($traversableMetadata);
        $this->metadata->addConstraint(new Callback([
            'callback' => $callback,
            'groups' => 'Group',
        ]));

        $violations = $this->validate($traversable, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
    }

    public function testTraversalDisabledOnClass()
    {
        $entity = new Entity();
        $traversable = new \ArrayIterator(['key' => $entity]);

        $callback = function ($value, ExecutionContextInterface $context) {
            $this->fail('Should not be called');
        };

        $traversableMetadata = new ClassMetadata('ArrayIterator');
        $traversableMetadata->addConstraint(new Traverse(false));

        $this->metadataFactory->addMetadata($traversableMetadata);
        $this->metadata->addConstraint(new Callback([
            'callback' => $callback,
            'groups' => 'Group',
        ]));

        $violations = $this->validate($traversable, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(0, $violations);
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\ConstraintDefinitionException
     */
    public function testExpectTraversableIfTraversalEnabledOnClass()
    {
        $entity = new Entity();

        $this->metadata->addConstraint(new Traverse(true));

        $this->validator->validate($entity);
    }

    public function testReferenceTraversalDisabledOnClass()
    {
        $entity = new Entity();
        $entity->reference = new \ArrayIterator(['key' => new Reference()]);

        $callback = function ($value, ExecutionContextInterface $context) {
            $this->fail('Should not be called');
        };

        $traversableMetadata = new ClassMetadata('ArrayIterator');
        $traversableMetadata->addConstraint(new Traverse(false));

        $this->metadataFactory->addMetadata($traversableMetadata);
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback,
            'groups' => 'Group',
        ]));
        $this->metadata->addPropertyConstraint('reference', new Valid());

        $violations = $this->validate($entity, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(0, $violations);
    }

    public function testReferenceTraversalEnabledOnReferenceDisabledOnClass()
    {
        $entity = new Entity();
        $entity->reference = new \ArrayIterator(['key' => new Reference()]);

        $callback = function ($value, ExecutionContextInterface $context) {
            $this->fail('Should not be called');
        };

        $traversableMetadata = new ClassMetadata('ArrayIterator');
        $traversableMetadata->addConstraint(new Traverse(false));

        $this->metadataFactory->addMetadata($traversableMetadata);
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback,
            'groups' => 'Group',
        ]));
        $this->metadata->addPropertyConstraint('reference', new Valid([
            'traverse' => true,
        ]));

        $violations = $this->validate($entity, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(0, $violations);
    }

    public function testReferenceTraversalDisabledOnReferenceEnabledOnClass()
    {
        $entity = new Entity();
        $entity->reference = new \ArrayIterator(['key' => new Reference()]);

        $callback = function ($value, ExecutionContextInterface $context) {
            $this->fail('Should not be called');
        };

        $traversableMetadata = new ClassMetadata('ArrayIterator');
        $traversableMetadata->addConstraint(new Traverse(true));

        $this->metadataFactory->addMetadata($traversableMetadata);
        $this->referenceMetadata->addConstraint(new Callback([
            'callback' => $callback,
            'groups' => 'Group',
        ]));
        $this->metadata->addPropertyConstraint('reference', new Valid([
            'traverse' => false,
        ]));

        $violations = $this->validate($entity, new Valid(), 'Group');

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(0, $violations);
    }

    public function testAddCustomizedViolation()
    {
        $entity = new Entity();

        $callback = function ($value, ExecutionContextInterface $context) {
            $context->buildViolation('Message %param%')
                ->setParameter('%param%', 'value')
                ->setInvalidValue('Invalid value')
                ->setPlural(2)
                ->setCode(42)
                ->addViolation();
        };

        $this->metadata->addConstraint(new Callback($callback));

        $violations = $this->validator->validate($entity);

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
        $this->assertSame('Message value', $violations[0]->getMessage());
        $this->assertSame('Message %param%', $violations[0]->getMessageTemplate());
        $this->assertSame(['%param%' => 'value'], $violations[0]->getParameters());
        $this->assertSame('', $violations[0]->getPropertyPath());
        $this->assertSame($entity, $violations[0]->getRoot());
        $this->assertSame('Invalid value', $violations[0]->getInvalidValue());
        $this->assertSame(2, $violations[0]->getPlural());
        $this->assertSame(42, $violations[0]->getCode());
    }

    public function testNoDuplicateValidationIfClassConstraintInMultipleGroups()
    {
        $entity = new Entity();

        $callback = function ($value, ExecutionContextInterface $context) {
            $context->addViolation('Message');
        };

        $this->metadata->addConstraint(new Callback([
            'callback' => $callback,
            'groups' => ['Group 1', 'Group 2'],
        ]));

        $violations = $this->validator->validate($entity, new Valid(), ['Group 1', 'Group 2']);

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
    }

    public function testNoDuplicateValidationIfPropertyConstraintInMultipleGroups()
    {
        $entity = new Entity();

        $callback = function ($value, ExecutionContextInterface $context) {
            $context->addViolation('Message');
        };

        $this->metadata->addPropertyConstraint('firstName', new Callback([
            'callback' => $callback,
            'groups' => ['Group 1', 'Group 2'],
        ]));

        $violations = $this->validator->validate($entity, new Valid(), ['Group 1', 'Group 2']);

        /* @var ConstraintViolationInterface[] $violations */
        $this->assertCount(1, $violations);
    }

    /**
     * @expectedException \Symfony\Component\Validator\Exception\RuntimeException
     */
    public function testValidateFailsIfNoConstraintsAndNoObjectOrArray()
    {
        $this->validate('Foobar');
    }

    public function testAccessCurrentObject()
    {
        $called = false;
        $entity = new Entity();
        $entity->firstName = 'Bernhard';
        $entity->data = ['firstName' => 'Bernhard'];

        $callback = function ($value, ExecutionContextInterface $context) use ($entity, &$called) {
            $called = true;
            $this->assertSame($entity, $context->getObject());
        };

        $this->metadata->addConstraint(new Callback($callback));
        $this->metadata->addPropertyConstraint('firstName', new Callback($callback));
        $this->metadata->addPropertyConstraint('data', new Collection(['firstName' => new Expression('value == this.firstName')]));

        $this->validator->validate($entity);

        $this->assertTrue($called);
    }

    public function testInitializeObjectsOnFirstValidation()
    {
        $entity = new Entity();
        $entity->initialized = false;

        // prepare initializers that set "initialized" to true
        $initializer1 = $this->getMockBuilder('Symfony\\Component\\Validator\\ObjectInitializerInterface')->getMock();
        $initializer2 = $this->getMockBuilder('Symfony\\Component\\Validator\\ObjectInitializerInterface')->getMock();

        $initializer1->expects($this->once())
            ->method('initialize')
            ->with($entity)
            ->will($this->returnCallback(function ($object) {
                $object->initialized = true;
            }));

        $initializer2->expects($this->once())
            ->method('initialize')
            ->with($entity);

        $this->validator = $this->createValidator($this->metadataFactory, [
            $initializer1,
            $initializer2,
        ]);

        // prepare constraint which
        // * checks that "initialized" is set to true
        // * validates the object again
        $callback = function ($object, ExecutionContextInterface $context) {
            $this->assertTrue($object->initialized);

            // validate again in same group
            $validator = $context->getValidator()->inContext($context);

            $validator->validate($object);

            // validate again in other group
            $validator->validate($object, null, 'SomeGroup');
        };

        $this->metadata->addConstraint(new Callback($callback));

        $this->validate($entity);

        $this->assertTrue($entity->initialized);
    }

    public function testPassConstraintToViolation()
    {
        $constraint = new FailingConstraint();
        $violations = $this->validate('Foobar', $constraint);

        $this->assertCount(1, $violations);
        $this->assertSame($constraint, $violations[0]->getConstraint());
    }

    public function testCollectionConstraitViolationHasCorrectContext()
    {
        $data = [
            'foo' => 'fooValue',
        ];

        // Missing field must not be the first in the collection validation
        $constraint = new Collection([
            'foo' => new NotNull(),
            'bar' => new NotNull(),
        ]);

        $violations = $this->validate($data, $constraint);

        $this->assertCount(1, $violations);
        $this->assertSame($constraint, $violations[0]->getConstraint());
    }

    public function testNestedObjectIsNotValidatedIfGroupInValidConstraintIsNotValidated()
    {
        $entity = new Entity();
        $entity->firstName = '';
        $reference = new Reference();
        $reference->value = '';
        $entity->childA = $reference;

        $this->metadata->addPropertyConstraint('firstName', new NotBlank(['groups' => 'group1']));
        $this->metadata->addPropertyConstraint('childA', new Valid(['groups' => 'group1']));
        $this->referenceMetadata->addPropertyConstraint('value', new NotBlank());

        $violations = $this->validator->validate($entity, null, []);

        $this->assertCount(0, $violations);
    }

    public function testNestedObjectIsValidatedIfGroupInValidConstraintIsValidated()
    {
        $entity = new Entity();
        $entity->firstName = '';
        $reference = new Reference();
        $reference->value = '';
        $entity->childA = $reference;

        $this->metadata->addPropertyConstraint('firstName', new NotBlank(['groups' => 'group1']));
        $this->metadata->addPropertyConstraint('childA', new Valid(['groups' => 'group1']));
        $this->referenceMetadata->addPropertyConstraint('value', new NotBlank(['groups' => 'group1']));

        $violations = $this->validator->validate($entity, null, ['Default', 'group1']);

        $this->assertCount(2, $violations);
    }
}
