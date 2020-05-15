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

use Symfony\Component\Translation\IdentityTranslator;
use Symfony\Component\Validator\Constraints\All;
use Symfony\Component\Validator\Constraints\Collection;
use Symfony\Component\Validator\Constraints\GroupSequence;
use Symfony\Component\Validator\Constraints\IsTrue;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Constraints\NotNull;
use Symfony\Component\Validator\ConstraintValidatorFactory;
use Symfony\Component\Validator\Context\ExecutionContextFactory;
use Symfony\Component\Validator\Mapping\ClassMetadata;
use Symfony\Component\Validator\Mapping\Factory\MetadataFactoryInterface;
use Symfony\Component\Validator\Tests\Constraints\Fixtures\ChildA;
use Symfony\Component\Validator\Tests\Constraints\Fixtures\ChildB;
use Symfony\Component\Validator\Tests\Fixtures\Entity;
use Symfony\Component\Validator\Tests\Fixtures\EntityWithGroupedConstraintOnMethods;
use Symfony\Component\Validator\Validator\RecursiveValidator;

class RecursiveValidatorTest extends AbstractTest
{
    protected function createValidator(MetadataFactoryInterface $metadataFactory, array $objectInitializers = [])
    {
        $translator = new IdentityTranslator();
        $translator->setLocale('en');

        $contextFactory = new ExecutionContextFactory($translator);
        $validatorFactory = new ConstraintValidatorFactory();

        return new RecursiveValidator($contextFactory, $metadataFactory, $validatorFactory, $objectInitializers);
    }

    public function testEmptyGroupsArrayDoesNotTriggerDeprecation()
    {
        $entity = new Entity();
        $childA = new ChildA();
        $childB = new ChildB();
        $childA->name = false;
        $childB->name = 'fake';
        $entity->childA = [$childA];
        $entity->childB = [$childB];
        $validatorContext = $this->getMockBuilder('Symfony\Component\Validator\Validator\ContextualValidatorInterface')->getMock();
        $validatorContext
            ->expects($this->once())
            ->method('validate')
            ->with($entity, null, [])
            ->willReturnSelf();

        $validator = $this
            ->getMockBuilder('Symfony\Component\Validator\Validator\RecursiveValidator')
            ->disableOriginalConstructor()
            ->setMethods(['startContext'])
            ->getMock();
        $validator
            ->expects($this->once())
            ->method('startContext')
            ->willReturn($validatorContext);

        $validator->validate($entity, null, []);
    }

    public function testRelationBetweenChildAAndChildB()
    {
        $entity = new Entity();
        $childA = new ChildA();
        $childB = new ChildB();

        $childA->childB = $childB;
        $childB->childA = $childA;

        $childA->name = false;
        $childB->name = 'fake';
        $entity->childA = [$childA];
        $entity->childB = [$childB];

        $validatorContext = $this->getMockBuilder('Symfony\Component\Validator\Validator\ContextualValidatorInterface')->getMock();
        $validatorContext
            ->expects($this->once())
            ->method('validate')
            ->with($entity, null, [])
            ->willReturnSelf();

        $validator = $this
            ->getMockBuilder('Symfony\Component\Validator\Validator\RecursiveValidator')
            ->disableOriginalConstructor()
            ->setMethods(['startContext'])
            ->getMock();
        $validator
            ->expects($this->once())
            ->method('startContext')
            ->willReturn($validatorContext);

        $validator->validate($entity, null, []);
    }

    public function testCollectionConstraintValidateAllGroupsForNestedConstraints()
    {
        $this->metadata->addPropertyConstraint('data', new Collection(['fields' => [
            'one' => [new NotBlank(['groups' => 'one']), new Length(['min' => 2, 'groups' => 'two'])],
            'two' => [new NotBlank(['groups' => 'two'])],
        ]]));

        $entity = new Entity();
        $entity->data = ['one' => 't', 'two' => ''];

        $violations = $this->validator->validate($entity, null, ['one', 'two']);

        $this->assertCount(2, $violations);
        $this->assertInstanceOf(Length::class, $violations->get(0)->getConstraint());
        $this->assertInstanceOf(NotBlank::class, $violations->get(1)->getConstraint());
    }

    public function testGroupedMethodConstraintValidateInSequence()
    {
        $metadata = new ClassMetadata(EntityWithGroupedConstraintOnMethods::class);
        $metadata->addPropertyConstraint('bar', new NotNull(['groups' => 'Foo']));
        $metadata->addGetterMethodConstraint('validInFoo', 'isValidInFoo', new IsTrue(['groups' => 'Foo']));
        $metadata->addGetterMethodConstraint('bar', 'getBar', new NotNull(['groups' => 'Bar']));

        $this->metadataFactory->addMetadata($metadata);

        $entity = new EntityWithGroupedConstraintOnMethods();
        $groups = new GroupSequence(['EntityWithGroupedConstraintOnMethods', 'Foo', 'Bar']);

        $violations = $this->validator->validate($entity, null, $groups);

        $this->assertCount(2, $violations);
        $this->assertInstanceOf(NotNull::class, $violations->get(0)->getConstraint());
        $this->assertInstanceOf(IsTrue::class, $violations->get(1)->getConstraint());
    }

    public function testAllConstraintValidateAllGroupsForNestedConstraints()
    {
        $this->metadata->addPropertyConstraint('data', new All(['constraints' => [
            new NotBlank(['groups' => 'one']),
            new Length(['min' => 2, 'groups' => 'two']),
        ]]));

        $entity = new Entity();
        $entity->data = ['one' => 't', 'two' => ''];

        $violations = $this->validator->validate($entity, null, ['one', 'two']);

        $this->assertCount(2, $violations);
        $this->assertInstanceOf(NotBlank::class, $violations->get(0)->getConstraint());
        $this->assertInstanceOf(Length::class, $violations->get(1)->getConstraint());
    }
}
