<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Translation\Tests\DependencyInjection;

use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Argument\ServiceClosureArgument;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\DependencyInjection\Reference;
use Symfony\Component\DependencyInjection\ServiceLocator;
use Symfony\Component\Translation\DependencyInjection\TranslatorPathsPass;
use Symfony\Component\Translation\Tests\DependencyInjection\fixtures\ControllerArguments;
use Symfony\Component\Translation\Tests\DependencyInjection\fixtures\ServiceArguments;
use Symfony\Component\Translation\Tests\DependencyInjection\fixtures\ServiceMethodCalls;
use Symfony\Component\Translation\Tests\DependencyInjection\fixtures\ServiceProperties;
use Symfony\Component\Translation\Tests\DependencyInjection\fixtures\ServiceSubscriber;

class TranslationPathsPassTest extends TestCase
{
    public function testProcess()
    {
        $container = new ContainerBuilder();
        $container->register('translator');
        $debugCommand = $container->register('console.command.translation_debug')
            ->setArguments([null, null, null, null, null, [], []])
        ;
        $updateCommand = $container->register('console.command.translation_update')
            ->setArguments([null, null, null, null, null, null, [], []])
        ;
        $container->register(ControllerArguments::class, ControllerArguments::class)
            ->setTags(['controller.service_arguments'])
        ;
        $container->register(ServiceArguments::class, ServiceArguments::class)
            ->setArguments([new Reference('translator')])
        ;
        $container->register(ServiceProperties::class, ServiceProperties::class)
            ->setProperties([new Reference('translator')])
        ;
        $container->register(ServiceMethodCalls::class, ServiceMethodCalls::class)
            ->setMethodCalls([['setTranslator', [new Reference('translator')]]])
        ;
        $container->register('service_rc')
            ->setArguments([new Definition(), new Reference(ServiceMethodCalls::class)])
        ;
        $serviceLocator1 = $container->register('.service_locator.foo', ServiceLocator::class)
            ->setArguments([new ServiceClosureArgument(new Reference('translator'))])
        ;
        $serviceLocator2 = (new Definition(ServiceLocator::class))
            ->setArguments([ServiceSubscriber::class, new Reference('service_container')])
            ->setFactory([$serviceLocator1, 'withContext'])
        ;
        $container->register('service_subscriber', ServiceSubscriber::class)
            ->setArguments([$serviceLocator2])
        ;
        $container->register('.service_locator.bar', ServiceLocator::class)
            ->setArguments([[
                ControllerArguments::class.'::index' => new ServiceClosureArgument(new Reference('.service_locator.foo')),
                ControllerArguments::class.'::__invoke' => new ServiceClosureArgument(new Reference('.service_locator.foo')),
                ControllerArguments::class => new ServiceClosureArgument(new Reference('.service_locator.foo')),
            ]])
        ;
        $container->register('argument_resolver.service')
            ->setArguments([new Reference('.service_locator.bar')])
        ;

        $pass = new TranslatorPathsPass('translator', 'console.command.translation_debug', 'console.command.translation_update', 'argument_resolver.service');
        $pass->process($container);

        $expectedPaths = [
            $container->getReflectionClass(ServiceArguments::class)->getFileName(),
            $container->getReflectionClass(ServiceProperties::class)->getFileName(),
            $container->getReflectionClass(ServiceMethodCalls::class)->getFileName(),
            $container->getReflectionClass(ControllerArguments::class)->getFileName(),
            $container->getReflectionClass(ServiceSubscriber::class)->getFileName(),
        ];

        $this->assertSame($expectedPaths, $debugCommand->getArgument(6));
        $this->assertSame($expectedPaths, $updateCommand->getArgument(7));
    }
}
