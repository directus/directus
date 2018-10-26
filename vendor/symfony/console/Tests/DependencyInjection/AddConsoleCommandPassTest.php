<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\DependencyInjection;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\CommandLoader\ContainerCommandLoader;
use Symfony\Component\Console\DependencyInjection\AddConsoleCommandPass;
use Symfony\Component\DependencyInjection\Argument\ServiceClosureArgument;
use Symfony\Component\DependencyInjection\ChildDefinition;
use Symfony\Component\DependencyInjection\Compiler\PassConfig;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Definition;
use Symfony\Component\DependencyInjection\TypedReference;

class AddConsoleCommandPassTest extends TestCase
{
    /**
     * @dataProvider visibilityProvider
     */
    public function testProcess($public)
    {
        $container = new ContainerBuilder();
        $container->addCompilerPass(new AddConsoleCommandPass(), PassConfig::TYPE_BEFORE_REMOVING);
        $container->setParameter('my-command.class', 'Symfony\Component\Console\Tests\DependencyInjection\MyCommand');

        $id = 'my-command';
        $definition = new Definition('%my-command.class%');
        $definition->setPublic($public);
        $definition->addTag('console.command');
        $container->setDefinition($id, $definition);

        $container->compile();

        $alias = 'console.command.public_alias.my-command';

        if ($public) {
            $this->assertFalse($container->hasAlias($alias));
        } else {
            // The alias is replaced by a Definition by the ReplaceAliasByActualDefinitionPass
            // in case the original service is private
            $this->assertFalse($container->hasDefinition($id));
            $this->assertTrue($container->hasDefinition($alias));
        }

        $this->assertTrue($container->hasParameter('console.command.ids'));
        $this->assertSame(array($public ? $id : $alias), $container->getParameter('console.command.ids'));
    }

    public function testProcessRegistersLazyCommands()
    {
        $container = new ContainerBuilder();
        $command = $container
            ->register('my-command', MyCommand::class)
            ->setPublic(false)
            ->addTag('console.command', array('command' => 'my:command'))
            ->addTag('console.command', array('command' => 'my:alias'))
        ;

        (new AddConsoleCommandPass())->process($container);

        $commandLoader = $container->getDefinition('console.command_loader');
        $commandLocator = $container->getDefinition((string) $commandLoader->getArgument(0));

        $this->assertSame(ContainerCommandLoader::class, $commandLoader->getClass());
        $this->assertSame(array('my:command' => 'my-command', 'my:alias' => 'my-command'), $commandLoader->getArgument(1));
        $this->assertEquals(array(array('my-command' => new ServiceClosureArgument(new TypedReference('my-command', MyCommand::class)))), $commandLocator->getArguments());
        $this->assertSame(array(), $container->getParameter('console.command.ids'));
        $this->assertSame(array(array('setName', array('my:command')), array('setAliases', array(array('my:alias')))), $command->getMethodCalls());
    }

    public function testProcessFallsBackToDefaultName()
    {
        $container = new ContainerBuilder();
        $container
            ->register('with-default-name', NamedCommand::class)
            ->setPublic(false)
            ->addTag('console.command')
        ;

        $pass = new AddConsoleCommandPass();
        $pass->process($container);

        $commandLoader = $container->getDefinition('console.command_loader');
        $commandLocator = $container->getDefinition((string) $commandLoader->getArgument(0));

        $this->assertSame(ContainerCommandLoader::class, $commandLoader->getClass());
        $this->assertSame(array('default' => 'with-default-name'), $commandLoader->getArgument(1));
        $this->assertEquals(array(array('with-default-name' => new ServiceClosureArgument(new TypedReference('with-default-name', NamedCommand::class)))), $commandLocator->getArguments());
        $this->assertSame(array(), $container->getParameter('console.command.ids'));

        $container = new ContainerBuilder();
        $container
            ->register('with-default-name', NamedCommand::class)
            ->setPublic(false)
            ->addTag('console.command', array('command' => 'new-name'))
        ;

        $pass->process($container);

        $this->assertSame(array('new-name' => 'with-default-name'), $container->getDefinition('console.command_loader')->getArgument(1));
    }

    public function visibilityProvider()
    {
        return array(
            array(true),
            array(false),
        );
    }

