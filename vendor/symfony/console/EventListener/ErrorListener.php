<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\EventListener;

use Psr\Log\LoggerInterface;
use Symfony\Component\Console\ConsoleEvents;
use Symfony\Component\Console\Event\ConsoleErrorEvent;
use Symfony\Component\Console\Event\ConsoleEvent;
use Symfony\Component\Console\Event\ConsoleTerminateEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * @author James Halsall <james.t.halsall@googlemail.com>
 * @author Robin Chalas <robin.chalas@gmail.com>
 */
class ErrorListener implements EventSubscriberInterface
{
    private $logger;

    public function __construct(LoggerInterface $logger = null)
    {
        $this->logger = $logger;
    }

    public function onConsoleError(ConsoleErrorEvent $event)
    {
        if (null === $this->logger) {
            return;
        }

        $error = $event->getError();

        if (!$inputString = $this->getInputString($event)) {
            return $this->logger->error('An error occurred while using the console. Message: "{message}"', array('exception' => $error, 'message' => $error->getMessage()));
        }

        $this->logger->error('Error thrown while running command "{command}". Message: "{message}"', array('exception' => $error, 'command' => $inputString, 'message' => $error->getMessage()));
    }

    public function onConsoleTerminate(ConsoleTerminateEvent $event)
    {
        if (null === $this->logger) {
            return;
        }

        $exitCode = $event->getExitCode();

        if (0 === $exitCode) {
            return;
        }

        if (!$inputString = $this->getInputString($event)) {
            return $this->logger->debug('The console exited with code "{code}"', array('code' => $exitCode));
        }

        $this->logger->debug('Command "{command}" exited with code "{code}"', array('command' => $inputString, 'code' => $exitCode));
    }

    public static function getSubscribedEvents()
    {
        return array(
            ConsoleEvents::ERROR => array('onConsoleError', -128),
            ConsoleEvents::TERMINATE => array('onConsoleTerminate', -128),
        );
    }

    private static function getInputString(ConsoleEvent $event)
    {
        $commandName = $event->getCommand() ? $event->getCommand()->getName() : null;
        $input = $event->getInput();

        if (method_exists($input, '__toString')) {
            if ($commandName) {
                return str_replace(array("'$commandName'", "\"$commandName\""), $commandName, (string) $input);
            }

            return (string) $input;
        }

        return $commandName;
    }
}
