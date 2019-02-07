<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Command;

use PHPUnit\Framework\TestCase;
use Symfony\Component\Console\Application;
use Symfony\Component\Console\Tester\CommandTester;

class ListCommandTest extends TestCase
{
    public function testExecuteListsCommands()
    {
        $application = new Application();
        $commandTester = new CommandTester($command = $application->get('list'));
        $commandTester->execute(['command' => $command->getName()], ['decorated' => false]);

        $this->assertRegExp('/help\s{2,}Displays help for a command/', $commandTester->getDisplay(), '->execute() returns a list of available commands');
    }

    public function testExecuteListsCommandsWithXmlOption()
    {
        $application = new Application();
        $commandTester = new CommandTester($command = $application->get('list'));
        $commandTester->execute(['command' => $command->getName(), '--format' => 'xml']);
        $this->assertRegExp('/<command id="list" name="list" hidden="0">/', $commandTester->getDisplay(), '->execute() returns a list of available commands in XML if --xml is passed');
    }

    public function testExecuteListsCommandsWithRawOption()
    {
        $application = new Application();
        $commandTester = new CommandTester($command = $application->get('list'));
        $commandTester->execute(['command' => $command->getName(), '--raw' => true]);
        $output = <<<'EOF'
help   Displays help for a command
list   Lists commands

EOF;

        $this->assertEquals($output, $commandTester->getDisplay(true));
    }

    public function testExecuteListsCommandsWithNamespaceArgument()
    {
        require_once realpath(__DIR__.'/../Fixtures/FooCommand.php');
        $application = new Application();
        $application->add(new \FooCommand());
        $commandTester = new CommandTester($command = $application->get('list'));
        $commandTester->execute(['command' => $command->getName(), 'namespace' => 'foo', '--raw' => true]);
        $output = <<<'EOF'
foo:bar   The foo:bar command

EOF;

        $this->assertEquals($output, $commandTester->getDisplay(true));
    }

    public function testExecuteListsCommandsOrder()
    {
        require_once realpath(__DIR__.'/../Fixtures/Foo6Command.php');
        $application = new Application();
        $application->add(new \Foo6Command());
        $commandTester = new CommandTester($command = $application->get('list'));
        $commandTester->execute(['command' => $command->getName()], ['decorated' => false]);
        $output = <<<'EOF'
Console Tool

Usage:
  command [options] [arguments]

Options:
  -h, --help            Display this help message
  -q, --quiet           Do not output any message
  -V, --version         Display this application version
      --ansi            Force ANSI output
      --no-ansi         Disable ANSI output
  -n, --no-interaction  Do not ask any interactive question
  -v|vv|vvv, --verbose  Increase the verbosity of messages: 1 for normal output, 2 for more verbose output and 3 for debug

Available commands:
  help      Displays help for a command
  list      Lists commands
 0foo
  0foo:bar  0foo:bar command
EOF;

        $this->assertEquals($output, trim($commandTester->getDisplay(true)));
    }

    public function testExecuteListsCommandsOrderRaw()
    {
        require_once realpath(__DIR__.'/../Fixtures/Foo6Command.php');
        $application = new Application();
        $application->add(new \Foo6Command());
        $commandTester = new CommandTester($command = $application->get('list'));
        $commandTester->execute(['command' => $command->getName(), '--raw' => true]);
        $output = <<<'EOF'
help       Displays help for a command
list       Lists commands
0foo:bar   0foo:bar command
EOF;

        $this->assertEquals($output, trim($commandTester->getDisplay(true)));
    }
}