    /**
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage The service "my-command" tagged "console.command" must not be abstract.
     */
    public function testProcessThrowAnExceptionIfTheServiceIsAbstract()
    {
        $container = new ContainerBuilder();
        $container->setResourceTracking(false);
        $container->addCompilerPass(new AddConsoleCommandPass(), PassConfig::TYPE_BEFORE_REMOVING);

        $definition = new Definition('Symfony\Component\Console\Tests\DependencyInjection\MyCommand');
        $definition->addTag('console.command');
        $definition->setAbstract(true);
        $container->setDefinition('my-command', $definition);

        $container->compile();
    }

    /**
     * @expectedException \InvalidArgumentException
     * @expectedExceptionMessage The service "my-command" tagged "console.command" must be a subclass of "Symfony\Component\Console\Command\Command".
     */
    public function testProcessThrowAnExceptionIfTheServiceIsNotASubclassOfCommand()
    {
        $container = new ContainerBuilder();
        $container->setResourceTracking(false);
        $container->addCompilerPass(new AddConsoleCommandPass(), PassConfig::TYPE_BEFORE_REMOVING);

        $definition = new Definition('SplObjectStorage');
        $definition->addTag('console.command');
        $container->setDefinition('my-command', $definition);

        $container->compile();
    }

    public function testProcessPrivateServicesWithSameCommand()
    {
        $container = new ContainerBuilder();
        $className = 'Symfony\Component\Console\Tests\DependencyInjection\MyCommand';

        $definition1 = new Definition($className);
        $definition1->addTag('console.command')->setPublic(false);

        $definition2 = new Definition($className);
        $definition2->addTag('console.command')->setPublic(false);

        $container->setDefinition('my-command1', $definition1);
        $container->setDefinition('my-command2', $definition2);

        (new AddConsoleCommandPass())->process($container);

        $aliasPrefix = 'console.command.public_alias.';
        $this->assertTrue($container->hasAlias($aliasPrefix.'my-command1'));
        $this->assertTrue($container->hasAlias($aliasPrefix.'my-command2'));
    }

    public function testProcessOnChildDefinitionWithClass()
    {
        $container = new ContainerBuilder();
        $container->addCompilerPass(new AddConsoleCommandPass(), PassConfig::TYPE_BEFORE_REMOVING);
        $className = 'Symfony\Component\Console\Tests\DependencyInjection\MyCommand';

        $parentId = 'my-parent-command';
        $childId = 'my-child-command';

        $parentDefinition = new Definition(/* no class */);
        $parentDefinition->setAbstract(true)->setPublic(false);

        $childDefinition = new ChildDefinition($parentId);
        $childDefinition->addTag('console.command')->setPublic(true);
        $childDefinition->setClass($className);

        $container->setDefinition($parentId, $parentDefinition);
        $container->setDefinition($childId, $childDefinition);

        $container->compile();
        $command = $container->get($childId);

        $this->assertInstanceOf($className, $command);
    }

    public function testProcessOnChildDefinitionWithParentClass()
    {
        $container = new ContainerBuilder();
        $container->addCompilerPass(new AddConsoleCommandPass(), PassConfig::TYPE_BEFORE_REMOVING);
        $className = 'Symfony\Component\Console\Tests\DependencyInjection\MyCommand';

        $parentId = 'my-parent-command';
        $childId = 'my-child-command';

        $parentDefinition = new Definition($className);
        $parentDefinition->setAbstract(true)->setPublic(false);

        $childDefinition = new ChildDefinition($parentId);
        $childDefinition->addTag('console.command')->setPublic(true);

        $container->setDefinition($parentId, $parentDefinition);
        $container->setDefinition($childId, $childDefinition);

        $container->compile();
        $command = $container->get($childId);

        $this->assertInstanceOf($className, $command);
    }

    /**
     * @expectedException \RuntimeException
     * @expectedExceptionMessage The definition for "my-child-command" has no class.
     */
    public function testProcessOnChildDefinitionWithoutClass()
    {
        $container = new ContainerBuilder();
        $container->addCompilerPass(new AddConsoleCommandPass(), PassConfig::TYPE_BEFORE_REMOVING);

        $parentId = 'my-parent-command';
        $childId = 'my-child-command';

        $parentDefinition = new Definition();
        $parentDefinition->setAbstract(true)->setPublic(false);

        $childDefinition = new ChildDefinition($parentId);
        $childDefinition->addTag('console.command')->setPublic(true);

        $container->setDefinition($parentId, $parentDefinition);
        $container->setDefinition($childId, $childDefinition);

        $container->compile();
    }
}

class MyCommand extends Command
{
}

class NamedCommand extends Command
{
    protected static $defaultName = 'default';
}
