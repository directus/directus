<?php
/**
 * @link      http://github.com/zendframework/zend-stdlib for the canonical source repository
 * @copyright Copyright (c) 2016 Zend Technologies USA Inc. (http://www.zend.com)
 * @license   http://framework.zend.com/license/new-bsd New BSD License
 */

namespace Zend\Stdlib;

/**
 * Utilities for console tooling.
 *
 * Provides the following facilities:
 *
 * - Colorize strings using markup (e.g., `<info>message</info>`,
 *   `<error>message</error>`)
 * - Write output to a specified stream, optionally with colorization.
 * - Write a line of output to a specified stream, optionally with
 *   colorization, using the system EOL sequence..
 * - Write an error message to STDERR.
 *
 * Colorization will only occur when expected sequences are discovered, and
 * then, only if the console terminal allows it.
 *
 * Essentially, provides the bare minimum to allow you to provide messages to
 * the current console.
 */
class ConsoleHelper
{
    const COLOR_GREEN = "\033[32m";
    const COLOR_RED   = "\033[31m";
    const COLOR_RESET = "\033[0m";

    const HIGHLIGHT_INFO  = 'info';
    const HIGHLIGHT_ERROR = 'error';

    private $highlightMap = [
        self::HIGHLIGHT_INFO  => self::COLOR_GREEN,
        self::HIGHLIGHT_ERROR => self::COLOR_RED,
    ];

    /**
     * @var string Exists only for testing.
     */
    private $eol = PHP_EOL;

    /**
     * @var resource Exists only for testing.
     */
    private $stderr = STDERR;

    /**
     * @var bool
     */
    private $supportsColor;

    /**
     * @param resource $resource
     */
    public function __construct($resource = STDOUT)
    {
        $this->supportsColor = $this->detectColorCapabilities($resource);
    }

    /**
     * Colorize a string for use with the terminal.
     *
     * Takes strings formatted as `<key>string</key>` and formats them per the
     * $highlightMap; if color support is disabled, simply removes the formatting
     * tags.
     *
     * @param string $string
     * @return string
     */
    public function colorize($string)
    {
        $reset = $this->supportsColor ? self::COLOR_RESET : '';
        foreach ($this->highlightMap as $key => $color) {
            $pattern = sprintf('#<%s>(.*?)</%s>#s', $key, $key);
            $color   = $this->supportsColor ? $color : '';
            $string  = preg_replace($pattern, $color . '$1' . $reset, $string);
        }
        return $string;
    }

    /**
     * @param string $string
     * @param bool $colorize Whether or not to colorize the string
     * @param resource $resource Defaults to STDOUT
     * @return void
     */
    public function write($string, $colorize = true, $resource = STDOUT)
    {
        if ($colorize) {
            $string = $this->colorize($string);
        }

        $string = $this->formatNewlines($string);

        fwrite($resource, $string);
    }

    /**
     * @param string $string
     * @param bool $colorize Whether or not to colorize the line
     * @param resource $resource Defaults to STDOUT
     * @return void
     */
    public function writeLine($string, $colorize = true, $resource = STDOUT)
    {
        $this->write($string . $this->eol, $colorize, $resource);
    }

    /**
     * Emit an error message.
     *
     * Wraps the message in `<error></error>`, and passes it to `writeLine()`,
     * using STDERR as the resource; emits an additional empty line when done,
     * also to STDERR.
     *
     * @param string $message
     * @return void
     */
    public function writeErrorMessage($message)
    {
        $this->writeLine(sprintf('<error>%s</error>', $message), true, $this->stderr);
        $this->writeLine('', false, $this->stderr);
    }

    /**
     * @param resource $resource
     * @return bool
     */
    private function detectColorCapabilities($resource = STDOUT)
    {
        if ('\\' === DIRECTORY_SEPARATOR) {
            // Windows
            return false !== getenv('ANSICON')
                || 'ON' === getenv('ConEmuANSI')
                || 'xterm' === getenv('TERM');
        }

        return function_exists('posix_isatty') && posix_isatty($resource);
    }

    /**
     * Ensure newlines are appropriate for the current terminal.
     *
     * @param string
     * @return string
     */
    private function formatNewlines($string)
    {
        $string = str_replace($this->eol, "\0PHP_EOL\0", $string);
        $string = preg_replace("/(\r\n|\n|\r)/", $this->eol, $string);
        return str_replace("\0PHP_EOL\0", $this->eol, $string);
    }
}
