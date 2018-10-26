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
use Symfony\Component\Validator\ConstraintValidatorFactory;
use Symfony\Component\Validator\Context\ExecutionContextFactory;
use Symfony\Component\Validator\Mapping\Factory\MetadataFactoryInterface;
use Symfony\Component\Validator\Tests\Constraints\Fixtures\ChildA;
use Symfony\Component\Validator\Tests\Constraints\Fixtures\ChildB;
use Symfony\Component\Validator\Tests\Fixtures\Entity;
use Symfony\Component\Validator\Validator\RecursiveValidator;

class RecursiveValidatorTest extends AbstractTest
{
    protected function createValidator(MetadataFactoryInterface $metadataFactory, array $objectInitializers = array())
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
        $entity->childA = array($childA);
        $entity->childB = array($childB);
        $validatorContext = $this->getMockBuilder('Symfony\Component\Validator\Validator\ContextualValidatorInterface')->getMock();
        $validatorContext
            ->expects($this->once())
            ->method('validate')
            ->with($entity, null, array())
            ->willReturnSelf();

        $validator = $this
            ->getMockBuilder('Symfony\Component\Validator\Validator\RecursiveValidator')
            ->disableOriginalConstructor()
            ->setMethods(array('startContext'))
            ->getMock();
        $validator
            ->expects($this->once())
            ->method('startContext')
            ->willReturn($validatorContext);

        $validator->validate($entity, null, array());
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
        $entity->childA = array($childA);
        $entity->childB = array($childB);

        $validatorContext = $this->getMockBuilder('Symfony\Component\Validator\Validator\ContextualValidatorInterface')->getMock();
        $validatorContext
            ->expects($this->once())
            ->method('validate')
            ->with($entity, null, array())
            ->willReturnSelf();

        $validator = $this
            ->getMockBuilder('Symfony\Component\Validator\Validator\RecursiveValidator')
            ->disableOriginalConstructor()
            ->setMethods(array('startContext'))
            ->getMock();
        $validator
            ->expects($this->once())
            ->method('startContext')
            ->willReturn($validatorContext);

        $validator->validate($entity, null, array());
    }
}
