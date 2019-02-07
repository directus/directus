<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Validator\Tests\DependencyInjection;

use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Argument\ServiceClosureArgument;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\DependencyInjection\ServiceLocator;
use Symfony\Component\Validator\DependencyInjection\AddConstraintValidatorsPass;

class AddConstraintValidatorsPassTest extends TestCase
{
    public function testThatConstraintValidatorServicesAreProcessed()
    {
        $container = new ContainerBuilder();
        $validatorFactory = $container->register('validator.validator_factory')
            ->addArgument([]);

        $container->register('my_constraint_validator_service1', Validator1::class)
            ->addTag('validator.constraint_validator', ['alias' => 'my_constraint_validator_alias1']);
        $container->register('my_constraint_validator_service2', Validator2::class)
            ->addTag('validator.constraint_validator');

        $addConstraintValidatorsPass = new AddConstraintValidatorsPass();
        $addConstraintValidatorsPass->process($container);

        $expected = (new Definition(ServiceLocator::class, [[
            Validator1::class => new ServiceClosureArgument(new Reference('my_constraint_validator_service1')),
            'my_constraint_validator_alias1' => new ServiceClosureArgument(new Reference('my_constraint_validator_service1')),
            Validator2::class => new ServiceClosureArgument(new Reference('my_constraint_validator_service2')),
        ]]))->addTag('container.service_locator')->setPublic(false);
        $this->assertEquals($expected, $container->getDefinition((string) $validatorFactory->getArgument(0)));
    }

    /**
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage The service "my_abstract_constraint_validator" tagged "validator.constraint_validator" must not be abstract.
     */
    public function testAbstractConstraintValidator()
    {
        $container = new ContainerBuilder();
        $container->register('validator.validator_factory')
            ->addArgument([]);

        $container->register('my_abstract_constraint_validator')
            ->setAbstract(true)
            ->addTag('validator.constraint_validator');

        $addConstraintValidatorsPass = new AddConstraintValidatorsPass();
        $addConstraintValidatorsPass->process($container);
    }

    public function testThatCompilerPassIsIgnoredIfThereIsNoConstraintValidatorFactoryDefinition()
    {
        $container = new ContainerBuilder();

        $definitionsBefore = \count($container->getDefinitions());
        $aliasesBefore = \count($container->getAliases());

        $addConstraintValidatorsPass = new AddConstraintValidatorsPass();
        $addConstraintValidatorsPass->process($container);

        // the container is untouched (i.e. no new definitions or aliases)
        $this->assertCount($definitionsBefore, $container->getDefinitions());
        $this->assertCount($aliasesBefore, $container->getAliases());
    }
}
