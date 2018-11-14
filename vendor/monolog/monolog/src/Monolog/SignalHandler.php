<?php

/*
 * This file is part of the Monolog package.
 *
 * (c) Jordi Boggiano <j.boggiano@seld.be>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Monolog;

use Psr\Log\LoggerInterface;
use Psr\Log\LogLevel;
use ReflectionExtension;

/**
 * Monolog POSIX signal handler
 *
 * @author Robert Gust-Bardon <robert@gust-bardon.org>
 */
class SignalHandler
{
    private $logger;

    private $previousSignalHandler = array();
    private $signalLevelMap = array();
    private $signalRestartSyscalls = array();

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
    }

    public function registerSignalHandler($signo, $level = LogLevel::CRITICAL, $callPrevious = true, $restartSyscalls = true, $async = true)
    {
        if (!extension_loaded('pcntl') || !function_exists('pcntl_signal')) {
            return $this;
        }

        if ($callPrevious) {
            if (function_exists('pcntl_signal_get_handler')) {
                $handler = pcntl_signal_get_handler($signo);
                if ($handler === false) {
                    return $this;
                }
                $this->previousSignalHandler[$signo] = $handler;
            } else {
                $this->previousSignalHandler[$signo] = true;
            }
        } else {
            unset($this->previousSignalHandler[$signo]);
        }
        $this->signalLevelMap[$signo] = $level;
        $this->signalRestartSyscalls[$signo] = $restartSyscalls;

        if (function_exists('pcntl_async_signals') && $async !== null) {
            pcntl_async_signals($async);
        }

        pcntl_signal($signo, array($this, 'handleSignal'), $restartSyscalls);

        return $this;
    }

    public function handleSignal($signo, array $siginfo = null)
    {
        static $signals = array();

        if (!$signals && extension_loaded('pcntl')) {
            $pcntl = new ReflectionExtension('pcntl');
            $constants = $pcntl->getConstants();
            if (!$constants) {
                // HHVM 3.24.2 returns an empty array.
                $constants = get_defined_constants(true);
                $constants = $constants['Core'];
            }
            foreach ($constants as $name => $value) {
                if (substr($name, 0, 3) === 'SIG' && $name[3] !== '_' && is_int($value)) {
                    $signals[$value] = $name;
                }
            }
            unset($constants);
        }

        $level = isset($this->signalLevelMap[$signo]) ? $this->signalLevelMap[$signo] : LogLevel::CRITICAL;
        $signal = isset($signals[$signo]) ? $signals[$signo] : $signo;
        $context = isset($siginfo) ? $siginfo : array();
        $this->logger->log($level, sprintf('Program received signal %s', $signal), $context);

        if (!isset($this->previousSignalHandler[$signo])) {
            return;
        }

        if ($this->previousSignalHandler[$signo] === true || $this->previousSignalHandler[$signo] === SIG_DFL) {
            if (extension_loaded('pcntl') && function_exists('pcntl_signal') && function_exists('pcntl_sigprocmask') && function_exists('pcntl_signal_dispatch')
                && extension_loaded('posix') && function_exists('posix_getpid') && function_exists('posix_kill')) {
                    $restartSyscalls = isset($this->restartSyscalls[$signo]) ? $this->restartSyscalls[$signo] : true;
                    pcntl_signal($signo, SIG_DFL, $restartSyscalls);
                    pcntl_sigprocmask(SIG_UNBLOCK, array($signo), $oldset);
                    posix_kill(posix_getpid(), $signo);
                    pcntl_signal_dispatch();
                    pcntl_sigprocmask(SIG_SETMASK, $oldset);
                    pcntl_signal($signo, array($this, 'handleSignal'), $restartSyscalls);
                }
        } elseif (is_callable($this->previousSignalHandler[$signo])) {
            if (PHP_VERSION_ID >= 70100) {
                $this->previousSignalHandler[$signo]($signo, $siginfo);
            } else {
                $this->previousSignalHandler[$signo]($signo);
            }
        }
    }
}
