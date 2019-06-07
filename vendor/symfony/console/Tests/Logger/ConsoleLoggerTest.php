<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Tests\Logger;

use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Psr\Log\LogLevel;
use Symfony\Component\Console\Logger\ConsoleLogger;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Tests\Fixtures\DummyOutput;

/**
 * Console logger test.
 *
 * @author Kévin Dunglas <dunglas@gmail.com>
 * @author Jordi Boggiano <j.boggiano@seld.be>
 */
class ConsoleLoggerTest extends TestCase
{
    /**
     * @var DummyOutput
     */
    protected $output;

    /**
     * @return LoggerInterface
     */
    public function getLogger()
    {
        $this->output = new DummyOutput(OutputInterface::VERBOSITY_VERBOSE);

        return new ConsoleLogger($this->output, [
            LogLevel::EMERGENCY => OutputInterface::VERBOSITY_NORMAL,
            LogLevel::ALERT => OutputInterface::VERBOSITY_NORMAL,
            LogLevel::CRITICAL => OutputInterface::VERBOSITY_NORMAL,
            LogLevel::ERROR => OutputInterface::VERBOSITY_NORMAL,
            LogLevel::WARNING => OutputInterface::VERBOSITY_NORMAL,
            LogLevel::NOTICE => OutputInterface::VERBOSITY_NORMAL,
            LogLevel::INFO => OutputInterface::VERBOSITY_NORMAL,
            LogLevel::DEBUG => OutputInterface::VERBOSITY_NORMAL,
        ]);
    }

    /**
     * Return the log messages in order.
     *
     * @return string[]
     */
    public function getLogs()
    {
        return $this->output->getLogs();
    }

    /**
     * @dataProvider provideOutputMappingParams
     */
    public function testOutputMapping($logLevel, $outputVerbosity, $isOutput, $addVerbosityLevelMap = [])
    {
        $out = new BufferedOutput($outputVerbosity);
        $logger = new ConsoleLogger($out, $addVerbosityLevelMap);
        $logger->log($logLevel, 'foo bar');
        $logs = $out->fetch();
        $this->assertEquals($isOutput ? "[$logLevel] foo bar".PHP_EOL : '', $logs);
    }

    public function provideOutputMappingParams()
    {
        $quietMap = [LogLevel::EMERGENCY => OutputInterface::VERBOSITY_QUIET];

        return [
            [LogLevel::EMERGENCY, OutputInterface::VERBOSITY_NORMAL, true],
            [LogLevel::WARNING, OutputInterface::VERBOSITY_NORMAL, true],
            [LogLevel::INFO, OutputInterface::VERBOSITY_NORMAL, false],
            [LogLevel::DEBUG, OutputInterface::VERBOSITY_NORMAL, false],
            [LogLevel::INFO, OutputInterface::VERBOSITY_VERBOSE, false],
            [LogLevel::INFO, OutputInterface::VERBOSITY_VERY_VERBOSE, true],
            [LogLevel::DEBUG, OutputInterface::VERBOSITY_VERY_VERBOSE, false],
            [LogLevel::DEBUG, OutputInterface::VERBOSITY_DEBUG, true],
            [LogLevel::ALERT, OutputInterface::VERBOSITY_QUIET, false],
            [LogLevel::EMERGENCY, OutputInterface::VERBOSITY_QUIET, false],
            [LogLevel::ALERT, OutputInterface::VERBOSITY_QUIET, false, $quietMap],
            [LogLevel::EMERGENCY, OutputInterface::VERBOSITY_QUIET, true, $quietMap],
        ];
    }

    public function testHasErrored()
    {
        $logger = new ConsoleLogger(new BufferedOutput());

        $this->assertFalse($logger->hasErrored());

        $logger->warning('foo');
        $this->assertFalse($logger->hasErrored());

        $logger->error('bar');
        $this->assertTrue($logger->hasErrored());
    }

    public function testImplements()
    {
        $this->assertInstanceOf('Psr\Log\LoggerInterface', $this->getLogger());
    }

    /**
     * @dataProvider provideLevelsAndMessages
     */
    public function testLogsAtAllLevels($level, $message)
    {
        $logger = $this->getLogger();
        $logger->{$level}($message, ['user' => 'Bob']);
        $logger->log($level, $message, ['user' => 'Bob']);

        $expected = [
            $level.' message of level '.$level.' with context: Bob',
            $level.' message of level '.$level.' with context: Bob',
        ];
        $this->assertEquals($expected, $this->getLogs());
    }

    public function provideLevelsAndMessages()
    {
        return [
            LogLevel::EMERGENCY => [LogLevel::EMERGENCY, 'message of level emergency with context: {user}'],
            LogLevel::ALERT => [LogLevel::ALERT, 'message of level alert with context: {user}'],
            LogLevel::CRITICAL => [LogLevel::CRITICAL, 'message of level critical with context: {user}'],
            LogLevel::ERROR => [LogLevel::ERROR, 'message of level error with context: {user}'],
            LogLevel::WARNING => [LogLevel::WARNING, 'message of level warning with context: {user}'],
            LogLevel::NOTICE => [LogLevel::NOTICE, 'message of level notice with context: {user}'],
            LogLevel::INFO => [LogLevel::INFO, 'message of level info with context: {user}'],
            LogLevel::DEBUG => [LogLevel::DEBUG, 'message of level debug with context: {user}'],
        ];
    }

    /**
     * @expectedException \Psr\Log\InvalidArgumentException
     */
    public function testThrowsOnInvalidLevel()
    {
        $logger = $this->getLogger();
        $logger->log('invalid level', 'Foo');
    }

    public function testContextReplacement()
    {
        $logger = $this->getLogger();
        $logger->info('{Message {nothing} {user} {foo.bar} a}', ['user' => 'Bob', 'foo.bar' => 'Bar']);

        $expected = ['info {Message {nothing} Bob Bar a}'];
        $this->assertEquals($expected, $this->getLogs());
    }

    public function testObjectCastToString()
    {
        if (method_exists($this, 'createPartialMock')) {
            $dummy = $this->createPartialMock('Symfony\Component\Console\Tests\Logger\DummyTest', ['__toString']);
        } else {
            $dummy = $this->getMock('Symfony\Component\Console\Tests\Logger\DummyTest', ['__toString']);
        }
        $dummy->method('__toString')->willReturn('DUMMY');

        $this->getLogger()->warning($dummy);

        $expected = ['warning DUMMY'];
        $this->assertEquals($expected, $this->getLogs());
    }

    public function testContextCanContainAnything()
    {
        $context = [
            'bool' => true,
            'null' => null,
            'string' => 'Foo',
            'int' => 0,
            'float' => 0.5,
            'nested' => ['with object' => new DummyTest()],
            'object' => new \DateTime(),
            'resource' => fopen('php://memory', 'r'),
        ];

        $this->getLogger()->warning('Crazy context data', $context);

        $expected = ['warning Crazy context data'];
        $this->assertEquals($expected, $this->getLogs());
    }

    public function testContextExceptionKeyCanBeExceptionOrOtherValues()
    {
        $logger = $this->getLogger();
        $logger->warning('Random message', ['exception' => 'oops']);
        $logger->critical('Uncaught Exception!', ['exception' => new \LogicException('Fail')]);

        $expected = [
            'warning Random message',
            'critical Uncaught Exception!',
        ];
        $this->assertEquals($expected, $this->getLogs());
    }
}

class DummyTest
{
    public function __toString()
    {
    }
}
