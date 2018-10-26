<?php

/*
 * This file is part of the Symfony package.
 *
 * (c) Fabien Potencier <fabien@symfony.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace Symfony\Component\Console\Helper;

use Symfony\Component\Console\Exception\InvalidArgumentException;
use Symfony\Component\Console\Exception\LogicException;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * @author Kevin Bond <kevinbond@gmail.com>
 */
class ProgressIndicator
{
    private $output;
    private $startTime;
    private $format;
    private $message;
    private $indicatorValues;
    private $indicatorCurrent;
    private $indicatorChangeInterval;
    private $indicatorUpdateTime;
    private $started = false;

    private static $formatters;
    private static $formats;

    /**
     * @param OutputInterface $output
     * @param string|null     $format                  Indicator format
     * @param int             $indicatorChangeInterval Change interval in milliseconds
     * @param array|null      $indicatorValues         Animated indicator characters
     */
    public function __construct(OutputInterface $output, string $format = null, int $indicatorChangeInterval = 100, array $indicatorValues = null)
    {
        $this->output = $output;

        if (null === $format) {
            $format = $this->determineBestFormat();
        }

        if (null === $indicatorValues) {
            $indicatorValues = array('-', '\\', '|', '/');
        }

        $indicatorValues = array_values($indicatorValues);

        if (2 > \count($indicatorValues)) {
            throw new InvalidArgumentException('Must have at least 2 indicator value characters.');
        }

        $this->format = self::getFormatDefinition($format);
        $this->indicatorChangeInterval = $indicatorChangeInterval;
        $this->indicatorValues = $indicatorValues;
        $this->startTime = time();
    }

    /**
     * Sets the current indicator message.
     *
     * @param string|null $message
     */
    public function setMessage($message)
    {
        $this->message = $message;

        $this->display();
    }

    /**
     * Starts the indicator output.
     *
     * @param $message
     */
    public function start($message)
    {
        if ($this->started) {
            throw new LogicException('Progress indicator already started.');
        }

        $this->message = $message;
        $this->started = true;
        $this->startTime = time();
        $this->indicatorUpdateTime = $this->getCurrentTimeInMilliseconds() + $this->indicatorChangeInterval;
        $this->indicatorCurrent = 0;

        $this->display();
    }

    /**
     * Advances the indicator.
     */
    public function advance()
    {
        if (!$this->started) {
            throw new LogicException('Progress indicator has not yet been started.');
        }

        if (!$this->output->isDecorated()) {
            return;
        }

        $currentTime = $this->getCurrentTimeInMilliseconds();

        if ($currentTime < $this->indicatorUpdateTime) {
            return;
        }

        $this->indicatorUpdateTime = $currentTime + $this->indicatorChangeInterval;
        ++$this->indicatorCurrent;

        $this->display();
    }

    /**
     * Finish the indicator with message.
     *
     * @param $message
     */
    public function finish($message)
    {
        if (!$this->started) {
            throw new LogicException('Progress indicator has not yet been started.');
        }

        $this->message = $message;
        $this->display();
        $this->output->writeln('');
        $this->started = false;
    }

    /**
     * Gets the format for a given name.
     *
     * @param string $name The format name
     *
     * @return string|null A format string
     */
    public static function getFormatDefinition($name)
    {
        if (!self::$formats) {
            self::$formats = self::initFormats();
        }

        return isset(self::$formats[$name]) ? self::$formats[$name] : null;
    }

    /**
     * Sets a placeholder formatter for a given name.
     *
     * This method also allow you to override an existing placeholder.
     *
     * @param string   $name     The placeholder name (including the delimiter char like %)
     * @param callable $callable A PHP callable
     */
    public static function setPlaceholderFormatterDefinition($name, $callable)
    {
        if (!self::$formatters) {
            self::$formatters = self::initPlaceholderFormatters();
        }

        self::$formatters[$name] = $callable;
    }

    /**
     * Gets the placeholder formatter for a given name.
     *
     * @param string $name The placeholder name (including the delimiter char like %)
     *
     * @return callable|null A PHP callable
     */
    public static function getPlaceholderFormatterDefinition($name)
    {
        if (!self::$formatters) {
            self::$formatters = self::initPlaceholderFormatters();
        }

        return isset(self::$formatters[$name]) ? self::$formatters[$name] : null;
    }

    private function display()
    {
        if (OutputInterface::VERBOSITY_QUIET === $this->output->getVerbosity()) {
            return;
        }

        $self = $this;

        $this->overwrite(preg_replace_callback("{%([a-z\-_]+)(?:\:([^%]+))?%}i", function ($matches) use ($self) {
            if ($formatter = $self::getPlaceholderFormatterDefinition($matches[1])) {
                return \call_user_func($formatter, $self);
            }

            return $matches[0];
        }, $this->format));
    }

    private function determineBestFormat()
    {
        switch ($this->output->getVerbosity()) {
            // OutputInterface::VERBOSITY_QUIET: display is disabled anyway
            case OutputInterface::VERBOSITY_VERBOSE:
                return $this->output->isDecorated() ? 'verbose' : 'verbose_no_ansi';
            case OutputInterface::VERBOSITY_VERY_VERBOSE:
            case OutputInterface::VERBOSITY_DEBUG:
                return $this->output->isDecorated() ? 'very_verbose' : 'very_verbose_no_ansi';
            default:
                return $this->output->isDecorated() ? 'normal' : 'normal_no_ansi';
        }
    }

    /**
     * Overwrites a previous message to the output.
     */
    private function overwrite(string $message)
    {
        if ($this->output->isDecorated()) {
            $this->output->write("\x0D\x1B[2K");
            $this->output->write($message);
        } else {
            $this->output->writeln($message);
        }
    }

    private function getCurrentTimeInMilliseconds()
    {
        return round(microtime(true) * 1000);
    }

    private static function initPlaceholderFormatters()
    {
        return array(
            'indicator' => function (ProgressIndicator $indicator) {
                return $indicator->indicatorValues[$indicator->indicatorCurrent % \count($indicator->indicatorValues)];
            },
            'message' => function (ProgressIndicator $indicator) {
                return $indicator->message;
            },
            'elapsed' => function (ProgressIndicator $indicator) {
                return Helper::formatTime(time() - $indicator->startTime);
            },
            'memory' => function () {
                return Helper::formatMemory(memory_get_usage(true));
            },
        );
    }

    private static function initFormats()
    {
        return array(
            'normal' => ' %indicator% %message%',
            'normal_no_ansi' => ' %message%',

            'verbose' => ' %indicator% %message% (%elapsed:6s%)',
            'verbose_no_ansi' => ' %message% (%elapsed:6s%)',

            'very_verbose' => ' %indicator% %message% (%elapsed:6s%, %memory:6s%)',
            'very_verbose_no_ansi' => ' %message% (%elapsed:6s%, %memory:6s%)',
        );
    }
}
